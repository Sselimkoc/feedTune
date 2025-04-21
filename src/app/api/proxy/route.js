import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import axios from "axios";

/**
 * CORS ve güvenlik ayarları
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS isteği için CORS yanıtı
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * Proxy servisi durum kontrolü
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "available",
      message: "Proxy service is running",
    },
    {
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Proxy API - CORS hatalarını önlemek için
 */
export async function POST(request) {
  try {
    // Oturum kontrolü
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Oturum gerekli" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // İstek verilerini al
    const {
      url,
      method = "GET",
      headers = {},
      data = null,
      maxRedirects = 5,
      skipCache = false,
      retryCount = 3,
      timeout = 15000,
    } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL gerekli" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // URL doğrulaması
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Geçersiz URL formatı" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Güvenli header'ları hazırla
    const safeHeaders = prepareSafeHeaders(headers, url, skipCache);

    // İsteği yap
    const response = await makeRequestWithRetry({
      url,
      method,
      headers: safeHeaders,
      data,
      maxRedirects,
      timeout,
      retryCount,
    });

    return NextResponse.json(response, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Proxy isteği başarısız",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * Güvenli header'ları hazırlar
 */
function prepareSafeHeaders(headers, url, skipCache) {
  // Hariç tutulan header'lar
  const excludedHeaders = [
    "host",
    "origin",
    "referer",
    "cookie",
    "connection",
    "user-agent",
  ];

  // Güvenli User-Agent listesi
  const safeUserAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36",
  ];

  // Temel header'lar
  const baseHeaders = {
    "User-Agent":
      safeUserAgents[Math.floor(Math.random() * safeUserAgents.length)],
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*",
  };

  // Origin ve Referer
  try {
    const urlObj = new URL(url);
    baseHeaders.Origin = urlObj.origin;
    baseHeaders.Referer = urlObj.origin;
  } catch (error) {
    console.warn("URL parsing error:", error);
  }

  // Cache kontrolü
  if (skipCache) {
    Object.assign(baseHeaders, {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  }

  // Kullanıcı header'larını filtrele ve ekle
  const filteredHeaders = Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => !excludedHeaders.includes(key.toLowerCase())
    )
  );

  return { ...baseHeaders, ...filteredHeaders };
}

/**
 * Yeniden deneme mekanizması ile istek yapar
 */
async function makeRequestWithRetry({
  url,
  method,
  headers,
  data,
  maxRedirects,
  timeout,
  retryCount,
}) {
  let lastError = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await axios({
        url,
        method: method.toUpperCase(),
        headers,
        data: method !== "GET" ? data : undefined,
        responseType: "arraybuffer",
        maxRedirects,
        timeout,
        validateStatus: null,
        withCredentials: false,
      });

      // Yanıtı işle
      return processResponse(response);
    } catch (error) {
      lastError = error;
      console.warn(
        `Attempt ${attempt + 1}/${retryCount} failed:`,
        error.message
      );

      if (attempt < retryCount - 1) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }
    }
  }

  throw lastError || new Error("Tüm yeniden denemeler başarısız oldu");
}

/**
 * Yanıtı işler
 */
function processResponse(response) {
  // Content-Type header'ını belirle
  const contentType =
    response.headers["content-type"] || "application/octet-stream";

  // Veriyi dönüştür
  let responseData;
  const isTextContent =
    contentType.includes("text/") ||
    contentType.includes("xml") ||
    contentType.includes("json") ||
    contentType.includes("javascript") ||
    contentType.includes("html");

  if (isTextContent) {
    responseData = response.data.toString("utf-8");
  } else if (contentType.includes("application/json")) {
    responseData = JSON.parse(response.data.toString("utf-8"));
  } else {
    responseData = Buffer.from(response.data).toString("base64");
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: responseData,
    isBase64Encoded:
      !isTextContent && !contentType.includes("application/json"),
    contentType,
    url: response.config.url,
  };
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { makeRequestWithRetry, prepareSafeHeaders } from "@/utils/apiUtils";

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
  return new Response(null, {
    status: 204,
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
    const supabase = createServerSupabaseClient();
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

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_CONTENT_TYPES = ["image/", "application/octet-stream"];

// Transparent 1×1 PNG fallback
const FALLBACK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const FALLBACK_RESPONSE = new NextResponse(FALLBACK_PNG, {
  headers: {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=3600",
  },
});

// Block private/loopback addresses to prevent SSRF
function isPrivateUrl(url) {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.endsWith(".local") ||
      hostname === "::1"
    );
  } catch {
    return true;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "url param is required" }, { status: 400 });
  }

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return FALLBACK_RESPONSE;
  }

  // Only allow http/https
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return FALLBACK_RESPONSE;
  }

  // SSRF protection
  if (isPrivateUrl(imageUrl)) {
    return FALLBACK_RESPONSE;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0; +https://feedtune.app)",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return FALLBACK_RESPONSE;
    }

    // Validate content type
    const contentType = response.headers.get("content-type") || "";
    const isImage = ALLOWED_CONTENT_TYPES.some((t) => contentType.startsWith(t));
    if (!isImage) {
      return FALLBACK_RESPONSE;
    }

    // Enforce size limit via Content-Length header
    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_SIZE_BYTES) {
      return FALLBACK_RESPONSE;
    }

    // Stream body with size cap
    const reader = response.body?.getReader();
    if (!reader) return FALLBACK_RESPONSE;

    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_SIZE_BYTES) {
        reader.cancel();
        return FALLBACK_RESPONSE;
      }
      chunks.push(value);
    }

    const imageBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType.split(";")[0].trim(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("[image-proxy] error:", error.message);
    }
    return FALLBACK_RESPONSE;
  }
}

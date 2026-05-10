import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { makeRequestWithRetry, prepareSafeHeaders } from "@/utils/apiUtils";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function GET() {
  return NextResponse.json({ status: "available" }, { headers: CORS_HEADERS });
}

export const POST = withAuth(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const {
    url,
    method = "GET",
    headers = {},
    data = null,
    maxRedirects = 5,
    skipCache = false,
    retryCount = 3,
    timeout = 15000,
  } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const safeHeaders = prepareSafeHeaders(headers, url, skipCache);
    const response = await makeRequestWithRetry({ url, method, headers: safeHeaders, data, maxRedirects, timeout, retryCount });
    return NextResponse.json(response, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("[proxy] error:", error);
    return NextResponse.json(
      { error: error.message || "Proxy request failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
});

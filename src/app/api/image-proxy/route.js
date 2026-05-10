import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const imageUrl = new URL(request.url).searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[image-proxy] error:", error);
    return NextResponse.json(
      { error: `Image proxy error: ${error.message}` },
      { status: 500 }
    );
  }
}

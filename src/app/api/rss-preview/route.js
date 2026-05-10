import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
      ["pubDate", "pubDate"],
    ],
  },
  requestOptions: {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)" },
  },
});

function resolveUrl(url, baseUrl) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) {
    try {
      return new URL(baseUrl).origin + url;
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "Please provide a valid URL" }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);

    const feedImage =
      feed.image?.url ||
      (typeof feed.image === "string" ? feed.image : null) ||
      null;

    const items = (feed.items || []).slice(0, 20).map((item) => {
      const thumb =
        item.mediaThumbnail?.url ||
        item.media?.url ||
        item.image?.url ||
        (typeof item.image === "string" ? item.image : null) ||
        null;

      return {
        title: item.title || "Untitled",
        description: item.description || item.content || "",
        link: item.link || "",
        pubDate: item.pubDate || item.published || new Date().toISOString(),
        author: item.creator || item.author || "",
        thumbnail: thumb ? resolveUrl(thumb, url) : null,
        guid: item.guid || item.link || item.title,
      };
    });

    return NextResponse.json({
      success: true,
      feed: {
        title: feed.title || "Unknown Feed",
        description: feed.description || "",
        link: feed.link || url,
        icon: feedImage ? resolveUrl(feedImage, url) : null,
        url,
      },
      items,
    });
  } catch (error) {
    console.error("[rss-preview] parse error:", error);
    return NextResponse.json(
      { error: `RSS preview failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const url = new URL(request.url).searchParams.get("url");
  if (url) {
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
    );
  }
  return NextResponse.json({ status: "available" });
}

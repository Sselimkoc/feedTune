import { NextResponse } from "next/server";
import Parser from "rss-parser";

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

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch feed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const content = await response.text();

    const parser = new Parser({
      customFields: {
        item: [
          ["media:content", "media"],
          ["media:thumbnail", "mediaThumbnail"],
          ["enclosure", "enclosure"],
          ["content:encoded", "contentEncoded"],
          ["dc:creator", "creator"],
          ["dc:date", "dcDate"],
          ["pubDate", "pubDate"],
          ["published", "published"],
          ["updated", "updated"],
        ],
        feed: ["image", "language", "updated", "published"],
      },
    });

    try {
      const feed = await parser.parseString(content);
      if (feed?.items?.length > 50) {
        feed.items = feed.items.slice(0, 50);
      }
      return NextResponse.json({ feed, success: true });
    } catch (parseError) {
      const isXML =
        content.includes("<?xml") ||
        content.includes("<rss") ||
        content.includes("<feed");

      if (!isXML) {
        return NextResponse.json(
          { error: "URL is not an RSS or Atom feed" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `RSS parsing error: ${parseError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[feed-proxy] error:", error);
    return NextResponse.json(
      { error: `Failed to process feed: ${error.message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
      ["content:encoded", "contentEncoded"],
      ["description", "description"],
    ],
  },
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Fetch the RSS feed content
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch RSS feed" },
        { status: response.status }
      );
    }

    const text = await response.text();
    
    // Parse the RSS feed
    const feed = await parser.parseString(text);

    // Transform the feed data
    const transformedFeed = {
      title: feed.title || "",
      description: feed.description || "",
      link: feed.link || url,
      items: (feed.items || []).map((item) => ({
        title: item.title || "",
        link: item.link || "",
        description: item.description || item.contentEncoded || "",
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        media: item.media?.$ || null,
      })),
    };

    return NextResponse.json(transformedFeed);
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    return NextResponse.json(
      { error: "Failed to parse RSS feed" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";
import Parser from "rss-parser";

/**
 * RSS Feed Preview API
 * Parses RSS feeds and returns metadata with items
 */

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
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)",
    },
  },
});

/**
 * Convert relative URL to absolute URL
 */
function resolveUrl(url, baseUrl) {
  if (!url) return null;

  // If already absolute, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If protocol-relative (//example.com), add https:
  if (url.startsWith("//")) {
    return "https:" + url;
  }

  // If path-relative (/path), use base domain
  if (url.startsWith("/")) {
    try {
      const baseUrlObj = new URL(baseUrl);
      return baseUrlObj.origin + url;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * RSS feed preview endpoint
 *
 * POST /api/rss-preview
 * Body:
 * - url: RSS feed URL
 * - skipCache: (optional) Skip cache for fresh data
 */
export async function POST(request) {
  console.log("RSS preview API POST called");

  try {
    const body = await request.json().catch((e) => {
      console.error("JSON parsing error:", e);
      return {};
    });

    console.log("Request body:", body);

    const { url, skipCache = true } = body;

    if (!url) {
      console.error("RSS preview requires URL parameter");
      return NextResponse.json(
        {
          success: false,
          error: "URL parameter is required",
        },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      console.error("Invalid URL provided:", url);
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid URL",
        },
        { status: 400 }
      );
    }

    try {
      // Use rss-parser to parse the RSS feed with items
      const feed = await parser.parseURL(url);

      if (!feed) {
        throw new Error("Failed to parse feed");
      }

      // Format feed data
      const feedImage =
        feed.image?.url ||
        feed.image?.["url"] ||
        (typeof feed.image === "string" ? feed.image : null) ||
        null;

      const feedData = {
        title: feed.title || "Unknown Feed",
        description: feed.description || "",
        link: feed.link || url,
        icon: feedImage ? resolveUrl(feedImage, url) : null,
        url: url,
      };

      // Format items
      const items = (feed.items || []).slice(0, 20).map((item) => {
        const itemImage =
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
          thumbnail: itemImage ? resolveUrl(itemImage, url) : null,
          guid: item.guid || item.link || item.title,
        };
      });

      return NextResponse.json({
        success: true,
        feed: feedData,
        items: items,
      });
    } catch (parseError) {
      console.error("Error parsing RSS feed:", parseError);
      throw parseError;
    }
  } catch (error) {
    console.error("RSS preview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `RSS preview failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET method support
 */
export async function GET(request) {
  console.log("RSS preview service GET called");

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (url) {
    console.log("GET request with URL parameter detected, processing...");
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })
    );
  }

  return NextResponse.json({
    status: "RSS preview service is running",
    time: new Date().toISOString(),
    note: "Add url parameter to preview an RSS feed",
  });
}

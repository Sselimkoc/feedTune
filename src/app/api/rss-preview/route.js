import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";

/**
 * RSS Feed Preview API
 * Parses RSS feeds and returns metadata
 */

/**
 * Parse RSS feed and extract metadata
 * @param {string} url - RSS feed URL
 * @returns {Promise<object>} - Feed metadata
 */
async function parseRssFeed(url) {
  try {
    // Fetch the RSS feed
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();

    // Basic XML parsing (in a real app, you'd use a proper XML parser)
    const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = xmlText.match(
      /<description[^>]*>([^<]+)<\/description>/i
    );
    const linkMatch = xmlText.match(/<link[^>]*>([^<]+)<\/link>/i);
    const imageMatch = xmlText.match(
      /<image[^>]*>.*?<url[^>]*>([^<]+)<\/url>/is
    );

    const title = titleMatch ? titleMatch[1].trim() : "Unknown Feed";
    const description = descriptionMatch ? descriptionMatch[1].trim() : "";
    const link = linkMatch ? linkMatch[1].trim() : url;
    const icon = imageMatch ? imageMatch[1].trim() : null;

    return {
      title,
      description,
      link,
      icon,
      url,
    };
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    throw new Error(`Failed to parse RSS feed: ${error.message}`);
  }
}

/**
 * RSS feed preview endpoint
 *
 * POST /api/rss-preview
 * Body:
 * - url: RSS feed URL
 */
export async function POST(request) {
  console.log("RSS preview API POST called");

  try {
    const body = await request.json().catch((e) => {
      console.error("JSON parsing error:", e);
      return {};
    });

    console.log("Request body:", body);

    const { url } = body;

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

    // Parse the RSS feed
    const feedData = await parseRssFeed(url);

    return NextResponse.json({
      success: true,
      feed: feedData,
    });
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

import { NextResponse } from "next/server";
import { parseRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * RSS feed parsing timeout - 15 seconds
 * Added protection for large RSS feeds
 */
const PARSE_TIMEOUT = 15000;

/**
 * Function that returns a Promise with a timeout
 * @param {Promise} promise - The original promise
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} errorMessage - Error message to display if timeout occurs
 * @returns {Promise} - Promise with timeout
 */
const withTimeout = (promise, timeout, errorMessage) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * RSS feed parsing endpoint
 *
 * Accepts a query parameter in the format ?url=https://example.com/rss
 * and parses the RSS feed, returning the result.
 */
export async function GET(request) {
  try {
   
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

 
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (e) {
      return NextResponse.json(
        { error: "Please enter a valid URL" },
        { status: 400 }
      );
    }

    const feedData = await withTimeout(
      parseRssFeed(url),
      PARSE_TIMEOUT,
      "RSS feed loading timeout. Please try a smaller feed."
    );

    const responseItems = (feedData.items || []).slice(0, 10);

    return NextResponse.json({
      feed: {
        title: feedData.title || "Untitled Feed",
        description: feedData.description || "",
        url: feedData.url || url,
        language: feedData.language || null,
        lastBuildDate: feedData.lastBuildDate || null,
      },
      items: responseItems,
    });
  } catch (error) {
    console.error("RSS parsing error:", error);

    if (error.message && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: error.message },
        { status: 408 } // Request Timeout status
      );
    }

    return NextResponse.json(
      { error: error.message || "RSS feed parsing failed" },
      { status: 500 }
    );
  }
}

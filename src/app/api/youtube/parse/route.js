import { NextResponse } from "next/server";
import { parseYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube channel parsing timeout - 15 seconds
 * Added protection for large responses
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
 * Validate channel ID
 * @param {string} channelId - Channel ID to validate
 * @returns {boolean} - Validation result
 */
const validateChannelId = (channelId) => {
  if (!channelId) return false;
  if (channelId.length > 2000) return false;

  try {
    if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
      new URL(
        channelId.startsWith("http") ? channelId : `https://${channelId}`
      );
      return true;
    }

    return (
      // UCxxxxxxxx and normal channel ID format (usually 11-24 characters)
      (channelId.startsWith("UC") &&
        channelId.length >= 11 &&
        channelId.length <= 24) ||
      // @username formatı
      channelId.startsWith("@") ||
      // Custom username (usually short and simple)
      (!/\s/.test(channelId) && channelId.length >= 3 && channelId.length <= 50)
    );
  } catch (error) {
    return false;
  }
};

/**
 * YouTube channel parsing endpoint
 *
 * Accepts a query parameter ?channelId=CHANNEL_ID
 * and returns the YouTube channel information
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
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId parameter is required" },
        { status: 400 }
      );
    }

    if (!validateChannelId(channelId)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid YouTube channel ID, username or URL",
        },
        { status: 400 }
      );  
    }

    const channelData = await withTimeout(
      parseYoutubeChannel(channelId),
      PARSE_TIMEOUT,
      "YouTube channel fetch timeout. Please try again."    
    );

    const responseVideos = (channelData.videos || []).slice(0, 5);

    return NextResponse.json({
      channel: channelData.channel,
      videos: responseVideos,
      suggestedChannels: channelData.suggestedChannels || [],
    });
  } catch (error) {
    console.error("YouTube channel parsing error:", error);

    if (error.message && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: error.message },
        { status: 408 } // Request Timeout status
        );
              }

      return NextResponse.json(
        { error: error.message || "YouTube channel parsing failed" },
        { status: 500 }
      );
    }
  }
 

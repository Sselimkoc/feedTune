import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { parseYoutubeChannel } from "@/lib/youtube/service";

export const dynamic = "force-dynamic";

const PARSE_TIMEOUT = 15000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("YouTube channel fetch timeout. Please try again.")), ms)
    ),
  ]);
}

function validateChannelId(channelId) {
  if (!channelId || channelId.length > 2000) return false;
  try {
    if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
      new URL(channelId.startsWith("http") ? channelId : `https://${channelId}`);
      return true;
    }
    return (
      (channelId.startsWith("UC") && channelId.length >= 11 && channelId.length <= 24) ||
      channelId.startsWith("@") ||
      (!/\s/.test(channelId) && channelId.length >= 3 && channelId.length <= 50)
    );
  } catch {
    return false;
  }
}

async function handleParse(channelId) {
  if (!channelId) return ApiResponse.badRequest("channelId is required");
  if (!validateChannelId(channelId)) {
    return ApiResponse.badRequest("Please enter a valid YouTube channel ID, username or URL");
  }

  try {
    const channelData = await withTimeout(parseYoutubeChannel(channelId), PARSE_TIMEOUT);
    return ApiResponse.ok({
      channel: channelData.channel,
      videos: (channelData.videos || []).slice(0, 5),
      suggestedChannels: channelData.suggestedChannels || [],
    });
  } catch (error) {
    console.error("[youtube/parse] error:", error);
    if (error.message?.includes("timeout")) {
      return ApiResponse.error(error.message, 408);
    }
    return ApiResponse.error(error.message || "YouTube channel parsing failed");
  }
}

export const GET = withAuth(async (request) => {
  const channelId = new URL(request.url).searchParams.get("channelId");
  return handleParse(channelId);
});

export const POST = withAuth(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }
  return handleParse(body.channelId);
});

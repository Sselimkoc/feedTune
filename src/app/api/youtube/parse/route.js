import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { resolveChannelId, getChannelInfo, getChannelVideos } from "@/lib/youtube";

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

function validateInput(channelId) {
  if (!channelId || channelId.length > 2000) return false;
  return true;
}

async function parseFn(channelId) {
  const resolvedId = await resolveChannelId(channelId) ?? channelId;
  const [info, videos] = await Promise.all([
    getChannelInfo(resolvedId),
    getChannelVideos(resolvedId, 5),
  ]);
  return {
    channel: {
      id: resolvedId,
      title: info.title,
      description: info.description,
      thumbnail: info.thumbnail,
      url: `https://youtube.com/channel/${resolvedId}`,
      rssUrl: info.rssUrl,
    },
    videos,
  };
}

async function handleParse(channelId) {
  if (!validateInput(channelId)) {
    return ApiResponse.badRequest("channelId is required");
  }

  try {
    const result = await withTimeout(parseFn(channelId), PARSE_TIMEOUT);
    return ApiResponse.ok({
      channel: result.channel,
      videos: result.videos,
      suggestedChannels: [],
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

import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";
import { youtubeService } from "@/lib/youtube/service";
import { searchChannels, getChannelById } from "@/lib/youtube/fetch-client";

function formatNumber(num) {
  if (!num || isNaN(Number(num))) return "Unknown";
  num = Number(num);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { query, url, keyword, language = "en" } = body;
  const searchQuery = query || keyword || url;

  if (!searchQuery) {
    return NextResponse.json(
      { error: "query, url, or keyword is required" },
      { status: 400 },
    );
  }

  if (url && isValidUrl(url)) {
    try {
      const channelId = await youtubeService.extractYoutubeChannelId(url);
      if (channelId) {
        const channelInfo = await youtubeService.getChannelInfo(channelId);
        if (channelInfo) {
          const subscriberCount =
            channelInfo.statistics?.subscriberCount || "Unknown";
          const videoCount = channelInfo.statistics?.videoCount || "0";
          const channelData = {
            id: channelId,
            title: channelInfo.title || "Unknown Channel",
            description: channelInfo.description || "",
            thumbnail: channelInfo.thumbnail || "",
            url: `https://youtube.com/channel/${channelId}`,
            subscribers: subscriberCount,
            subscribersFormatted: formatNumber(subscriberCount),
            videoCount,
            videoCountFormatted: formatNumber(videoCount),
          };
          return NextResponse.json({
            success: true,
            source: "channel_id",
            channel: channelData,
            channels: [
              {
                ...channelData,
                publishedAt:
                  channelInfo.publishedAt || new Date().toISOString(),
              },
            ],
          });
        }
      }
    } catch {
      // fall through to keyword search
    }
  }

  const results = await searchChannels(searchQuery, 5, language);

  if (!results || results.length === 0) {
    return NextResponse.json(
      { error: "No channels found", channels: [] },
      { status: 404 },
    );
  }

  let allChannelDetails = [];
  try {
    allChannelDetails = await Promise.all(
      results.map(async (channel) => {
        try {
          if (channel.id) {
            const details = await getChannelById(channel.id, language);
            if (details?.statistics) {
              return {
                subscriberCount:
                  details.statistics.subscriberCount || "Unknown",
                videoCount: details.statistics.videoCount || "0",
              };
            }
          }
        } catch {
          // ignore per-channel errors
        }
        return { subscriberCount: "Unknown", videoCount: "0" };
      }),
    );
  } catch {
    allChannelDetails = results.map(() => ({
      subscriberCount: "Unknown",
      videoCount: "0",
    }));
  }

  const primaryDetails = allChannelDetails[0] ?? {
    subscriberCount: "Unknown",
    videoCount: "0",
  };
  const primary = results[0];

  return NextResponse.json({
    success: true,
    source: "search",
    channel: {
      id: primary.id,
      title: primary.title || "Unknown Channel",
      description: primary.description || "",
      thumbnail: primary.thumbnail || "",
      url: `https://youtube.com/channel/${primary.id}`,
      subscribers: primaryDetails.subscriberCount,
      subscribersFormatted: formatNumber(primaryDetails.subscriberCount),
      videoCount: primaryDetails.videoCount,
      videoCountFormatted: formatNumber(primaryDetails.videoCount),
    },
    channels: results.map((channel, index) => {
      const details = allChannelDetails[index] ?? {
        subscriberCount: "Unknown",
        videoCount: "0",
      };
      return {
        id: channel.id,
        title: channel.title,
        description: channel.description,
        thumbnail: channel.thumbnail || "",
        url: `https://youtube.com/channel/${channel.id}`,
        publishedAt: channel.publishedAt,
        subscribers: details.subscriberCount,
        subscribersFormatted: formatNumber(details.subscriberCount),
        videoCount: details.videoCount,
        videoCountFormatted: formatNumber(details.videoCount),
      };
    }),
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const keyword = searchParams.get("keyword");
  const url = searchParams.get("url");

  if (query || keyword || url) {
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, keyword, url }),
      }),
    );
  }

  return NextResponse.json({ status: "available" });
}

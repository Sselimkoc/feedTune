import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";
import { resolveChannelId, getChannelInfo, searchChannels } from "@/lib/youtube";

function formatNumber(num) {
  if (!num || isNaN(Number(num))) return "Unknown";
  const n = Number(num);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

async function handleSearch({ query, url, keyword, language = "en" }) {
  const searchQuery = query || keyword || url;

  if (!searchQuery) {
    return NextResponse.json(
      { error: "query, url, or keyword is required" },
      { status: 400 }
    );
  }

  // If a URL is given, resolve the channel ID directly
  if (url && isValidUrl(url)) {
    try {
      const channelId = await resolveChannelId(url);
      if (channelId) {
        const info = await getChannelInfo(channelId);
        const channelData = {
          id: channelId,
          title: info.title,
          description: info.description,
          thumbnail: info.thumbnail,
          url: `https://youtube.com/channel/${channelId}`,
        };
        return NextResponse.json({
          success: true,
          source: "channel_id",
          channel: channelData,
          channels: [channelData],
        });
      }
    } catch {
      // fall through to keyword search
    }
  }

  // Keyword search
  try {
    const results = await searchChannels(searchQuery, 5);

    if (!results.length) {
      return NextResponse.json(
        { error: "No channels found", channels: [] },
        { status: 404 }
      );
    }

    const primary = results[0];
    return NextResponse.json({
      success: true,
      source: "search",
      channel: {
        ...primary,
        url: `https://youtube.com/channel/${primary.id}`,
      },
      channels: results.map((ch) => ({
        ...ch,
        url: `https://youtube.com/channel/${ch.id}`,
      })),
    });
  } catch (error) {
    console.error("[channel-search] error:", error);
    return NextResponse.json(
      { error: error.message || "Channel search failed" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  return handleSearch(body);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const keyword = searchParams.get("keyword");
  const url = searchParams.get("url");

  if (query || keyword || url) {
    return handleSearch({ query, keyword, url });
  }

  return NextResponse.json({ status: "available" });
}

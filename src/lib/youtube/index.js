import { createRssUrl, createThumbnailUrl } from "./utils";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

// #Shorts hashtag check first (free), then HEAD request to Shorts URL (no quota)
export async function detectIsShort(videoId, title = "", description = "") {
  if (/#[Ss]horts?\b/.test(title) || /#[Ss]horts?\b/.test(description)) return true;
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      redirect: "manual",
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function apiRequest(endpoint, params) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const url = new URL(`${YOUTUBE_API}/${endpoint}`);
  Object.entries({ ...params, key: apiKey }).forEach(([k, v]) =>
    url.searchParams.set(k, String(v))
  );

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `YouTube API error ${res.status}`;
    if (res.status === 403) throw new Error("YouTube API access denied — check your API key or quota");
    throw new Error(msg);
  }

  return res.json();
}

// Resolve a YouTube URL or handle to a UC... channel ID
export async function resolveChannelId(urlOrId) {
  if (!urlOrId) return null;

  // Already a UC... channel ID
  if (/^UC[\w-]{21,22}$/.test(urlOrId)) return urlOrId;

  let u;
  try {
    u = new URL(urlOrId.startsWith("http") ? urlOrId : `https://${urlOrId}`);
  } catch {
    return null;
  }

  // /channel/UCXXX
  const channelMatch = u.pathname.match(/\/channel\/(UC[\w-]{21,22})/);
  if (channelMatch) return channelMatch[1];

  // /@handle
  const handleMatch = u.pathname.match(/\/@([\w.-]+)/);
  if (handleMatch) {
    const data = await apiRequest("channels", { part: "id", forHandle: handleMatch[1] });
    return data.items?.[0]?.id ?? null;
  }

  // /user/username
  const userMatch = u.pathname.match(/\/user\/([\w.-]+)/);
  if (userMatch) {
    const data = await apiRequest("channels", { part: "id", forUsername: userMatch[1] });
    return data.items?.[0]?.id ?? null;
  }

  // /c/custom-name — fall back to search
  const cMatch = u.pathname.match(/\/c\/([\w.-]+)/);
  if (cMatch) {
    const channels = await searchChannels(cMatch[1], 1);
    return channels[0]?.id ?? null;
  }

  return null;
}

// Get channel title, description, thumbnail and RSS URL
export async function getChannelInfo(channelId) {
  const data = await apiRequest("channels", {
    part: "snippet",
    id: channelId,
  });

  const ch = data.items?.[0];
  if (!ch) throw new Error(`YouTube channel not found: ${channelId}`);

  const snippet = ch.snippet;
  return {
    title: snippet.title,
    description: snippet.description || "",
    thumbnail:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      "",
    rssUrl: createRssUrl(channelId),
  };
}

// Search for channels by keyword
export async function searchChannels(query, maxResults = 10) {
  const data = await apiRequest("search", {
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: Math.min(maxResults, 50),
  });

  return (data.items ?? []).map((item) => ({
    id: item.id.channelId,
    title: item.snippet.title,
    description: item.snippet.description || "",
    thumbnail:
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url ||
      "",
  }));
}

// Get recent videos for a channel via the uploads playlist
export async function getChannelVideos(channelId, maxResults = 20) {
  // First: get the uploads playlist ID
  const channelData = await apiRequest("channels", {
    part: "contentDetails",
    id: channelId,
  });

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  const playlistData = await apiRequest("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: Math.min(maxResults, 50),
  });

  return (playlistData.items ?? []).map((item) => {
    const videoId = item.contentDetails.videoId;
    return {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description || "",
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        createThumbnailUrl(videoId) ||
        "",
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  });
}

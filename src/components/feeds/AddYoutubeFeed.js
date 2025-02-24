"use client";

import { useState } from "react";
import { useFeedStore } from "@/store/useFeedStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function AddYoutubeFeed({ onBack, onSuccess }) {
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const feedStore = useFeedStore();
  const { session, checkSession } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelId) {
      toast.error("Please enter a YouTube channel ID");
      return;
    }

    // Ensure session is current
    await checkSession();

    if (!session?.access_token) {
      toast.error("Please sign in to add a YouTube feed");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching channel info for:", channelId);

      // Get channel info first
      const channelResponse = await fetch(
        `/api/proxy/youtube/channel?channelId=${encodeURIComponent(channelId)}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
        throw new Error(channelData.error || "Failed to fetch channel info");
      }

      if (!channelData.items?.[0]) {
        throw new Error("Channel not found");
      }

      const channelInfo = channelData.items[0];
      const channelTitle = channelInfo.snippet.title;
      const channelAvatar = channelInfo.snippet.thumbnails.default.url;

      console.log("Channel info fetched:", {
        title: channelTitle,
        avatar: channelAvatar,
      });

      // Get videos
      console.log("Fetching videos for channel:", channelId);

      const response = await fetch(
        `/api/proxy/youtube?channelId=${encodeURIComponent(channelId)}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch videos");
      }

      if (!data.items?.length) {
        throw new Error("No videos found for this channel");
      }

      console.log(`Found ${data.items.length} videos`);

      // Filter out shorts and format items
      const videos = data.items.map((item) => {
        const videoId = item.snippet.resourceId.videoId;
        return {
          id: item.id,
          title: item.snippet.title,
          link: `https://www.youtube.com/watch?v=${videoId}`,
          description: item.snippet.description,
          published_at: item.snippet.publishedAt,
          thumbnail:
            item.snippet.thumbnails?.maxres?.url ||
            item.snippet.thumbnails?.standard?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url,
          is_read: false,
          is_favorite: false,
        };
      });

      // Create feed for videos
      const videoFeed = {
        type: "youtube",
        title: channelTitle,
        link: `https://www.youtube.com/channel/${channelId}`,
        description: `Latest videos from ${channelTitle}`,
        channel_avatar: channelAvatar,
        items: videos,
      };

      console.log("Adding feed to store:", {
        type: videoFeed.type,
        title: videoFeed.title,
        itemCount: videos.length,
      });

      await feedStore.addFeed(videoFeed, session?.user?.id);
      setChannelId("");
      toast.success(`Added channel: ${channelTitle}`);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding YouTube feed:", error);
      toast.error(error.message || "Failed to add YouTube feed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Add YouTube Channel</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="Enter YouTube Channel ID (e.g., UCxxxxxxxx)"
          disabled={isLoading}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Channel"
          )}
        </Button>
      </form>
    </div>
  );
}

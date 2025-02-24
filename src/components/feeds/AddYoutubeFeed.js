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

      if (data.items?.length > 0) {
        const channelTitle = data.items[0].snippet?.channelTitle;
        const formattedData = {
          type: "youtube",
          title: channelTitle || "YouTube Channel",
          link: `https://www.youtube.com/channel/${channelId}`,
          description: `Latest videos from ${channelTitle}`,
          items: data.items.map((item) => ({
            title: item.snippet?.title,
            link: `https://www.youtube.com/watch?v=${item.snippet?.resourceId?.videoId}`,
            description: item.snippet?.description,
            publishedAt: item.snippet?.publishedAt,
            thumbnail: item.snippet?.thumbnails?.default?.url,
          })),
        };

        await feedStore.addFeed(formattedData, session?.user?.id);
        setChannelId("");
        toast.success(`Added channel: ${formattedData.title}`);
        onSuccess?.();
      } else {
        toast.warning("No videos found for this channel");
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error(error.message || "Failed to fetch videos");
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

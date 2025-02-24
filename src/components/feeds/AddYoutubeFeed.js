"use client";

import { useState } from "react";
import { useFeedStore } from "@/store/useFeedStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/useFeeds";
import { useYoutubeFeed } from "@/hooks/useYoutubeFeeds";
import { Label } from "@/components/ui/label";

export function AddYoutubeFeed({ onBack, onSuccess }) {
  const [channelId, setChannelId] = useState("");
  const { addFeed, isAddingFeed } = useFeeds();
  const { channelData, videos, isLoading, error } = useYoutubeFeed(channelId);
  const feedStore = useFeedStore();
  const { session, checkSession } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!channelId) {
      toast.error("Please enter a channel ID");
      return;
    }

    try {
      if (!channelData || !videos) {
        throw new Error("Failed to fetch channel data");
      }

      const feed = {
        type: "youtube",
        title: channelData.title,
        description: channelData.description,
        link: `https://www.youtube.com/channel/${channelId}`,
        items: videos.map((video) => ({
          title: video.title,
          description: video.description,
          link: `https://www.youtube.com/watch?v=${video.id}`,
          published_at: video.publishedAt,
          thumbnail: video.thumbnail,
        })),
      };

      await addFeed(feed);
      toast.success("Feed added successfully!");
      setChannelId("");
      onSuccess?.();
    } catch (error) {
      toast.error(`Error adding feed: ${error.message}`);
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
        <div>
          <Label htmlFor="channelId">YouTube Channel ID</Label>
          <Input
            id="channelId"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Enter channel ID"
            disabled={isAddingFeed}
          />
        </div>

        {error && <div className="text-red-500">{error.message}</div>}

        {isLoading && <div>Loading channel data...</div>}

        {channelData && (
          <div className="p-4 border rounded">
            <h3 className="font-bold">{channelData.title}</h3>
            <p className="text-sm text-gray-500">{channelData.description}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isAddingFeed || isLoading || !channelData}
        >
          {isAddingFeed ? "Adding..." : "Add Feed"}
        </Button>
      </form>
    </div>
  );
}

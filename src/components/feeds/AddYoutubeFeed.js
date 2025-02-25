"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFeeds } from "@/hooks/useFeeds";
import { useYoutubeFeed } from "@/hooks/useYoutubeFeeds";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";

export function AddYoutubeFeed({ onBack, onSuccess }) {
  const [channelId, setChannelId] = useState("");
  const { addYoutubeFeed, isAddingYoutubeFeed } = useFeeds();
  const { channelData, videos, isLoading, error } = useYoutubeFeed(channelId);
  const { user } = useAuthStore();

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

      const channel = channelData.items[0];
      const feed = {
        user_id: user.id,
        type: "youtube",
        title: channel.snippet.title,
        description: channel.snippet.description,
        channel_id: channelId,
        channel_avatar: channel.snippet.thumbnails.default.url,
        subscriber_count: channel.statistics?.subscriberCount,
        video_count: channel.statistics?.videoCount,
        playlist_id: channel.contentDetails?.relatedPlaylists?.uploads,
        items: videos.items.map((video) => ({
          title: video.snippet.title,
          description: video.snippet.description,
          link: `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`,
          published_at: video.snippet.publishedAt,
          video_id: video.snippet.resourceId.videoId,
          thumbnail: video.snippet.thumbnails.medium.url,
        })),
      };

      await addYoutubeFeed(feed);
      setChannelId("");
      toast.success(`Added channel: ${feed.title}`);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding feed:", error);
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
            disabled={isAddingYoutubeFeed}
          />
        </div>

        {error && <div className="text-red-500">{error.message}</div>}

        {isLoading && <div>Loading channel data...</div>}

        {channelData?.items?.[0] && (
          <div className="p-4 border rounded">
            <h3 className="font-bold">{channelData.items[0].snippet.title}</h3>
            {/* Channel logo will be added later */}
            <p className="text-sm text-muted-foreground">
              {channelData.items[0].snippet.description}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isAddingYoutubeFeed || isLoading || !channelData}
        >
          {isAddingYoutubeFeed ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Feed"
          )}
        </Button>
      </form>
    </div>
  );
}

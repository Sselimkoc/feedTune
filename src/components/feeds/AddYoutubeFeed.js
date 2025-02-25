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
import Image from "next/image";

// YouTube channel ID validation regex
const CHANNEL_ID_REGEX = /^UC[\w-]{21}[AQgw]$/;

export function AddYoutubeFeed({ onBack, onSuccess }) {
  const [formState, setFormState] = useState({
    channelId: "",
    error: "",
    isSubmitting: false,
  });

  const { addYoutubeFeed, isAddingYoutubeFeed } = useFeeds();
  const {
    channelData,
    videos,
    isLoading: isLoadingChannel,
    error: channelError,
  } = useYoutubeFeed(formState.channelId);
  const { user } = useAuthStore();

  const validateChannelId = (channelId) => {
    if (!channelId) return "Kanal ID zorunludur";
    if (!CHANNEL_ID_REGEX.test(channelId))
      return "Geçerli bir YouTube Kanal ID giriniz";
    return "";
  };

  const handleChannelIdChange = (e) => {
    const channelId = e.target.value;
    setFormState((prev) => ({
      ...prev,
      channelId,
      error: validateChannelId(channelId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateChannelId(formState.channelId);
    if (error) {
      setFormState((prev) => ({ ...prev, error }));
      toast.error(error);
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      if (!channelData || !videos) {
        throw new Error("Kanal bilgileri alınamadı");
      }

      const channel = channelData.items[0];
      const feed = {
        user_id: user.id,
        type: "youtube",
        title: channel.snippet.title,
        description: channel.snippet.description,
        channel_id: formState.channelId,
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
      setFormState((prev) => ({ ...prev, channelId: "" }));
      toast.success(`Added channel: ${feed.title}`);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding feed:", error);
      toast.error(`Error adding feed: ${error.message}`);
      setFormState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const isLoading =
    formState.isSubmitting || isAddingYoutubeFeed || isLoadingChannel;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Add YouTube Channel</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="channelId">YouTube Channel ID</Label>
          <Input
            id="channelId"
            value={formState.channelId}
            onChange={handleChannelIdChange}
            placeholder="Enter channel ID"
            disabled={isLoading}
            aria-invalid={!!formState.error}
            className={formState.error ? "border-red-500" : ""}
          />
          {formState.error && (
            <p className="text-sm text-red-500">{formState.error}</p>
          )}
        </div>

        {channelError && (
          <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {channelError.message}
            </p>
          </div>
        )}

        {channelData?.items?.[0] && (
          <div className="p-4 border rounded-md bg-card">
            <div className="flex items-center gap-4">
              {channelData.items[0].snippet.thumbnails?.default?.url && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={channelData.items[0].snippet.thumbnails.default.url}
                    alt={channelData.items[0].snippet.title}
                    width={48}
                    height={48}
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <div>
                <h3 className="font-bold">
                  {channelData.items[0].snippet.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {channelData.items[0].snippet.description}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !!formState.error || !channelData}
          className="w-full"
        >
          {isLoading ? (
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

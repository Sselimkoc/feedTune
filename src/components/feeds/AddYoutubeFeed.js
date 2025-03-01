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

// YouTube URL patterns
const URL_PATTERNS = [
  {
    pattern: /youtube\.com\/channel\/(UC[\w-]{21}[AQgw])/,
    type: "channel",
  },
  {
    pattern: /youtube\.com\/@([\w-]+)/,
    type: "handle",
  },
  {
    pattern: /@([\w-]+)/,
    type: "handle",
  },
  {
    pattern: /(UC[\w-]{21}[AQgw])/,
    type: "id",
  },
];

export function AddYoutubeFeed({ onBack, onSuccess }) {
  const [formState, setFormState] = useState({
    input: "",
    error: "",
    isSubmitting: false,
  });

  const { addYoutubeFeed } = useFeeds();
  const {
    channelData,
    videos,
    isLoading: isLoadingChannel,
    error: channelError,
  } = useYoutubeFeed(formState.input);
  const { user } = useAuthStore();

  const extractChannelInfo = (input) => {
    // Boş input kontrolü
    if (!input) return { error: "Kanal ID, URL veya kullanıcı adı zorunludur" };

    // URL'den veya handle'dan bilgi çıkarma denemesi
    for (const { pattern, type } of URL_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        if (type === "handle") {
          // Handle için direkt olarak handle'ı döndür
          return { input: `@${match[1]}` };
        }
        return { input: match[1] }; // Channel ID
      }
    }

    // Direkt ID kontrolü
    if (CHANNEL_ID_REGEX.test(input)) {
      return { input };
    }

    // Eğer @ ile başlıyorsa handle olarak kabul et
    if (input.startsWith("@")) {
      return { input };
    }

    return {
      error:
        "Geçerli bir YouTube kanal URL'si, ID'si veya kullanıcı adı (@kullanıcıadı) giriniz",
    };
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormState((prev) => ({
      ...prev,
      input: value,
    }));

    if (!value) {
      setFormState((prev) => ({
        ...prev,
        error: "Kanal ID, URL veya kullanıcı adı zorunludur",
      }));
      return;
    }

    const result = extractChannelInfo(value);
    if (result.error) {
      setFormState((prev) => ({
        ...prev,
        error: result.error,
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        input: result.input,
        error: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.input) {
      setFormState((prev) => ({
        ...prev,
        error: "Kanal ID, URL veya kullanıcı adı zorunludur",
      }));
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to add feeds");
      return;
    }

    if (!channelData) {
      toast.error("Channel information could not be loaded");
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await addYoutubeFeed({
        channelId: channelData.id,
        userId: user.id,
      });

      setFormState((prev) => ({ ...prev, input: "" }));
      toast.success("YouTube channel added successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error adding YouTube feed:", error);
      toast.error(error.message || "Failed to add YouTube channel");
      setFormState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const isLoading = formState.isSubmitting || isLoadingChannel;

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
          <Label htmlFor="channelInput">YouTube Channel</Label>
          <Input
            id="channelInput"
            value={formState.input}
            onChange={handleInputChange}
            placeholder="Enter channel URL, @handle, or ID"
            disabled={isLoading}
            aria-invalid={!!formState.error}
            className={formState.error ? "border-red-500" : ""}
          />
          {formState.error && (
            <p className="text-sm text-red-500">{formState.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Example formats:
            <br />• @channelname
            <br />• youtube.com/@channelname
            <br />• youtube.com/channel/UC...
            <br />• UC... (Channel ID)
          </p>
        </div>

        {channelError && (
          <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {channelError.message}
            </p>
          </div>
        )}

        {channelData && (
          <div className="p-4 border rounded-md bg-card">
            <div className="flex items-center gap-4">
              {channelData.thumbnail && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={channelData.thumbnail}
                    alt={channelData.title}
                    width={48}
                    height={48}
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{channelData.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {parseInt(
                      channelData.statistics.subscriberCount
                    ).toLocaleString()}{" "}
                    subscribers
                  </span>
                  <span>•</span>
                  <span>
                    {parseInt(
                      channelData.statistics.videoCount
                    ).toLocaleString()}{" "}
                    videos
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {channelData.description}
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFeeds } from "@/hooks/useFeeds";
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
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [channelData, setChannelData] = useState(null);

  const { addYoutubeFeed } = useFeeds();
  const { user } = useAuthStore();

  const validateInput = (value) => {
    if (!value) return "Kanal ID, URL veya kullanıcı adı zorunludur";

    // Sadece @ karakteri ise, geçerli kabul et
    if (value === "@") return "";

    // URL'den veya handle'dan bilgi çıkarma denemesi
    for (const { pattern, type } of URL_PATTERNS) {
      const match = value.match(pattern);
      if (match) return "";
    }

    // Direkt ID kontrolü
    if (CHANNEL_ID_REGEX.test(value)) return "";

    // Eğer @ ile başlıyorsa handle olarak kabul et
    if (value.startsWith("@")) return "";

    return "Geçerli bir YouTube kanal URL'si, ID'si veya kullanıcı adı (@kullanıcıadı) giriniz";
  };

  const extractChannelInfo = (value) => {
    // URL'den veya handle'dan bilgi çıkarma denemesi
    for (const { pattern, type } of URL_PATTERNS) {
      const match = value.match(pattern);
      if (match) {
        if (type === "handle") {
          // Handle için direkt olarak handle'ı döndür
          return `@${match[1]}`;
        }
        return match[1]; // Channel ID
      }
    }

    // Direkt ID kontrolü
    if (CHANNEL_ID_REGEX.test(value)) {
      return value;
    }

    // Eğer @ ile başlıyorsa handle olarak kabul et
    if (value.startsWith("@")) {
      return value;
    }

    return value;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Hata kontrolü
    const validationError = validateInput(value);
    setError(validationError);

    // Eğer @ karakteri ise veya hata varsa, arama yapma
    if (value === "@" || validationError) {
      setChannelData(null);
      return;
    }

    // Debounce için timeout
    const timeoutId = setTimeout(() => {
      searchChannel(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const searchChannel = async (value) => {
    // Eğer sadece @ karakteri veya boş ise, arama yapma
    if (!value || value === "@") {
      setChannelData(null);
      return;
    }

    // Arama sırasında input alanını devre dışı bırakmıyoruz
    setIsSearching(true);

    try {
      const channelInfo = extractChannelInfo(value);
      const isHandle = channelInfo.startsWith("@");

      const queryParams = isHandle
        ? `handle=${encodeURIComponent(channelInfo.slice(1))}`
        : `channelId=${encodeURIComponent(channelInfo)}`;

      const response = await fetch(`/api/youtube?${queryParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch YouTube data");
      }

      const data = await response.json();
      setChannelData(data.channel);
    } catch (error) {
      console.error("Error searching channel:", error);
      setError(error.message || "Failed to fetch YouTube data");
      setChannelData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input) {
      setError("Kanal ID, URL veya kullanıcı adı zorunludur");
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

    setIsSubmitting(true);

    try {
      await addYoutubeFeed({
        channelId: channelData.id,
        userId: user.id,
      });

      setInput("");
      setChannelData(null);
      toast.success("YouTube channel added successfully");

      onSuccess?.();
    } catch (error) {
      console.error("Error adding YouTube feed:", error);
      toast.error(error.message || "Failed to add YouTube channel");
      setError(error.message || "Failed to add YouTube channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isSearching;

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
            value={input}
            onChange={handleInputChange}
            placeholder="Enter channel URL, @handle, or ID"
            disabled={isSubmitting}
            aria-invalid={!!error}
            className={error ? "border-red-500" : ""}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Example formats:
            <br />• @channelname
            <br />• youtube.com/@channelname
            <br />• youtube.com/channel/UC...
            <br />• UC... (Channel ID)
          </p>
        </div>

        {isSearching && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {channelData && !isSearching && (
          <div className="p-4 border rounded-md bg-card">
            <div className="flex items-center gap-4">
              {channelData.thumbnail && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={channelData.thumbnail}
                    alt={channelData.title || "Channel"}
                    width={48}
                    height={48}
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">
                  {channelData.title || "Unknown Channel"}
                </h3>
                {channelData.statistics && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {parseInt(
                        channelData.statistics.subscriberCount || 0
                      ).toLocaleString()}{" "}
                      subscribers
                    </span>
                    <span>•</span>
                    <span>
                      {parseInt(
                        channelData.statistics.videoCount || 0
                      ).toLocaleString()}{" "}
                      videos
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {channelData.description || "No description available"}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !!error || !channelData}
          className="w-full"
        >
          {isSubmitting ? (
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

"use client";

import { useState, useMemo, useCallback } from "react";
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

  const extractChannelInfo = useCallback((input) => {
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
  }, []);

  const handleInputChange = useCallback(
    (e) => {
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
          error: "",
        }));
      }
    },
    [extractChannelInfo]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (formState.isSubmitting) return;

      if (!formState.input) {
        setFormState((prev) => ({
          ...prev,
          error: "Kanal ID, URL veya kullanıcı adı zorunludur",
        }));
        return;
      }

      if (formState.error) {
        return;
      }

      if (!channelData) {
        setFormState((prev) => ({
          ...prev,
          error: "Kanal bilgileri alınamadı",
        }));
        return;
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: true,
      }));

      try {
        // Kanal bilgilerini hazırla
        const feedData = {
          title: channelData.title,
          description: channelData.description,
          url: channelData.url,
          feed_url: channelData.id,
          icon_url:
            channelData.thumbnails?.high?.url ||
            channelData.thumbnails?.default?.url,
          type: "youtube",
          user_id: user.id,
        };

        // Feed'i ekle
        await addYoutubeFeed(feedData);

        toast.success("YouTube kanalı başarıyla eklendi");
        onSuccess?.();
      } catch (error) {
        console.error("Error adding YouTube feed:", error);
        toast.error("YouTube kanalı eklenirken bir hata oluştu");
        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: error.message,
        }));
      }
    },
    [formState, channelData, user, addYoutubeFeed, onSuccess]
  );

  const isValidInput = useMemo(() => {
    return formState.input && !formState.error;
  }, [formState.input, formState.error]);

  const channelThumbnail = useMemo(() => {
    if (!channelData) return null;
    return (
      channelData.thumbnails?.high?.url ||
      channelData.thumbnails?.medium?.url ||
      channelData.thumbnails?.default?.url
    );
  }, [channelData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">YouTube Kanalı Ekle</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="youtube-input">
            YouTube Kanal URL&apos;si, ID&apos;si veya Kullanıcı Adı
          </Label>
          <Input
            id="youtube-input"
            placeholder="https://youtube.com/@channelname veya @channelname"
            value={formState.input}
            onChange={handleInputChange}
            disabled={isLoadingChannel || formState.isSubmitting}
          />
          {formState.error && (
            <p className="text-sm text-destructive">{formState.error}</p>
          )}
        </div>

        {isLoadingChannel && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {channelData && !isLoadingChannel && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              {channelThumbnail && (
                <Image
                  src={channelThumbnail}
                  alt={channelData.title}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <h3 className="font-medium">{channelData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {channelData.subscriberCount} abone
                </p>
              </div>
            </div>

            <p className="text-sm line-clamp-3">{channelData.description}</p>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Son Videolar</h4>
              <ul className="space-y-2">
                {videos?.slice(0, 3).map((video) => (
                  <li key={video.id} className="text-sm">
                    {video.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={formState.isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={
              !isValidInput || isLoadingChannel || formState.isSubmitting
            }
          >
            {formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ekleniyor...
              </>
            ) : (
              "Kanalı Ekle"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

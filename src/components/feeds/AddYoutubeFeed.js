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
import { useLanguage } from "@/contexts/LanguageContext";

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
    channelId: "",
    error: "",
    isSubmitting: false,
  });
  const [channelData, setChannelData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { addYoutubeFeed } = useFeeds();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  // isLoading değişkenini tanımlayalım
  const isLoading = formState.isSubmitting || isSearching;

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
    setFormState((prev) => ({
      ...prev,
      channelId: value,
      error: validateInput(value),
    }));

    // Eğer @ karakteri ise veya hata varsa, arama yapma
    if (value === "@" || formState.error) {
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
    setFormState((prev) => ({
      ...prev,
      error: null,
    }));

    try {
      const channelInfo = extractChannelInfo(value);
      const isHandle = channelInfo.startsWith("@");

      const queryParams = isHandle
        ? `handle=${encodeURIComponent(channelInfo.slice(1))}`
        : `channelId=${encodeURIComponent(channelInfo)}`;

      console.log(
        `Searching for YouTube channel with ${
          isHandle ? "handle" : "channelId"
        }: ${isHandle ? channelInfo.slice(1) : channelInfo}`
      );

      const response = await fetch(`/api/youtube?${queryParams}`);

      // Hata durumunda
      if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API error response:", errorData);

        // Hata mesajını kullanıcı dostu hale getir
        let userFriendlyError = "YouTube kanalı bulunamadı.";

        if (response.status === 404) {
          userFriendlyError = `"${value}" için kanal bulunamadı. Lütfen kanal adını veya ID'sini kontrol edin.`;
        } else if (response.status === 401 || response.status === 403) {
          userFriendlyError =
            "YouTube API erişim hatası. Lütfen daha sonra tekrar deneyin.";
        } else if (errorData.error && errorData.error.includes("playlistId")) {
          userFriendlyError =
            "Bu kanal için video listesi alınamadı, ancak kanal bilgileri getirildi.";
          // Bu durumda kanalı yine de gösterebiliriz, sadece video listesi olmayacak
        } else if (errorData.error) {
          userFriendlyError = errorData.error;
        }

        throw new Error(userFriendlyError);
      }

      const data = await response.json();

      if (!data.channel) {
        throw new Error("Kanal bilgileri alınamadı.");
      }

      setChannelData(data.channel);
      setFormState((prev) => ({
        ...prev,
        error: null,
      }));
    } catch (error) {
      console.error("Error searching channel:", error);
      setFormState((prev) => ({
        ...prev,
        error: error.message || "YouTube kanalı aranırken bir hata oluştu.",
      }));
      setChannelData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.channelId) {
      setFormState((prev) => ({
        ...prev,
        error: "Kanal ID, URL veya kullanıcı adı zorunludur",
      }));
      return;
    }

    if (!channelData) {
      toast.error("Kanal bilgisi bulunamadı");
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
    }));

    try {
      await addYoutubeFeed({
        channelId: channelData.id,
        userId: user.id,
        channelData: {
          title: channelData.title,
          thumbnail: channelData.thumbnail,
          subscriberCount: channelData.subscriberCount,
          videoCount: channelData.videoCount,
        },
      });

      setFormState((prev) => ({
        ...prev,
        channelId: "",
        error: "",
      }));
      setChannelData(null);
      toast.success("YouTube channel added successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error adding YouTube feed:", error);
      toast.error(error.message || "Failed to add YouTube channel");
      setFormState((prev) => ({
        ...prev,
        error: error.message || "Failed to add YouTube channel",
      }));
    } finally {
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {t("feeds.addYoutubeFeed.title")}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="channelInput">
            {t("feeds.addYoutubeFeed.channelId")}
          </Label>
          <Input
            id="channelInput"
            value={formState.channelId}
            onChange={handleInputChange}
            placeholder={t("feeds.addYoutubeFeed.channelIdPlaceholder")}
            disabled={isLoading}
            aria-invalid={!!formState.error}
            className={formState.error ? "border-destructive" : ""}
          />
          {formState.error && (
            <p className="text-sm text-destructive">{formState.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("feeds.addYoutubeFeed.channelIdPlaceholder")}
          </p>
        </div>

        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">{t("feeds.addYoutubeFeed.searching")}</span>
          </div>
        )}

        {channelData && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              {channelData.thumbnail && (
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={channelData.thumbnail}
                    alt={channelData.title}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              )}
              <div>
                <h3 className="font-medium">{channelData.title}</h3>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {channelData.subscriberCount && (
                    <span>
                      {channelData.subscriberCount}{" "}
                      {t("feeds.addYoutubeFeed.subscriberCount")}
                    </span>
                  )}
                  {channelData.videoCount && (
                    <span>
                      {channelData.videoCount}{" "}
                      {t("feeds.addYoutubeFeed.videoCount")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !!formState.error || !channelData}
              className="w-full"
            >
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("feeds.addYoutubeFeed.add")
              )}
            </Button>
          </div>
        )}

        {!channelData &&
          !isSearching &&
          formState.channelId &&
          !formState.error && (
            <p className="text-center text-sm text-muted-foreground">
              {t("feeds.addYoutubeFeed.channelNotFound")}
            </p>
          )}
      </form>
    </div>
  );
}

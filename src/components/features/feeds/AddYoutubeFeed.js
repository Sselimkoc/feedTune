"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFeeds } from "@/hooks/features/useFeeds";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { debounce } from "lodash";

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
  const [searchResults, setSearchResults] = useState([]);

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

  const searchChannel = async (value) => {
    try {
      // En az 3 karakter kontrolü
      if (!value || value.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      // @ işareti ile başlayan aramalar için özel kontrol
      let searchQuery = value.trim();
      if (searchQuery.startsWith("@")) {
        searchQuery = searchQuery.slice(1);
      }

      // Sorguyu encode et ve boşlukları + ile değiştir
      searchQuery = encodeURIComponent(searchQuery.replace(/\s+/g, "+"));

      const response = await fetch(`/api/youtube?q=${searchQuery}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("feeds.addYoutubeFeed.error"));
      }

      if (!Array.isArray(data) || data.length === 0) {
        toast.error(t("feeds.addYoutubeFeed.channelNotFound"));
        setSearchResults([]);
        return;
      }

      setSearchResults(data);
    } catch (error) {
      console.error("Error searching channel:", error);
      setSearchResults([]);
      toast.error(t("feeds.addYoutubeFeed.searchError"));
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce ile arama fonksiyonunu optimize et
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (!value || value.length < 3) {
        setSearchResults([]);
        return;
      }
      await searchChannel(value);
    }, 500),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormState((prev) => ({
      ...prev,
      channelId: value,
      error: "",
    }));

    // Boş input kontrolü
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    debouncedSearch(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error(t("errors.unauthorized"));
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await addYoutubeFeed({
        channelId: formState.channelId,
        userId: user.id,
      });

      setFormState((prev) => ({ ...prev, channelId: "" }));
      setSearchResults([]);
      toast.success(t("feeds.addYoutubeFeed.success"));
      onSuccess?.();
    } catch (error) {
      console.error("Error adding YouTube feed:", error);
      toast.error(error.message || t("feeds.addYoutubeFeed.error"));
      setFormState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
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
          <Input
            id="channelId"
            name="channelId"
            type="text"
            value={formState.channelId}
            onChange={handleInputChange}
            placeholder={t("feeds.addYoutubeFeed.searchPlaceholder")}
            className={formState.error ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {formState.error && (
            <p className="text-xs text-destructive">{formState.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("feeds.addYoutubeFeed.searchDescription")}
          </p>
        </div>

        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t("feeds.addYoutubeFeed.searching")}
            </span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2 border rounded-lg p-2">
            {searchResults.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => {
                  setFormState((prev) => ({
                    ...prev,
                    channelId: channel.id,
                  }));
                  setSearchResults([]);
                }}
                className="flex items-center gap-3 w-full p-2 hover:bg-accent rounded-md transition-colors"
              >
                {channel.thumbnail && (
                  <Image
                    src={channel.thumbnail}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">{channel.title}</div>
                  {channel.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {channel.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!formState.channelId || formState.isSubmitting}
        >
          {formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("feeds.addYoutubeFeed.adding")}
            </>
          ) : (
            t("feeds.addYoutubeFeed.add")
          )}
        </Button>
      </form>
    </div>
  );
}

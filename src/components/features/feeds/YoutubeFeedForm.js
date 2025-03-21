"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Check,
  Video,
  Eye,
  Plus,
  X,
  Users2,
  Youtube as YoutubeIcon,
  ChevronRight,
  ArrowLeft,
  MousePointerClick,
  AlertCircle,
  Calendar,
  Film,
  ChevronLeft,
  RefreshCw,
  PlayCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useYoutubeFeeds } from "@/hooks/features/useYoutubeFeeds";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebouncedCallback } from "use-debounce";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Youtube } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Image from "next/image";

// Varsayılan thumbnail URL'si
const DEFAULT_THUMBNAIL = "https://i.ytimg.com/vi/default/default.jpg";

/**
 * Özel CSS stilleri
 */
const styles = {
  channelScroller:
    "scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent",
  videoGrid: "grid grid-cols-1 sm:grid-cols-2 gap-2",
  hoverCardMobile:
    "sm:hidden fixed inset-0 z-50 p-4 bg-background/95 overflow-auto",
  hoverCardDesktop: "hidden sm:block",
  channelRow:
    "flex space-x-2 pb-2 overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent scroll-smooth",
  channelItem: "flex-shrink-0 snap-start w-[140px] xs:w-[160px] sm:w-[180px]",
  articleScroller:
    "flex pb-2 overflow-x-hidden snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent scroll-smooth",
  articleContainer: "grid grid-cols-1 sm:grid-cols-3 gap-4 w-full",
  articleItem: "flex-shrink-0 snap-start w-full",
  articlesContainer: "overflow-hidden relative",
};

/**
 * Abone sayısını formatla (Örn: 1.2M, 450K)
 * @param {number} count - Abone sayısı
 * @returns {string} - Formatlanmış sayı
 */
const formatSubscriberCount = (count) => {
  if (!count) return t("feeds.addYoutubeFeed.noSubscribers");

  try {
    const num = parseInt(count);
    if (isNaN(num)) return t("feeds.addYoutubeFeed.noSubscribers");

    if (num >= 1000000) {
      return t("feeds.addYoutubeFeed.subscriberCount.millions", {
        count: (num / 1000000).toFixed(1),
      });
    } else if (num >= 1000) {
      return t("feeds.addYoutubeFeed.subscriberCount.thousands", {
        count: (num / 1000).toFixed(1),
      });
    } else {
      return t("feeds.addYoutubeFeed.subscriberCount.base", { count: num });
    }
  } catch (error) {
    console.error("[YoutubeFeedForm] Abone sayısı formatlanırken hata:", error);
    return t("feeds.addYoutubeFeed.noSubscribers");
  }
};

/**
 * Basit URL veya kanal ID validasyonu
 * Tam doğrulama için API çağrısı yapmayız, sadece temel format kontrolü
 */
const isValidChannelInput = (value) => {
  if (!value || value.length < 2) return false;

  // URL formatı kontrolü
  if (value.includes("youtube.com") || value.includes("youtu.be")) {
    try {
      new URL(value.startsWith("http") ? value : `https://${value}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Kanal ID veya kullanıcı adı formatı kontrolü
  return (
    value.startsWith("UC") ||
    value.startsWith("@") ||
    (!value.includes(" ") && value.length >= 3)
  );
};

/**
 * YouTube Besleme Formu
 *
 * @param {Object} props
 * @param {Function} props.onSuccess - Başarılı ekleme sonrası çağrılacak fonksiyon
 * @param {Function} props.onCancel - İptal edildiğinde çağrılacak fonksiyon
 * @param {Function} props.onPreviewModeChange - Önizleme modu değiştiğinde çağrılacak fonksiyon
 * @param {string} props.initialQuery - Başlangıç için girilen arama sorgusu
 * @param {boolean} props.isParentPreviewMode - Önizleme modunun parent bileşende aktif olup olmadığı
 */
export default function YoutubeFeedForm({
  onSuccess,
  onCancel,
  onPreviewModeChange,
  initialQuery = "",
  isParentPreviewMode = false,
}) {
  const [channelId, setChannelId] = useState(initialQuery);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleChannels, setVisibleChannels] = useState(6);
  const channelRowRef = useRef(null);
  const channelsContainerRef = useRef(null);

  const { parseYoutubeChannel, addYoutubeChannel } = useYoutubeFeeds();
  const { t } = useLanguage();

  const handlePreview = async (query) => {
    if (!query) return;

    try {
      setIsLoading(true);
      const data = await parseYoutubeChannel(query);
      setPreviewData(data);
      setIsPreview(true);
      onPreviewModeChange?.(true);
    } catch (error) {
      toast.error(error.message);
      setIsPreview(false);
      setPreviewData(null);
      onPreviewModeChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && isParentPreviewMode) {
      handlePreview(initialQuery);
    }
  }, [initialQuery, isParentPreviewMode]);

  const handleBack = () => {
    if (isPreview) {
      setIsPreview(false);
      setPreviewData(null);
      onPreviewModeChange?.(false);
    } else if (onCancel) {
      onCancel();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!channelRowRef.current || !previewData?.suggestedChannels) return;

      const { scrollLeft, scrollWidth, clientWidth } = channelRowRef.current;
      const scrollEnd = scrollWidth - scrollLeft - clientWidth;

      if (
        scrollEnd < 200 &&
        visibleChannels < previewData.suggestedChannels.length
      ) {
        setVisibleChannels((prev) =>
          Math.min(prev + 3, previewData.suggestedChannels.length)
        );
      }
    };

    const channelRow = channelRowRef.current;
    if (channelRow) {
      channelRow.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (channelRow) {
        channelRow.removeEventListener("scroll", handleScroll);
      }
    };
  }, [previewData?.suggestedChannels, visibleChannels]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!channelRowRef.current) return;

      if (e.deltaY !== 0) {
        e.preventDefault();
        channelRowRef.current.scrollBy({
          left: e.deltaY > 0 ? 100 : -100,
          behavior: "smooth",
        });
      }
    };

    const channelRow = channelRowRef.current;
    if (channelRow) {
      channelRow.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (channelRow) {
        channelRow.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const scrollLeft = () => {
    if (channelsContainerRef.current) {
      const container = channelsContainerRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (channelsContainerRef.current) {
      const container = channelsContainerRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddChannel = async () => {
    if (!previewData?.channel?.id) return;

    try {
      setIsLoading(true);
      const channelData = {
        type: "youtube",
        channelId: previewData.channel.id,
        title: previewData.channel.title || "İsimsiz Kanal",
        url: `https://www.youtube.com/channel/${previewData.channel.id}`,
        thumbnail: safeGetChannelThumbnail(previewData.channel),
        description: previewData.channel.description || "",
        subscriberCount: previewData.channel.subscriberCount,
        videoCount: previewData.channel.videoCount,
      };

      await addYoutubeChannel(channelData);
      toast.success(`"${channelData.title}" kanalı başarıyla eklendi!`);
      onSuccess?.(channelData);
    } catch (error) {
      toast.error("Kanal eklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChannel = async (channel) => {
    if (!channel?.id) {
      toast.error("Kanal bilgileri eksik. Lütfen tekrar deneyin.");
      return;
    }

    setChannelId(channel.id);
    await handlePreview(channel.id);
  };

  // Besleme arama formunu render et
  const renderSearchForm = () => (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="channelUrl"
          className="text-sm font-medium mb-1.5 block"
        >
          {t("feeds.addYoutubeFeed.searchPlaceholder")}
        </Label>
        <div className="relative">
          <Input
            id="channelUrl"
            name="channelUrl"
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder={t("feeds.addYoutubeFeed.searchPlaceholder")}
            disabled={isLoading}
            aria-invalid={!!error}
            className={cn(
              "bg-background pr-10",
              error ? "border-destructive" : ""
            )}
            maxLength={2000}
          />
          {channelId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setChannelId("");
                setError("");
              }}
              aria-label={t("common.clear")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {error ? (
          <p className="text-xs text-destructive mt-1.5">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1.5">
            {t("feeds.addYoutubeFeed.searchDescription")}
          </p>
        )}
      </div>

      {/* Bulunan Kanallar */}
      {previewData?.suggestedChannels.length > 0 && (
        <div
          className="space-y-3"
          role="list"
          aria-label={t("feeds.addYoutubeFeed.foundChannels")}
        >
          {previewData.suggestedChannels
            .slice(0, visibleChannels)
            .map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onSelect={handleSelectChannel}
                parseYoutubeChannel={parseYoutubeChannel}
                isAddingChannel={isLoading}
              />
            ))}
        </div>
      )}
    </div>
  );

  // YouTube kanal önizleme bileşeni
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div
          className="p-4 sm:p-6 py-8 flex flex-col items-center justify-center space-y-5 text-center border rounded-lg bg-background/50"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="w-10 h-10 animate-spin text-primary"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-lg font-medium">
              {t("feeds.addYoutubeFeed.loadingChannel")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("feeds.addYoutubeFeed.loadingDescription")}
            </p>
          </div>
        </div>
      );
    }

    if (!previewData) {
      return (
        <div
          className="p-4 sm:p-6 py-6 sm:py-8 flex flex-col items-center justify-center border rounded-lg bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 space-y-4"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-10 h-10" aria-hidden="true" />
          <div className="text-center">
            <h3 className="text-lg font-medium">
              {t("feeds.addYoutubeFeed.loadError")}
            </h3>
            <p className="text-sm mt-2 max-w-md">
              {t("feeds.addYoutubeFeed.loadErrorDescription")}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsPreview(false)}
            >
              {t("common.back")}
            </Button>
          </div>
        </div>
      );
    }

    // API kota hatası için özel görünüm
    if (previewData.channel?.quotaExceeded) {
      return (
        <div
          className="p-5 sm:p-8 flex flex-col items-center justify-center border rounded-lg bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 space-y-5"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-amber-100 dark:bg-amber-800/30 p-3 rounded-full">
            <AlertCircle
              className="w-8 h-8 sm:w-10 sm:h-10"
              aria-hidden="true"
            />
          </div>

          <div className="text-center max-w-lg">
            <h3 className="text-lg sm:text-xl font-medium">
              {t("feeds.addYoutubeFeed.quotaError")}
            </h3>

            <p className="text-sm sm:text-base mt-2 mb-4">
              {t("feeds.addYoutubeFeed.quotaErrorDescription")}
            </p>

            <ul
              className="text-sm sm:text-base space-y-2 text-left mb-4 ml-4"
              aria-label={t("feeds.addYoutubeFeed.quotaErrorReasons")}
            >
              <li className="flex items-start gap-2">
                <span className="mt-1" aria-hidden="true">
                  •
                </span>
                <span>{t("feeds.addYoutubeFeed.quotaErrorReason1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1" aria-hidden="true">
                  •
                </span>
                <span>{t("feeds.addYoutubeFeed.quotaErrorReason2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1" aria-hidden="true">
                  •
                </span>
                <span>{t("feeds.addYoutubeFeed.quotaErrorReason3")}</span>
              </li>
            </ul>

            <p className="text-sm sm:text-base mb-5">
              {t("feeds.addYoutubeFeed.quotaErrorSolution")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setIsPreview(false)}
                className="border-amber-300 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:hover:bg-amber-800/30"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("common.back")}
              </Button>

              <Button
                onClick={() => handlePreview(channelId)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("common.retry")}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const { channel, videos = [], suggestedChannels = [] } = previewData;

    return (
      <div className="space-y-5 md:space-y-6 w-full">
        {/* Kanal Bilgileri */}
        <div className="p-4 sm:p-5 md:p-6 border rounded-xl bg-card flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 relative overflow-hidden">
          {/* Kanal arkaplan banner resmi */}
          {safeGetChannelBanner(previewData.channel) ? (
            <div className="absolute inset-0 w-full h-full">
              <img
                src={safeGetChannelBanner(previewData.channel)}
                alt="Kanal banner"
                className="w-full h-full object-cover opacity-20"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  // Hata durumunda varsayılan gradient göster
                  const parent = e.target.parentElement;
                  if (parent) {
                    parent.classList.add(
                      "bg-gradient-to-br",
                      "from-primary/5",
                      "to-primary/10"
                    );
                  }
                }}
              />
              {/* Banner üzerinde karartma efekti */}
              <div className="absolute inset-0 bg-card/60 dark:bg-card/80 backdrop-blur-[2px]"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-50" />
          )}

          {/* Kanal avatar - iyileştirilmiş versiyon */}
          <div className="relative z-10 rounded-full overflow-hidden border-4 border-background shadow-md">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-muted flex items-center justify-center">
              {safeGetChannelThumbnail(previewData.channel) ? (
                <img
                  src={safeGetChannelThumbnail(previewData.channel)}
                  alt={previewData.channel.title || "Kanal avatarı"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log(
                      "Kanal resmi yüklenemedi, varsayılan resim kullanılıyor"
                    );
                    e.target.onerror = null;
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Cpath d='m9 18 6-6'/%3E%3Cpath d='m9 12 6 6'/%3E%3C/svg%3E";
                    e.target.className = "w-1/2 h-1/2 text-muted-foreground";
                  }}
                />
              ) : (
                <YoutubeIcon className="w-1/2 h-1/2 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Kanal bilgileri */}
          <div className="relative z-10 flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
              {previewData.channel.title || "İsimsiz Kanal"}
            </h2>

            <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-center sm:justify-start mt-2">
              <Badge
                variant="outline"
                className="text-xs md:text-sm font-normal px-2 py-0.5 gap-1"
              >
                <Users2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {formatSubscriberCount(previewData.channel.subscriberCount)}
              </Badge>

              <Badge
                variant="outline"
                className="text-xs md:text-sm font-normal px-2 py-0.5 gap-1"
              >
                <Film className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {previewData.channel.videoCount || 0} Video
              </Badge>

              {previewData.channel.publishedAt && (
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm font-normal px-2 py-0.5 gap-1"
                >
                  <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {t("feeds.lastUpdated", {
                    date: new Date(
                      previewData.channel.publishedAt
                    ).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                  })}
                </Badge>
              )}
            </div>

            {previewData.channel.description && (
              <p className="text-xs md:text-sm text-muted-foreground mt-2 md:mt-3 line-clamp-2 md:line-clamp-3">
                {previewData.channel.description}
              </p>
            )}

            <div className="mt-3 md:mt-4">
              <Button
                onClick={handleAddChannel}
                disabled={isLoading}
                className="gap-2"
                size="sm"
                aria-label="Kanalı Ekle"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                    <span className="hidden sm:inline">Ekleniyor...</span>
                    <span className="sm:hidden">Ekleniyor</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Kanalı Ekle</span>
                    <span className="sm:hidden">Ekle</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Son Videolar - Kaydırmalı Görünüm */}
        {videos.length > 0 && (
          <Card
            className={cn(
              "bg-card border-muted shadow-sm",
              styles.articlesContainer
            )}
          >
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h4 className="text-sm sm:text-base font-medium">
                    Son Videolar
                  </h4>
                  <Badge variant="secondary" className="ml-2">
                    {t("feeds.articleCount", { count: videos.length })}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <HoverCard openDelay={0} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <div className="hidden sm:flex items-center cursor-help text-xs text-muted-foreground border border-dashed border-muted-foreground/40 rounded-md px-1.5 py-0.5">
                        <MousePointerClick className="h-3 w-3 mr-1" />
                        <span>Fare tekerleği ile kaydır</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-80 text-sm p-3"
                      side="bottom"
                    >
                      <div className="flex justify-between space-x-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">
                            Kolay Kaydırma
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Videolar arasında geçiş yapmak için fare imlecini
                            videoların üzerine getirip fare tekerleğini
                            kullanabilirsiniz.
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  {/* Mobil cihazlar için kaydırma ipucu */}
                  <div className="flex sm:hidden items-center text-[9px] text-muted-foreground">
                    <span className="animate-pulse">← kaydır →</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return <div>{isPreview ? renderPreview() : renderSearchForm()}</div>;
}

/**
 * ChannelCard bileşeni - modern kompakt versiyon
 * @param {Object} props
 * @param {Object} props.channel - Kanal bilgileri
 * @param {Function} props.onSelect - Kanalı seçme fonksiyonu
 * @param {Function} props.parseYoutubeChannel - Kanal verilerini getirme fonksiyonu
 * @param {boolean} props.isAddingChannel - Ekleme işlemi sırasında mı?
 */
const ChannelCard = memo(function ChannelCard({
  channel,
  onSelect,
  parseYoutubeChannel,
  isAddingChannel,
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);

  const handleMouseEnter = async () => {
    setIsHovering(true);
    if (!videoData && !isLoading) {
      setIsLoading(true);
      try {
        const data = await parseYoutubeChannel(channel.id);
        setVideoData(data);
      } catch (error) {
        setVideoData(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <HoverCard openDelay={300} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Card
            className="h-full bg-card hover:bg-accent/5 transition-colors cursor-pointer border-muted"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => onSelect(channel)}
            role="button"
            aria-label={t("feeds.addYoutubeFeed.selectChannel", {
              channel:
                channel.title || t("feeds.addYoutubeFeed.unknownChannel"),
            })}
          >
            <CardContent className="p-3 sm:p-4 h-full flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                {channel.thumbnailUrl ? (
                  <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-muted flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_THUMBNAIL;
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <YoutubeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs sm:text-sm truncate">
                    {channel.title || "İsimsiz Kanal"}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {formatSubscriberCount(channel.subscriberCount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2 sm:pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-[10px] sm:text-xs h-6 sm:h-7"
                  disabled={isAddingChannel}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(channel);
                  }}
                >
                  <Plus className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-64 p-3 shadow-lg z-50 hidden sm:block"
          side="right"
          align="start"
          sideOffset={5}
        >
          {isLoading ? (
            <div
              className="py-8 flex flex-col items-center justify-center"
              role="status"
              aria-label={t("feeds.addYoutubeFeed.loadingVideos")}
            >
              <Loader2
                className="h-8 w-8 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("feeds.addYoutubeFeed.loadingVideos")}
              </p>
            </div>
          ) : videoData?.videos && videoData.videos.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-medium flex items-center gap-1 mb-1">
                <Video className="w-3 h-3" aria-hidden="true" />
                {t("feeds.addYoutubeFeed.recentVideos")}
              </h4>
              <div
                className="space-y-2"
                role="list"
                aria-label={t("feeds.addYoutubeFeed.recentVideos")}
              >
                {videoData.videos.slice(0, 3).map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-2 text-xs group hover:bg-accent/20 rounded-md p-1"
                    role="listitem"
                  >
                    <div className="relative w-14 h-8 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={video.thumbnailUrl || DEFAULT_THUMBNAIL}
                        alt={t("feeds.addYoutubeFeed.videoThumbnail", {
                          title:
                            video.title ||
                            t("feeds.addYoutubeFeed.unknownVideo"),
                        })}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_THUMBNAIL;
                        }}
                      />
                    </div>
                    <p className="flex-1 line-clamp-2 text-xs">
                      {video.title || t("feeds.addYoutubeFeed.unknownVideo")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="py-4 text-center text-muted-foreground"
              role="status"
              aria-label={t("feeds.addYoutubeFeed.noVideos")}
            >
              <Video
                className="w-6 h-6 mx-auto mb-2 opacity-50"
                aria-hidden="true"
              />
              <p className="text-xs">{t("feeds.addYoutubeFeed.noVideos")}</p>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
});

/**
 * Video Kartı Bileşeni
 * @param {Object} props
 * @param {Object} props.item - Video bilgileri
 */
const VideoCard = memo(function VideoCard({ item }) {
  const { t } = useLanguage();

  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getThumbnail = () => {
    if (item.thumbnail) return item.thumbnail;
    if (item.enclosure?.url) return item.enclosure.url;
    if (item.media && item.media.length > 0) {
      const mediaItem = item.media.find((m) => m.$ && m.$.url);
      if (mediaItem) return mediaItem.$.url;
    }
    return null;
  };

  const thumbnail = getThumbnail();

  return (
    <Card
      className="h-full bg-card hover:bg-accent/5 transition-colors border-muted"
      role="article"
      aria-label={item.title || t("feeds.addYoutubeFeed.unknownVideo")}
    >
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        {thumbnail && (
          <div className="w-full h-32 mb-3 overflow-hidden rounded-md relative group">
            <img
              src={thumbnail}
              alt={t("feeds.addYoutubeFeed.videoThumbnail", {
                title: item.title || t("feeds.addYoutubeFeed.unknownVideo"),
              })}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <PlayCircle className="w-10 h-10 text-white" aria-hidden="true" />
            </div>
          </div>
        )}

        <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2">
          {item.title || t("feeds.addYoutubeFeed.unknownVideo")}
        </h3>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {item.description.replace(/<[^>]*>?/gm, "")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          {item.pubDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {formatDate(item.pubDate)}
            </span>
          )}

          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
              aria-label={t("feeds.addYoutubeFeed.watchVideo", {
                title: item.title || t("feeds.addYoutubeFeed.unknownVideo"),
              })}
            >
              {t("feeds.addYoutubeFeed.watch")}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

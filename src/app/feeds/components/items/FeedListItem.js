"use client";

import { useState, memo, useEffect } from "react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Eye,
  EyeOff,
  Share2,
  Rss,
  Youtube,
  ExternalLink,
  Heart,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const FeedListItem = memo(
  function FeedListItem({
    item,
    isRead,
    isFavorite,
    isReadLater,
    onClick,
    onMarkRead,
    onMarkUnread,
    onFavorite,
    onReadLater,
    onShare,
  }) {
    const { language, t } = useLanguage();
    const [imageError, setImageError] = useState(false);
    const [validImage, setValidImage] = useState(null);

    // Resim URL'sini doğrulama ve belirleme
    useEffect(() => {
      const getValidImageUrl = () => {
        // Tüm olası resim alanlarını kontrol et
        const possibleUrls = [
          item.image,
          item.thumbnail,
          item.media?.thumbnail?.[0]?.url,
          item.media?.thumbnail?.url,
          item.enclosure?.url,
          item.content_image,
          item.image_url,
        ].filter(Boolean);

        // İlk geçerli görünen URL'yi kullan
        for (const url of possibleUrls) {
          if (typeof url === "string" && url.startsWith("http")) {
            return url;
          }
        }
        return null;
      };

      setValidImage(getValidImageUrl());
      setImageError(false); // Yeni bir URL belirlendiğinde hata durumunu sıfırla
    }, [item]);

    // Daha dinamik tarih formatı
    const formatDate = (dateString) => {
      if (!dateString) return "";

      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const dateLocale = language === "tr" ? tr : enUS;

      if (diffMinutes < 60) {
        return `${diffMinutes} ${t("feeds.minutesAgo")}`;
      } else if (diffHours < 24) {
        return `${diffHours} ${t("feeds.hoursAgo")}`;
      } else if (diffDays < 7) {
        return `${diffDays} ${t("feeds.daysAgo")}`;
      } else {
        return format(date, "d MMM yyyy", { locale: dateLocale });
      }
    };

    const truncateText = (text, maxLength) => {
      if (!text) return "";
      return text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;
    };

    // Feed bilgilerini ve tipini doğrula
    const feedTitle = item.feedTitle || item.feed_title || "";
    const feedType = item.type || item.feed_type || item.feed?.type || "rss";

    const getFeedTypeIcon = () => {
      switch (feedType) {
        case "youtube":
          return <Youtube className="h-3 w-3 text-red-500" />;
        case "rss":
        default:
          return <Rss className="h-3 w-3 text-orange-500" />;
      }
    };

    return (
      <div
        className={cn(
          "flex border-b last:border-b-0 p-4 hover:bg-muted/30 transition-colors duration-150 group cursor-pointer",
          {
            "bg-muted/10": isRead,
          }
        )}
      >
        {/* Küçük Resim */}
        <div
          className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden mr-4 cursor-pointer"
          onClick={onClick}
        >
          {!imageError && validImage ? (
            <Image
              src={validImage}
              alt={item.title || "Feed görseli"}
              className="object-cover"
              fill
              sizes="64px"
              priority={false}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/20 flex items-center justify-center">
              {getFeedTypeIcon()}
            </div>
          )}

          {/* Durum Göstergeleri */}
          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
            {isFavorite && (
              <div className="bg-yellow-500/90 text-white rounded p-0.5">
                <BookmarkCheck className="h-2 w-2" />
              </div>
            )}
            {isReadLater && (
              <div className="bg-blue-500/90 text-white rounded p-0.5">
                <Clock className="h-2 w-2" />
              </div>
            )}
            {isRead && (
              <div className="bg-green-500/90 text-white rounded p-0.5">
                <Eye className="h-2 w-2" />
              </div>
            )}
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h3
              className={cn("font-medium line-clamp-1 cursor-pointer", {
                "text-muted-foreground": isRead,
              })}
              onClick={onClick}
            >
              {item.title}
            </h3>

            <div className="flex items-center">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(
                  item.pubDate ||
                    item.isoDate ||
                    item.publishedAt ||
                    item.published_at
                )}
              </span>
            </div>
          </div>

          <p
            className={cn("text-sm line-clamp-2 mb-1", {
              "text-muted-foreground": isRead,
              "text-foreground/80": !isRead,
            })}
          >
            {truncateText(item.description || item.content, 120)}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center">
              <span className="text-xs bg-muted rounded px-1.5 py-0.5 flex items-center gap-1">
                {getFeedTypeIcon()}
                <span className="truncate max-w-[120px]">{feedTitle}</span>
              </span>
            </div>

            <div className="flex">
              <TooltipProvider delayDuration={300}>
                {/* Okundu/Okunmadı Olarak İşaretle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkUnread()}
                      title={t("feeds.markAsUnread")}
                      className="h-8 w-8 p-0"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {t("feeds.markAsUnread")}
                  </TooltipContent>
                </Tooltip>

                {/* Favori */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFavorite()}
                      title={t("feeds.addToFavorites")}
                      className="h-8 w-8 p-0"
                    >
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {t("feeds.addToFavorites")}
                  </TooltipContent>
                </Tooltip>

                {/* Daha Sonra Oku */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReadLater()}
                      title={t("feeds.addToReadLater")}
                      className="h-8 w-8 p-0"
                    >
                      <Bookmark className="h-4 w-4 text-primary fill-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {t("feeds.addToReadLater")}
                  </TooltipContent>
                </Tooltip>

                {/* Paylaş */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShare()}
                      title={t("feeds.share")}
                      className="h-8 w-8 p-0"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {t("feeds.share")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Sadece önemli prop değişikliklerinde yeniden render
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isRead === nextProps.isRead &&
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.isReadLater === nextProps.isReadLater
    );
  }
);

"use client";

import { useState, memo, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Eye,
  EyeOff,
  Share2,
  ExternalLink,
  Rss,
  Youtube,
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

export const FeedCard = memo(
  function FeedCard({
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
    const [isHovered, setIsHovered] = useState(false);
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

    return (
      <Card
        className={cn(
          "h-full flex flex-col overflow-hidden transition-all duration-200 group hover:shadow-md border-none shadow-sm bg-card/80",
          {
            "border-primary/10 bg-muted/40": isRead,
            "hover:scale-102": !isRead,
          }
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Kapak Resmi */}
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ aspectRatio: "16/9" }}
          onClick={onClick}
        >
          {!imageError && validImage ? (
            <Image
              src={validImage}
              alt={item.title || "Feed görseli"}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/20 flex items-center justify-center">
              <div className="p-4 text-center">
                {feedType === "youtube" ? (
                  <Youtube className="h-10 w-10 text-primary/30 mb-2 mx-auto" />
                ) : (
                  <Rss className="h-10 w-10 text-primary/30 mb-2 mx-auto" />
                )}
                <p className="text-sm text-muted-foreground">
                  {feedTitle || t("feeds.noImage")}
                </p>
              </div>
            </div>
          )}

          {/* Kaynak Göstergesi */}
          <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium shadow-sm">
            {feedTitle}
          </div>

          {/* Durum Göstergeleri */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isFavorite && (
              <div className="bg-yellow-500/90 text-white rounded-md p-1.5">
                <BookmarkCheck className="h-3 w-3" />
              </div>
            )}
            {isReadLater && (
              <div className="bg-blue-500/90 text-white rounded-md p-1.5">
                <Clock className="h-3 w-3" />
              </div>
            )}
            {isRead && (
              <div className="bg-green-500/90 text-white rounded-md p-1.5">
                <Eye className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>

        {/* İçerik */}
        <div className="flex flex-col flex-grow">
          <CardHeader className="p-3 pb-0">
            <h3
              className={cn("font-semibold line-clamp-2 cursor-pointer", {
                "text-muted-foreground": isRead,
              })}
              onClick={onClick}
            >
              {item.title}
            </h3>
          </CardHeader>

          <CardContent className="p-3 pt-2 flex-grow">
            <p
              className={cn("text-sm line-clamp-3", {
                "text-muted-foreground": isRead,
                "text-foreground/80": !isRead,
              })}
            >
              {truncateText(item.description || item.content, 150)}
            </p>
          </CardContent>

          <CardFooter className="p-3 pt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDate(
                item.pubDate ||
                  item.isoDate ||
                  item.publishedAt ||
                  item.published_at
              )}
            </span>

            <div className="flex gap-1">
              <TooltipProvider delayDuration={300}>
                {/* Okundu/Okunmadı Olarak İşaretle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkUnread(item.id, isRead)}
                      title={
                        isRead ? t("feeds.markAsUnread") : t("feeds.markAsRead")
                      }
                      className="h-7 w-7 p-0"
                    >
                      {isRead ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isRead ? t("feeds.markAsUnread") : t("feeds.markAsRead")}
                  </TooltipContent>
                </Tooltip>

                {/* Favori */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFavorite(item.id, isFavorite)}
                      title={
                        isFavorite
                          ? t("feeds.removeFromFavorites")
                          : t("feeds.addToFavorites")
                      }
                      className="h-7 w-7 p-0"
                    >
                      {isFavorite ? (
                        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                      ) : (
                        <Heart className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isFavorite
                      ? t("feeds.removeFromFavorites")
                      : t("feeds.addToFavorites")}
                  </TooltipContent>
                </Tooltip>

                {/* Daha Sonra Oku */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReadLater(item.id, isReadLater)}
                      title={
                        isReadLater
                          ? t("feeds.removeFromReadLater")
                          : t("feeds.addToReadLater")
                      }
                      className="h-7 w-7 p-0"
                    >
                      {isReadLater ? (
                        <Bookmark className="h-3.5 w-3.5 text-primary fill-primary" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isReadLater
                      ? t("feeds.removeFromReadLater")
                      : t("feeds.addToReadLater")}
                  </TooltipContent>
                </Tooltip>

                {/* Paylaş */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShare(item)}
                      title={t("feeds.share")}
                      className="h-7 w-7 p-0"
                    >
                      <Share className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("feeds.share")}
                  </TooltipContent>
                </Tooltip>

                {/* Dış Bağlantı */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(item.url || item.link, "_blank")
                      }
                      title={t("feeds.openInNewTab")}
                      className="h-7 w-7 p-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("feeds.openInNewTab")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardFooter>
        </div>
      </Card>
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

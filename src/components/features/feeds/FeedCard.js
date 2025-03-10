"use client";

import { memo, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  Star,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import { cn, formatTimeAgo, stripHtml } from "@/lib/utils";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const FeedCardComponent = ({
  item,
  feed,
  compact,
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
  isFocused,
}) => {
  const cardRef = useRef(null);
  const { t } = useLanguage();

  // Erken dönüş kontrolü
  if (!item || !feed) return null;

  const handleToggleRead = (e) => {
    e.stopPropagation();
    if (typeof onToggleRead === "function") {
      onToggleRead(item.id, !item.is_read);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === "function") {
      onToggleFavorite(item.id, !item.is_favorite);
    }
  };

  const handleToggleReadLater = (e) => {
    e.stopPropagation();
    if (typeof onToggleReadLater === "function") {
      onToggleReadLater(item.id, !item.is_read_later);
    }
  };

  const handleOpenLink = (e) => {
    e.stopPropagation();
    if (item.link) {
      window.open(item.link, "_blank");
      // Sadece okunmamış ise okundu olarak işaretle
      if (!item.is_read && typeof onToggleRead === "function") {
        onToggleRead(item.id, true);
      }
    }
  };

  return (
    <Card
      className={cn(
        "group transition-all duration-200 cursor-pointer overflow-hidden",
        "border border-border bg-card hover:bg-card/80",
        "dark:bg-card/90 dark:hover:bg-card",
        "rounded-lg shadow-sm hover:shadow",
        "h-full",
        isFocused && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={(e) => {
        e.preventDefault();
        handleOpenLink(e);
      }}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Site Logosu/Favicon - Başlığın üstünde */}
        <div className="p-4 pb-0 flex items-center gap-2">
          {feed?.site_favicon ? (
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src={feed.site_favicon}
                alt={feed?.title || ""}
                width={32}
                height={32}
                loading="eager"
                unoptimized={true}
                className={cn(
                  "object-contain",
                  feed?.type === "youtube" ? "rounded-full" : "rounded-sm"
                )}
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-muted-foreground">
                {feed?.title?.substring(0, 2).toUpperCase() || "FT"}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              {feed?.title || "Bilinmeyen Kaynak"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(new Date(item.published_at))}
            </span>
          </div>
        </div>

        {/* Thumbnail - Sabit yükseklik */}
        <div className="relative w-full aspect-video bg-muted mt-3">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title || ""}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={true}
              loading="eager"
              unoptimized={true}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {feed?.site_favicon ? (
                <Image
                  src={feed.site_favicon}
                  alt={feed?.title || ""}
                  width={64}
                  height={64}
                  loading="eager"
                  unoptimized={true}
                  className="opacity-20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted-foreground/5 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-muted-foreground/20">
                    {feed?.title?.substring(0, 2).toUpperCase() || "FT"}
                  </span>
                </div>
              )}
            </div>
          )}
          {feed?.type === "youtube" && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              YouTube
            </div>
          )}
        </div>

        {/* İçerik - Sabit yükseklik */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Başlık - Sabit yükseklik */}
          <h3
            className={cn(
              "font-semibold text-base line-clamp-2 mb-2 h-12",
              item.is_read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {item.title}
          </h3>

          {/* Açıklama - Sabit yükseklik */}
          {!compact && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
              {stripHtml(item.description || "")}
            </p>
          )}

          {/* Butonlar */}
          <div className="flex items-center gap-1 mt-auto pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-md flex items-center gap-1.5",
                item.is_read ? "text-green-600" : "text-muted-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRead(e);
              }}
              title={
                item.is_read
                  ? t("feeds.feedList.markAsUnread")
                  : t("feeds.feedList.markAsRead")
              }
            >
              <Check className="h-4 w-4" />
              <span className="text-xs">
                {item.is_read
                  ? t("feeds.feedList.read")
                  : t("feeds.feedList.unread")}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-md flex items-center gap-1.5",
                item.is_favorite ? "text-yellow-600" : "text-muted-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(e);
              }}
              title={
                item.is_favorite
                  ? t("feeds.feedList.removeFromFavorites")
                  : t("feeds.feedList.addToFavorites")
              }
            >
              <Star
                className={cn("h-4 w-4", item.is_favorite && "fill-yellow-500")}
              />
              <span className="text-xs">
                {item.is_favorite
                  ? t("feeds.feedList.favorite")
                  : t("feeds.feedList.favoriteAction")}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-md flex items-center gap-1.5",
                item.is_read_later ? "text-blue-600" : "text-muted-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleReadLater(e);
              }}
              title={
                item.is_read_later
                  ? t("feeds.feedList.removeFromReadLater")
                  : t("feeds.feedList.addToReadLater")
              }
            >
              {item.is_read_later ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
              <span className="text-xs">
                {item.is_read_later
                  ? t("feeds.feedList.inReadingList")
                  : t("feeds.feedList.addToList")}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const FeedCard = memo(FeedCardComponent);

"use client";

import { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckIcon, ExternalLinkIcon, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const FeedCardComponent = ({
  item,
  feed,
  isCompact,
  onToggleRead,
  onToggleFavorite,
  onOpenLink,
  isFocused,
}) => {
  // useMemo hook'unu erken dönüşten önce tanımlıyoruz
  const truncatedDescription = useMemo(() => {
    if (!item || !feed || !item.description) return "";

    const cleanDescription = item.description
      .replace(/<[^>]*>/g, "") // HTML etiketlerini kaldır
      .replace(/&nbsp;/g, " ") // HTML boşluklarını temizle
      .trim();

    return cleanDescription.length > 120
      ? cleanDescription.substring(0, 120) + "..."
      : cleanDescription;
  }, [item, feed]);

  // Erken dönüş kontrolü
  if (!item || !feed) return null;

  const isYoutube = feed.type === "youtube";
  const feedTitle = feed.title || "Unknown Feed";
  const itemTitle = item.title || "Untitled";
  const publishedAt = item.published_at
    ? new Date(item.published_at)
    : new Date();
  const timeAgo = formatDistanceToNow(publishedAt, { addSuffix: true });

  const handleToggleRead = (e) => {
    e.stopPropagation();
    if (typeof onToggleRead === "function") {
      onToggleRead(item.id, !item.is_read);
    } else {
      console.error("onToggleRead is not a function", onToggleRead);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === "function") {
      onToggleFavorite(item.id, !item.is_favorite);
    } else {
      console.error("onToggleFavorite is not a function", onToggleFavorite);
    }
  };

  const handleOpenLink = (e) => {
    e.stopPropagation();
    if (typeof onOpenLink === "function") {
      onOpenLink(item.link);
      if (!item.is_read && typeof onToggleRead === "function") {
        onToggleRead(item.id, true);
      }
    } else {
      console.error("onOpenLink is not a function", onOpenLink);
      // Fallback to opening the link directly
      window.open(item.link, "_blank");
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-150 hover:scale-[1.01] hover:shadow-md cursor-pointer",
        item.is_read ? "bg-muted/30" : "bg-card",
        isFocused ? "ring-2 ring-primary" : ""
      )}
      onClick={handleOpenLink}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3">
          {/* Thumbnail veya Avatar */}
          {item.thumbnail ? (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={item.thumbnail}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 64px, 80px"
                priority={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex-shrink-0">
              {feed.site_favicon ? (
                <Image
                  src={feed.site_favicon}
                  alt={feedTitle}
                  width={32}
                  height={32}
                  className={cn(isYoutube ? "rounded-full" : "rounded")}
                  unoptimized
                />
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {feedTitle.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}

          {/* İçerik */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Üst Bilgi Satırı */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center">
                {feed.site_favicon && !item.thumbnail && (
                  <Image
                    src={feed.site_favicon}
                    alt={feedTitle}
                    width={16}
                    height={16}
                    className={cn(
                      "mr-1.5",
                      isYoutube ? "rounded-full" : "rounded"
                    )}
                    unoptimized
                  />
                )}
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
                  {feedTitle}
                </span>
              </div>
              <span className="text-muted-foreground/60 text-xs">•</span>
              <span className="text-xs text-muted-foreground/60">
                {timeAgo}
              </span>
              {isYoutube && (
                <>
                  <span className="text-muted-foreground/60 text-xs">•</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4">
                    YouTube
                  </Badge>
                </>
              )}
            </div>

            {/* Başlık */}
            <h3
              className={cn(
                "font-medium text-sm sm:text-base line-clamp-2 mb-1",
                item.is_read ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {itemTitle}
            </h3>

            {/* Açıklama */}
            {truncatedDescription && (
              <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-2">
                {truncatedDescription}
              </p>
            )}

            {/* Butonlar */}
            <div className="flex items-center gap-2 mt-auto">
              <Button
                variant={item.is_read ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleRead}
                className={cn(
                  "h-8 px-2 rounded-full transition-all",
                  item.is_read ? "bg-green-500/10 hover:bg-green-500/20" : ""
                )}
                title={
                  item.is_read
                    ? "Okunmadı olarak işaretle"
                    : "Okundu olarak işaretle"
                }
              >
                <CheckIcon
                  className={cn(
                    "h-4 w-4 mr-1",
                    item.is_read ? "text-green-500" : "text-muted-foreground"
                  )}
                />
                <span className="text-xs">
                  {item.is_read ? "Okundu" : "Okunmadı"}
                </span>
              </Button>

              <Button
                variant={item.is_favorite ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleFavorite}
                className={cn(
                  "h-8 px-2 rounded-full transition-all",
                  item.is_favorite
                    ? "bg-yellow-500/10 hover:bg-yellow-500/20"
                    : ""
                )}
                title={
                  item.is_favorite ? "Favorilerden çıkar" : "Favorilere ekle"
                }
              >
                <StarIcon
                  className={cn(
                    "h-4 w-4 mr-1",
                    item.is_favorite
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground"
                  )}
                />
                <span className="text-xs">
                  {item.is_favorite ? "Favori" : "Favorilere Ekle"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenLink}
                className="h-8 px-3 ml-auto text-xs rounded-full"
              >
                <ExternalLinkIcon className="h-4 w-4 mr-1.5" />
                Aç
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const FeedCard = memo(FeedCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.is_read === nextProps.item?.is_read &&
    prevProps.item?.is_favorite === nextProps.item?.is_favorite &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.isFocused === nextProps.isFocused
  );
});

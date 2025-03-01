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
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const FeedCardComponent = ({
  item,
  feed,
  isCompact,
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
  onOpenLink,
  isFocused,
}) => {
  const cardRef = useRef(null);

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
      console.error("onToggleRead is not a function");
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === "function") {
      onToggleFavorite(item.id, !item.is_favorite);
    } else {
      console.error("onToggleFavorite is not a function");
    }
  };

  const handleToggleReadLater = (e) => {
    e.stopPropagation();
    e.preventDefault();

    console.log("FeedCard: handleToggleReadLater called", {
      itemId: item.id,
      currentValue: item.is_read_later,
      newValue: !item.is_read_later,
      onToggleReadLater: typeof onToggleReadLater,
    });

    if (typeof onToggleReadLater === "function") {
      console.log("onToggleReadLater is a function, calling it now");
      try {
        onToggleReadLater(item.id, !item.is_read_later);
      } catch (error) {
        console.error("Error in handleToggleReadLater:", error);
      }
    } else {
      console.error("onToggleReadLater is not a function", onToggleReadLater);
      // Fallback olarak doğrudan veritabanına yazalım
      try {
        const supabase = createClientComponentClient();
        supabase
          .from("feed_items")
          .update({ is_read_later: !item.is_read_later })
          .eq("id", item.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating read later status:", error);
            } else {
              console.log("Successfully updated read later status directly");
            }
          });
      } catch (error) {
        console.error("Error in fallback update:", error);
      }
    }
  };

  const handleOpenLink = (e) => {
    e.stopPropagation();
    if (typeof onOpenLink === "function") {
      onOpenLink(item.link, item.id);
    } else {
      console.error("onOpenLink is not a function");
      // Fallback to opening the link directly
      window.open(item.link, "_blank");
    }
  };

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-shadow cursor-pointer",
        isFocused && "ring-2 ring-primary ring-offset-2",
        isCompact ? "h-auto" : "h-[180px]"
      )}
      onClick={handleOpenLink}
    >
      <CardContent className="p-4">
        <div
          className={cn(
            "flex items-start gap-4",
            isCompact ? "h-auto" : "h-full"
          )}
        >
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
          <div className="flex-1 min-w-0 flex flex-col h-full">
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
            <div className="flex items-center gap-2 flex-shrink-0">
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
                <Check
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
                <Star
                  className={cn(
                    "h-4 w-4 mr-1",
                    item.is_favorite
                      ? "fill-yellow-400 text-yellow-500"
                      : "text-muted-foreground"
                  )}
                />
                <span className="text-xs">
                  {item.is_favorite ? "Favori" : "Favorile"}
                </span>
              </Button>

              <Button
                variant={item.is_read_later ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleReadLater}
                className={cn(
                  "h-8 px-2 rounded-full transition-all",
                  item.is_read_later
                    ? "bg-blue-500/10 hover:bg-blue-500/20"
                    : ""
                )}
                title={
                  item.is_read_later
                    ? "Okuma listesinden çıkar"
                    : "Okuma listesine ekle"
                }
              >
                {item.is_read_later ? (
                  <BookmarkCheck className="h-4 w-4 mr-1 text-blue-500" />
                ) : (
                  <BookmarkPlus className="h-4 w-4 mr-1 text-muted-foreground" />
                )}
                <span className="text-xs">
                  {item.is_read_later ? "Listedeki" : "Listeye Ekle"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenLink}
                className="h-8 px-3 text-xs rounded-full"
                title="Yeni sekmede aç"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
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
    prevProps.item?.is_read_later === nextProps.item?.is_read_later &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.isFocused === nextProps.isFocused
  );
});

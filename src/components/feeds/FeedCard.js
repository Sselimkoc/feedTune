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
  compact,
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
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
  const timeAgo = formatDistanceToNow(new Date(item.published_at), {
    addSuffix: true,
  });

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
    window.open(item.link, "_blank");
  };

  return (
    <Card
      className={cn(
        "group transition-all duration-200 cursor-pointer border overflow-hidden",
        isFocused
          ? "feed-item-focused"
          : "hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md",
        compact ? "h-auto" : "h-[180px]"
      )}
      onClick={handleOpenLink}
      ref={cardRef}
    >
      <CardContent
        className={cn(
          "p-4 transition-colors duration-200",
          isFocused && "bg-primary/5 dark:bg-primary/10"
        )}
      >
        <div
          className={cn(
            "flex items-start gap-4",
            compact ? "h-auto" : "h-full"
          )}
        >
          {/* Thumbnail veya Avatar */}
          {item.thumbnail ? (
            <div
              className={cn(
                "relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden transition-all duration-200",
                isFocused && "ring-1 ring-primary shadow-sm"
              )}
            >
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
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex-shrink-0 transition-all duration-200",
                isFocused && "ring-1 ring-primary shadow-sm"
              )}
            >
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
            {/* Başlık ve Kaynak Bilgisi */}
            <div className="mb-1">
              <h3
                className={cn(
                  "font-medium line-clamp-2 text-sm sm:text-base transition-colors duration-200",
                  isFocused && "text-primary dark:text-primary"
                )}
              >
                {item.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="truncate max-w-[120px]">{feedTitle}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                {isYoutube && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                      YouTube
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Açıklama */}
            {!compact && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-auto">
                {truncatedDescription}
              </p>
            )}

            {/* Butonlar */}
            <div className="flex items-center gap-1 mt-auto pt-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200",
                  item.is_read
                    ? "text-green-500 bg-green-500/10 hover:bg-green-500/20"
                    : "text-primary hover:bg-primary/10",
                  isFocused && "bg-background/80"
                )}
                onClick={handleToggleRead}
                title={
                  item.is_read
                    ? "Okunmadı olarak işaretle"
                    : "Okundu olarak işaretle"
                }
              >
                <Check className={cn("h-4 w-4", item.is_read && "font-bold")} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full",
                  item.is_favorite
                    ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
                    : "text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-500",
                  isFocused && "bg-background/80"
                )}
                onClick={handleToggleFavorite}
                title={
                  item.is_favorite ? "Favorilerden çıkar" : "Favorilere ekle"
                }
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    item.is_favorite && "fill-yellow-400"
                  )}
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full",
                  item.is_read_later
                    ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                    : "text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500",
                  isFocused && "bg-background/80"
                )}
                onClick={handleToggleReadLater}
                title={
                  item.is_read_later
                    ? "Okuma listesinden çıkar"
                    : "Okuma listesine ekle"
                }
              >
                {item.is_read_later ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full text-muted-foreground",
                  isFocused && "bg-background/80"
                )}
                onClick={handleOpenLink}
                title="Bağlantıyı aç"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const FeedCard = memo(FeedCardComponent);

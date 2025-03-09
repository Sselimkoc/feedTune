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
        "group transition-all duration-200 cursor-pointer overflow-hidden",
        "border border-border bg-card hover:bg-card/80",
        "dark:bg-card/90 dark:hover:bg-card",
        "rounded-lg shadow-sm hover:shadow",
        isFocused ? "ring-2 ring-primary" : "",
        "h-full"
      )}
      onClick={(e) => {
        if (item.link) {
          handleOpenLink(e);
          // Sadece okunmamış ise okundu olarak işaretle
          if (!item.is_read) {
            onToggleRead(item.id, true);
          }
        }
      }}
      ref={cardRef}
    >
      <CardContent className={cn("p-0 flex flex-col h-full")}>
        {/* Thumbnail veya Avatar */}
        {item.thumbnail ? (
          <div className="relative w-full h-40 overflow-hidden">
            <Image
              src={item.thumbnail}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
            {isYoutube && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-black/70 text-white border-0 px-2 py-1"
              >
                YouTube
              </Badge>
            )}
          </div>
        ) : (
          <div className="relative w-full h-24 bg-muted flex items-center justify-center">
            {feed.site_favicon ? (
              <Image
                src={feed.site_favicon}
                alt={feedTitle}
                width={32}
                height={32}
                className={cn(
                  "object-cover",
                  isYoutube ? "rounded-full" : "rounded"
                )}
                unoptimized
              />
            ) : (
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {feedTitle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            {isYoutube && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-black/70 text-white border-0 px-2 py-1"
              >
                YouTube
              </Badge>
            )}
          </div>
        )}

        <div className="p-4 flex-1 flex flex-col">
          {/* Kaynak ve Zaman Bilgisi */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              {feed.site_favicon ? (
                <div className="relative w-4 h-4 flex-shrink-0">
                  <Image
                    src={feed.site_favicon}
                    alt={feedTitle}
                    width={16}
                    height={16}
                    className={cn(
                      "object-cover",
                      isYoutube ? "rounded-full" : "rounded"
                    )}
                    unoptimized
                  />
                </div>
              ) : (
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px]">
                    {feedTitle ? feedTitle.substring(0, 2).toUpperCase() : "FT"}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
                {feedTitle}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          {/* Başlık */}
          <h3
            className={cn(
              "font-semibold text-base mb-2 line-clamp-2",
              item.is_read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {item.title}
          </h3>

          {/* Açıklama */}
          {!compact && truncatedDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {truncatedDescription}
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
              onClick={handleToggleRead}
              title={
                item.is_read
                  ? "Okunmadı olarak işaretle"
                  : "Okundu olarak işaretle"
              }
            >
              <Check className="h-4 w-4" />
              <span className="text-xs">
                {item.is_read ? "Okundu" : "Okunmadı"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-md flex items-center gap-1.5",
                item.is_favorite ? "text-yellow-600" : "text-muted-foreground"
              )}
              onClick={handleToggleFavorite}
              title={
                item.is_favorite ? "Favorilerden çıkar" : "Favorilere ekle"
              }
            >
              <Star
                className={cn("h-4 w-4", item.is_favorite && "fill-yellow-500")}
              />
              <span className="text-xs">
                {item.is_favorite ? "Favori" : "Favorile"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-md flex items-center gap-1.5",
                item.is_read_later ? "text-blue-600" : "text-muted-foreground"
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
              <span className="text-xs">
                {item.is_read_later ? "Listede" : "Listeye Ekle"}
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

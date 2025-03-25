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
  Clock,
} from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
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

  // Compact Mode Kartı
  if (compact) {
  return (
    <Card
      className={cn(
        "group transition-all duration-200 cursor-pointer overflow-hidden",
          "border border-border bg-card hover:bg-card/80 hover:border-primary/20",
        "dark:bg-card/90 dark:hover:bg-card",
        "rounded-lg shadow-sm hover:shadow",
        "h-full",
        isFocused && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={(e) => {
        e.preventDefault();
        handleOpenLink(e);
      }}
        role="article"
        aria-label={item.title}
        tabIndex={0}
      >
        <div className="flex flex-col h-full">
          {/* Thumbnail */}
          <div className="relative w-full aspect-[16/9] bg-muted">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={t("feeds.feedList.contentThumbnail", {
                  title: item.title || t("home.recentContent.unknownTitle"),
                })}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="eager"
                unoptimized={true}
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                role="img"
                aria-label={t("feeds.feedList.placeholderThumbnail")}
              >
                {feed?.site_favicon ? (
                  <Image
                    src={feed.site_favicon}
                    alt={feed?.title || ""}
                    width={48}
                    height={48}
                    loading="eager"
                    unoptimized={true}
                    className="opacity-20"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted-foreground/5 flex items-center justify-center">
                    <span className="text-xl font-semibold text-muted-foreground/20">
                      {feed?.title?.substring(0, 2).toUpperCase() || "FT"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Badge */}
            {feed?.type === "youtube" && (
              <div
                className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-sm"
                role="badge"
                aria-label={t("feeds.feedList.youtubeContent")}
              >
                YouTube
              </div>
            )}

            {/* Site bilgisi - görsel üzerinde */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
              <div className="flex items-center gap-1.5">
                {feed?.site_favicon ? (
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <Image
                      src={feed.site_favicon}
                      alt={t("feeds.feedList.siteLogo", {
                        site:
                          feed?.title || t("home.recentContent.unknownSource"),
                      })}
                      width={16}
                      height={16}
                loading="eager"
                unoptimized={true}
                className={cn(
                  "object-contain",
                  feed?.type === "youtube" ? "rounded-full" : "rounded-sm"
                )}
              />
            </div>
          ) : (
                  <div
                    className="w-4 h-4 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0"
                    role="img"
                    aria-label={t("feeds.feedList.siteLogo", {
                      site:
                        feed?.title || t("home.recentContent.unknownSource"),
                    })}
                  >
                    <span className="text-[8px] font-semibold text-white">
                {feed?.title?.substring(0, 2).toUpperCase() || "FT"}
              </span>
            </div>
          )}
                <span className="text-[10px] font-medium text-white truncate max-w-[140px]">
              {feed?.title || t("home.recentContent.unknownSource")}
            </span>
              </div>
            </div>
          </div>

          {/* İçerik */}
          <CardContent className="p-3 flex-1 flex flex-col">
            {/* Başlık */}
            <h3
              className={cn(
                "font-medium text-sm line-clamp-2 mb-1.5 h-[40px]",
                item.is_read ? "text-muted-foreground" : "text-foreground"
              )}
              aria-label={item.title}
            >
              {item.title}
            </h3>

            {/* Zaman bilgisi */}
            <div className="flex items-center gap-1 mb-2">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-[10px] text-muted-foreground/70">
                {item.timeAgoData
                  ? item.timeAgoData.isJustNow
                    ? t("timeAgo.justNow")
                    : item.timeAgoData.value === 1
                    ? t(`timeAgo.${item.timeAgoData.unit}_one`)
                    : t(`timeAgo.${item.timeAgoData.unit}_other`, {
                        count: item.timeAgoData.value,
                      })
                  : new Date(item.published_at).toLocaleDateString()}
            </span>
          </div>

            {/* Butonlar */}
            <div
              className="flex items-center gap-1 mt-auto pt-2 border-t"
              role="toolbar"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
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
                <Check
                  className={cn(
                    "h-3.5 w-3.5",
                    item.is_read && "fill-current text-green-500"
                  )}
                />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
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
                  className={cn(
                    "h-3.5 w-3.5",
                    item.is_favorite && "fill-current text-yellow-500"
                  )}
                />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
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
                  <BookmarkCheck className="h-3.5 w-3.5 fill-current text-blue-500" />
                ) : (
                  <BookmarkPlus className="h-3.5 w-3.5" />
                )}
              </Button>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                onClick={handleOpenLink}
                title={t("home.recentContent.read")}
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Normal Mode Kartı (Detaylı Görünüm)
  return (
    <Card
      className={cn(
        "group transition-all duration-200 cursor-pointer overflow-hidden",
        "border border-border bg-card hover:bg-card/80 hover:border-primary/20",
        "dark:bg-card/90 dark:hover:bg-card",
        "rounded-lg shadow-sm hover:shadow-md",
        "h-full",
        isFocused && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={(e) => {
        e.preventDefault();
        handleOpenLink(e);
      }}
      role="article"
      aria-label={item.title}
      tabIndex={0}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-muted">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={t("feeds.feedList.contentThumbnail", {
                title: item.title || t("home.recentContent.unknownTitle"),
              })}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="eager"
              unoptimized={true}
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              role="img"
              aria-label={t("feeds.feedList.placeholderThumbnail")}
            >
              {feed?.site_favicon ? (
                <Image
                  src={feed.site_favicon}
                  alt={feed?.title || ""}
                  width={80}
                  height={80}
                  loading="eager"
                  unoptimized={true}
                  className="opacity-20"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted-foreground/5 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-muted-foreground/20">
                    {feed?.title?.substring(0, 2).toUpperCase() || "FT"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Görsel üzerindeki bilgi rozetleri */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start">
            {/* Feed kaynağı rozeti */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
              {feed?.site_favicon ? (
                <div className="relative w-5 h-5 flex-shrink-0">
                  <Image
                    src={feed.site_favicon}
                    alt={feed?.title || ""}
                    width={20}
                    height={20}
                    loading="eager"
                    unoptimized={true}
                    className={cn(
                      "object-contain",
                      feed?.type === "youtube" ? "rounded-full" : "rounded-sm"
                    )}
                  />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {feed?.title?.substring(0, 2).toUpperCase() || "FT"}
                  </span>
                </div>
              )}
              <span className="text-xs font-medium text-white truncate max-w-[120px]">
                {feed?.title || t("home.recentContent.unknownSource")}
              </span>
            </div>

            {/* YouTube rozeti */}
            {feed?.type === "youtube" && (
              <Badge
                variant="outline"
                className="bg-red-600 text-white border-none text-xs font-semibold"
              >
                YouTube
              </Badge>
            )}
          </div>
        </div>

        {/* İçerik */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Başlık */}
          <h3
            className={cn(
              "font-semibold text-lg line-clamp-2 mb-2",
              item.is_read ? "text-muted-foreground" : "text-foreground"
            )}
            aria-label={item.title}
          >
            {item.title}
          </h3>

          {/* Açıklama (Normal modda gösteriliyor) */}
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {stripHtml(item.description)}
            </p>
          )}

          {/* Zaman bilgisi ve meta veriler */}
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {item.timeAgoData
                ? item.timeAgoData.isJustNow
                  ? t("timeAgo.justNow")
                  : item.timeAgoData.value === 1
                  ? t(`timeAgo.${item.timeAgoData.unit}_one`)
                  : t(`timeAgo.${item.timeAgoData.unit}_other`, {
                      count: item.timeAgoData.value,
                    })
                : new Date(item.published_at).toLocaleDateString()}
            </span>

            {/* Okunma durumu */}
            {item.is_read ? (
              <Badge
                variant="outline"
                className="ml-auto text-xs bg-muted text-muted-foreground"
              >
                {t("feeds.feedList.read")}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="ml-auto text-xs bg-blue-500/10 text-blue-500 border-blue-200"
              >
                {t("feeds.feedList.unread")}
              </Badge>
            )}
          </div>

          {/* Butonlar */}
          <div
            className="flex items-center gap-2 mt-auto pt-4 border-t"
            role="toolbar"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 flex gap-1.5 items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRead(e);
              }}
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  item.is_read && "fill-current text-green-500"
                )}
              />
              <span className="text-xs">
                {item.is_read
                  ? t("feeds.feedList.markAsUnread")
                  : t("feeds.feedList.markAsRead")}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 flex gap-1.5 items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(e);
              }}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  item.is_favorite && "fill-current text-yellow-500"
                )}
              />
              <span className="text-xs">
                {item.is_favorite
                  ? t("feeds.feedList.removeFromFavorites")
                  : t("feeds.feedList.addToFavorites")}
              </span>
            </Button>

            <div className="flex-1" />

            <Button
              variant="default"
              size="sm"
              className="h-9 px-4"
              onClick={handleOpenLink}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="text-xs">{t("home.recentContent.read")}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const FeedCard = memo(FeedCardComponent);

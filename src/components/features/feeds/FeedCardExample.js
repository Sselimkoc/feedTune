"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Book,
  BookmarkIcon,
  Clock,
  ExternalLink,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Rss,
  Star as StarIcon,
  Youtube,
} from "lucide-react";
import { useFeedQueries } from "@/hooks/features/useFeedQueries";

/**
 * Feed öğesini gösteren kart bileşeni.
 * Repository-Service-Query mimarisine uygun şekilde yazılmıştır.
 *
 * @param {object} item - Feed öğesi
 * @param {object} feed - Feed bilgisi
 * @param {boolean} isCompact - Kompakt görünüm modu
 * @param {boolean} isFocused - Odaklanma durumu
 */
function FeedCardExample({ item, feed, isCompact, isFocused = false }) {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Yeni mimariye uygun şekilde hook'u kullan
  const { toggleRead, toggleFavorite, toggleReadLater } = useFeedQueries();

  // Feed türüne göre badge stilini belirle
  const feedTypeBadge =
    feed.type === "youtube"
      ? "bg-red-500/10 text-red-500"
      : "bg-orange-500/10 text-orange-500";

  // Görseli belirle
  const imageUrl = item.thumbnail || feed.site_favicon;

  // Yayın tarihini formatla
  const relativeTime = getRelativeTime(new Date(item.published_at), language);

  // Olay işleyicileri
  const handleToggleRead = (e) => {
    e.stopPropagation();
    toggleRead(item.id, !item.is_read, true); // true = skipInvalidation
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(item.id, !item.is_favorite, true); // true = skipInvalidation
  };

  const handleToggleReadLater = (e) => {
    e.stopPropagation();
    toggleReadLater(item.id, !item.is_read_later, true); // true = skipInvalidation
  };

  // Çeviriler için yardımcı fonksiyonlar
  const getFavoriteText = () => {
    return item.is_favorite
      ? t("feeds.removeFromFavorites") || "Favorilerden çıkar"
      : t("feeds.addToFavorites") || "Favorilere ekle";
  };

  const getReadLaterText = () => {
    return item.is_read_later
      ? t("feeds.removeFromReadLater") || "Daha sonra oku listesinden çıkar"
      : t("feeds.addToReadLater") || "Daha sonra oku";
  };

  // Kompakt kart görünümü
  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        whileHover={{
          backgroundColor: "var(--accent)",
          transition: { duration: 0.2 },
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          "group cursor-pointer py-4 px-4 transition-all border-b border-border",
          isFocused && "bg-accent",
          item.is_read ? "opacity-75" : ""
        )}
        onClick={() => window.open(item.url || item.link, "_blank")}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 relative w-20 h-20 overflow-hidden">
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover rounded"
                sizes="80px"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded">
                {feed.type === "youtube" ? (
                  <Youtube className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <Rss className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className={cn("text-xs px-1.5 py-0 h-5", feedTypeBadge)}
              >
                {feed.type === "youtube" ? "YouTube" : "RSS"}
              </Badge>

              {!item.is_read && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 text-xs px-1.5 py-0 h-5"
                >
                  {t("feeds.new")}
                </Badge>
              )}

              <span className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {relativeTime}
              </span>
            </div>

            <h3
              className={cn(
                "text-base font-medium leading-tight mb-1",
                item.is_read ? "text-muted-foreground" : ""
              )}
            >
              {item.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {item.description || t("feeds.noDescription")}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-primary">
                  {feed.title}
                </span>
              </div>

              <AnimatePresence>
                {(isHovered || isFocused) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex gap-1"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={handleToggleRead}
                          >
                            {item.is_read ? (
                              <EyeOffIcon className="h-3.5 w-3.5" />
                            ) : (
                              <EyeIcon className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {item.is_read
                              ? t("feeds.markUnread")
                              : t("feeds.markRead")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={handleToggleFavorite}
                          >
                            <StarIcon
                              className={cn(
                                "h-3.5 w-3.5",
                                item.is_favorite
                                  ? "fill-yellow-400 text-yellow-400"
                                  : ""
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {item.is_favorite
                              ? t("feeds.feedList.removeFromFavorites") ||
                                getFavoriteText()
                              : t("feeds.feedList.addToFavorites") ||
                                getFavoriteText()}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={handleToggleReadLater}
                          >
                            <BookmarkIcon
                              className={cn(
                                "h-3.5 w-3.5",
                                item.is_read_later
                                  ? "fill-primary text-primary"
                                  : ""
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {item.is_read_later
                              ? t("feeds.feedList.removeFromReadLater") ||
                                getReadLaterText()
                              : t("feeds.feedList.addToReadLater") ||
                                getReadLaterText()}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid kart görünümü
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={() => window.open(item.url || item.link, "_blank")}
      className={cn(
        "group cursor-pointer h-full",
        isFocused && "ring-2 ring-primary"
      )}
    >
      <Card className="h-full overflow-hidden">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={item.title || ""}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/5">
                {feed.type === "youtube" ? (
                  <Youtube className="h-12 w-12 text-primary/30 mb-2" />
                ) : (
                  <Rss className="h-12 w-12 text-primary/30 mb-2" />
                )}
                <span className="text-primary/40 text-sm font-medium">
                  {feed.title}
                </span>
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start">
              <Badge
                variant="secondary"
                className="bg-black/60 backdrop-blur-sm text-white border-none"
              >
                {feed.title}
              </Badge>

              <div className="flex gap-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium backdrop-blur-sm",
                    feed.type === "youtube"
                      ? "bg-red-500/80 text-white"
                      : "bg-orange-500/80 text-white"
                  )}
                >
                  {feed.type === "youtube" ? "YouTube" : "RSS"}
                </Badge>

                {!item.is_read && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/80 text-white text-xs font-medium backdrop-blur-sm"
                  >
                    {t("feeds.new")}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <div className="flex gap-2 mb-2">
              <span
                className={cn(
                  "text-xs text-muted-foreground flex items-center gap-1"
                )}
              >
                <Clock className="h-3 w-3" />
                {relativeTime}
              </span>
            </div>

            <h3
              className={cn(
                "text-base font-semibold line-clamp-2 mb-2 leading-tight",
                item.is_read ? "text-muted-foreground" : ""
              )}
            >
              {item.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {item.description || t("feeds.noDescription")}
            </p>

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url || item.link, "_blank");
                  if (!item.is_read) {
                    toggleRead(item.id, true);
                  }
                }}
              >
                {t("feeds.readMore")}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>

              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleToggleRead}
                      >
                        {item.is_read ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>
                        {item.is_read
                          ? t("feeds.markUnread")
                          : t("feeds.markRead")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleToggleFavorite}
                      >
                        <StarIcon
                          className={cn(
                            "h-4 w-4",
                            item.is_favorite
                              ? "fill-yellow-400 text-yellow-400"
                              : ""
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>
                        {item.is_favorite
                          ? t("feeds.feedList.removeFromFavorites") ||
                            getFavoriteText()
                          : t("feeds.feedList.addToFavorites") ||
                            getFavoriteText()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleToggleReadLater}
                      >
                        <BookmarkIcon
                          className={cn(
                            "h-4 w-4",
                            item.is_read_later
                              ? "fill-primary text-primary"
                              : ""
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>
                        {item.is_read_later
                          ? t("feeds.feedList.removeFromReadLater") ||
                            getReadLaterText()
                          : t("feeds.feedList.addToReadLater") ||
                            getReadLaterText()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Tarih bilgisini göreli zaman olarak formatlar
 * @param {Date} date - Tarih
 * @param {string} language - Dil kodu
 * @returns {string} Göreli zaman formatında metin
 */
function getRelativeTime(date, language) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (isNaN(diffInSeconds)) {
    return "Belirsiz";
  }

  if (diffInSeconds < 60) {
    return "Az önce";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} gün önce`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ay önce`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} yıl önce`;
}

export default FeedCardExample;

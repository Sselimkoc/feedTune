"use client";

import { useState, memo } from "react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import {
  ArrowUpRight,
  Star,
  BookmarkIcon,
  EyeIcon,
  EyeOffIcon,
  StarIcon,
  Calendar,
  Clock,
  ExternalLink,
  Rss,
  Youtube,
  MessageSquare,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

function FeedCard({
  item,
  feed,
  isCompact,
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
  isFocused = false,
}) {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Yerelleştirilmiş tarih formatı için doğru yerel ayarı seç
  const dateLocale = language === "tr" ? tr : enUS;

  // Feed verileri kontrolü
  if (!item || !feed) return null;

  // Tarih formatlamalarını oluştur
  const publishedDate = new Date(item.published_at);
  const formattedDate = format(publishedDate, "PPP", { locale: dateLocale });
  const formattedTime = format(publishedDate, "p", { locale: dateLocale });
  const relativeTime = getRelativeTime(publishedDate, language);

  // Feed tipi için badge rengi
  const feedTypeBadge =
    feed.type === "youtube"
      ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";

  // Görsel URL'ini belirle
  const imageUrl = item.thumbnail || item.image_url;

  // Tıklama işleyicileri
  const handleToggleRead = (e) => {
    e.stopPropagation();
    console.log("handleToggleRead çağrıldı", item.id, !item.is_read);
    onToggleRead(item.id, !item.is_read);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    console.log("handleToggleFavorite çağrıldı", item.id, !item.is_favorite);
    onToggleFavorite(item.id, !item.is_favorite);
  };

  const handleToggleReadLater = (e) => {
    e.stopPropagation();
    console.log("handleToggleReadLater çağrıldı", item.id, !item.is_read_later);
    onToggleReadLater(item.id, !item.is_read_later);
  };

  // Favori ve Daha Sonra Oku için yerelleştirme metinleri
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
          {/* İçerik resmi veya placeholder */}
          <div className="hidden sm:block flex-shrink-0">
            <div className="relative w-16 h-16 overflow-hidden rounded-md bg-muted">
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt={item.title || ""}
                  fill
                  className="object-cover"
                  sizes="64px"
                  loading="eager"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                  {feed.type === "youtube" ? (
                    <Youtube className="h-5 w-5 text-primary/60" />
                  ) : (
                    <Rss className="h-5 w-5 text-primary/60" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* İçerik metni */}
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

  // Normal kart görünümü
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{
        scale: 1.01,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transition: { duration: 0.2 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "h-full",
        isFocused && "ring-2 ring-primary ring-offset-2",
        item.is_read ? "opacity-80" : ""
      )}
      onClick={() => window.open(item.url || item.link, "_blank")}
    >
      <Card className="overflow-hidden h-full flex flex-col bg-card hover:bg-card/95 transition-all duration-300 border-border group">
        {/* İçerik kapak resmi */}
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

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Tarih ve meta bilgiler */}
          <div className="flex items-center justify-between mt-1 mb-2">
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formattedDate}</span>
              </div>

              <span>•</span>

              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Meta etiketleri */}
            <div className="flex items-center gap-1.5">
              {item.is_favorite && (
                <div className="flex items-center text-yellow-500 text-xs font-medium">
                  <Star className="h-3 w-3 fill-yellow-400 mr-0.5" />
                  <span>{t("feeds.favorite")}</span>
                </div>
              )}

              {item.is_read_later && (
                <div className="flex items-center text-primary text-xs font-medium">
                  <BookmarkIcon className="h-3 w-3 fill-primary mr-0.5" />
                  <span>{t("feeds.readLater")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Başlık */}
          <h3
            className={cn(
              "text-lg font-semibold mb-3 leading-tight line-clamp-2",
              item.is_read ? "text-muted-foreground" : ""
            )}
          >
            {item.title}
          </h3>

          {/* İçerik açıklaması */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
              {item.description || t("feeds.noDescription")}
            </p>

            {/* Etiketler ve kategoriler */}
            {item.categories && item.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 mb-3">
                {item.categories.slice(0, 3).map((category, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-primary/5"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {category}
                  </Badge>
                ))}
                {item.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.categories.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Butonlar */}
          <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.url || item.link, "_blank");
                if (!item.is_read) {
                  onToggleRead(item.id, true);
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
                          item.is_read_later ? "fill-primary text-primary" : ""
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Göreceli zaman hesaplaması (şimdi, X dk önce, X saat önce, vb.)
function getRelativeTime(date, language) {
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return language === "tr" ? "şimdi" : "just now";
  } else if (diffMinutes < 60) {
    return language === "tr"
      ? `${diffMinutes} dk önce`
      : `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return language === "tr"
      ? `${diffHours} saat önce`
      : `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return language === "tr"
      ? `${diffDays} gün önce`
      : `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    const options = { month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString(
      language === "tr" ? "tr-TR" : "en-US",
      options
    );
  }
}

// Performans optimizasyonu için memo kullanımı
export default memo(FeedCard);

"use client";

import {
  memo,
  useState,
  useCallback,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Star,
  Share,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  RssIcon,
} from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/store/useSettingsStore";

// YouTube ikonu için özel bileşen
const YoutubeIcon = memo((props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 19c-2.3 0-6.4-.2-8.1-.6-.7-.2-1.2-.7-1.4-1.4-.3-1.1-.5-3.4-.5-5s.2-3.9.5-5c.2-.7.7-1.2 1.4-1.4C5.6 5.2 9.7 5 12 5s6.4.2 8.1.6c.7.2 1.2.7 1.4 1.4.3 1.1.5 3.4.5 5s-.2 3.9-.5 5c-.2.7-.7 1.2-1.4 1.4-1.7.4-5.8.6-8.1.6z" />
    <polygon points="10 15 15 12 10 9 10 15" />
  </svg>
));
YoutubeIcon.displayName = "YoutubeIcon";

// YouTube Shorts ikonu için özel bileşen
const YoutubeShortIcon = memo((props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
));
YoutubeShortIcon.displayName = "YoutubeShortIcon";

/**
 * Beslemeler, Favoriler ve Daha Sonra Oku sayfaları için ortak içerik kartı bileşeni
 */
export const ContentCard = memo(
  forwardRef(function ContentCard(
    {
      item,
      viewMode = "grid",
      isRead,
      isFavorite,
      isReadLater,
      cardType = "feed", // feed, favorite, readLater
      onClick,
      onFavorite,
      onReadLater,
      onShare,
      onSelect,
      isSelected,
      selectable = false,
      className,
    },
    ref
  ) {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const { settings } = useSettingsStore();
    const [imageError, setImageError] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [internalIsFavorite, setInternalIsFavorite] = useState(null);
    const [internalIsReadLater, setInternalIsReadLater] = useState(null);

    // Component oluştuğunda veya item değiştiğinde durumları güncelle
    useEffect(() => {
      // Prop ile doğrudan gelen değerler varsa onları kullan
      if (isFavorite !== undefined) {
        setInternalIsFavorite(isFavorite);
      }
      // Yoksa item içindeki değerleri kullan
      else if (item) {
        setInternalIsFavorite(item.is_favorite || item.isFavorite || false);
      }

      if (isReadLater !== undefined) {
        setInternalIsReadLater(isReadLater);
      } else if (item) {
        setInternalIsReadLater(item.is_read_later || item.isReadLater || false);
      }
    }, [item, isFavorite, isReadLater]);

    // Öğenin durumlarını, nesne yapısına bağlı olarak doğru şekilde alma
    const getIsRead = useCallback(() => {
      if (isRead !== undefined) return isRead;
      return item?.is_read !== undefined ? item.is_read : item?.isRead || false;
    }, [isRead, item]);

    const getIsFavorite = useCallback(() => {
      // Eğer component kendi durumunu tutuyorsa onu kullan
      if (internalIsFavorite !== null) return internalIsFavorite;
      // Prop ile gelen değer varsa onu kullan
      if (isFavorite !== undefined) return isFavorite;
      // Son olarak item içinde değer varsa onu kullan
      return item?.is_favorite !== undefined
        ? item.is_favorite
        : item?.isFavorite || false;
    }, [isFavorite, item, internalIsFavorite]);

    const getIsReadLater = useCallback(() => {
      // Eğer component kendi durumunu tutuyorsa onu kullan
      if (internalIsReadLater !== null) return internalIsReadLater;
      // Prop ile gelen değer varsa onu kullan
      if (isReadLater !== undefined) return isReadLater;
      // Son olarak item içinde değer varsa onu kullan
      return item?.is_read_later !== undefined
        ? item.is_read_later
        : item?.isReadLater || false;
    }, [isReadLater, item, internalIsReadLater]);

    // Favori değiştirme işleyicisi - component durumunu günceller
    const handleFavoriteToggle = useCallback(
      (e) => {
        e.stopPropagation();
        const newFavoriteState = !getIsFavorite();
        setInternalIsFavorite(newFavoriteState);

        // onFavorite fonksiyonuna item.id ve yeni durum değerini geçir
        if (onFavorite && item) {
          try {
            onFavorite(item.id, newFavoriteState);
          } catch (error) {
            console.error(t("feeds.content.errors.favoriteToggle"), error);
            // Hata durumunda state'i geri al
            setInternalIsFavorite(!newFavoriteState);
          }
        }
      },
      [getIsFavorite, onFavorite, item, t]
    );

    // Daha sonra oku değiştirme işleyicisi - component durumunu günceller
    const handleReadLaterToggle = useCallback(
      (e) => {
        e.stopPropagation();
        const newReadLaterState = !getIsReadLater();
        setInternalIsReadLater(newReadLaterState);

        // onReadLater fonksiyonuna item.id ve yeni durum değerini geçir
        if (onReadLater && item) {
          try {
            onReadLater(item.id, newReadLaterState);
          } catch (error) {
            console.error(t("feeds.content.errors.readLaterToggle"), error);
            // Hata durumunda state'i geri al
            setInternalIsReadLater(!newReadLaterState);
          }
        }
      },
      [getIsReadLater, onReadLater, item, t]
    );

    // Resim URL'sini alma
    const getValidImageUrl = useMemo(() => {
      if (imageError || !item?.thumbnail) {
        return "/images/placeholder.webp";
      }
      return item.thumbnail;
    }, [imageError, item]);

    // Metin kısaltma
    const truncateText = useCallback((text, length) => {
      if (!text) return "";
      const content = typeof text === "string" ? text : "";
      return content.length > length
        ? content.slice(0, length) + "..."
        : content;
    }, []);

    // Resim yükleme işleyicileri
    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
      setIsImageLoaded(true);
    }, []);

    // Tarih formatı
    const formattedDate = useMemo(() => {
      try {
        if (!item) return "";
        const publishDate = item.published_at || item.publishedAt;
        return new Date(publishDate).toLocaleDateString(language, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (error) {
        console.error(t("feeds.content.errors.dateFormat"), error);
        return "";
      }
    }, [language, item, t]);

    // Besleme türü badgesi
    const renderFeedBadge = useMemo(() => {
      if (!item) return null;

      const feedType = item.type;
      const feedTitle = item.title;
      const isShort = item.is_short;
      const currentTheme =
        theme === "system"
          ? typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      const colorMode = currentTheme === "dark" ? "dark" : "light";

      switch (feedType) {
        case "youtube":
          return (
            <Badge
              variant="default"
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold"
            >
              <YoutubeIcon className="h-3 w-3 text-primary" />
              {isShort ? t("common.youtubeShort") : t("common.youtube")}
            </Badge>
          );
        case "rss":
          return (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold"
            >
              <RssIcon className="h-3 w-3 text-accent" />
              {t("common.rssFeed")}
            </Badge>
          );
        default:
          return null;
      }
    }, [item, t, theme]);

    // Kart tipine göre renk varyasyonları
    const cardStyles = useMemo(() => {
      // İçerik türüne ve okunma durumuna göre stilleri hesapla
      const isReadValue = getIsRead();
      const currentTheme =
        theme === "system"
          ? typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      const colorMode = currentTheme === "dark" ? "dark" : "light";

      // Get colors from settings
      const youtubeColor =
        settings.categoryColors?.youtube?.[colorMode] ||
        (colorMode === "dark" ? "#ef4444" : "#f87171");
      const rssColor =
        settings.categoryColors?.rss?.[colorMode] ||
        (colorMode === "dark" ? "#3b82f6" : "#60a5fa");

      return {
        // Okunmuş içerikler için soluk görünüm
        highlightClass: isReadValue
          ? "opacity-75 hover:opacity-95 bg-card/60"
          : "bg-gradient-to-b from-card to-card/95 shadow-sm",

        // Kart türüne göre border renkleri ve stilleri
        borderClass:
          item?.type === "youtube"
            ? "border hover:border-2 transition-all duration-300"
            : "border hover:border-2 transition-all duration-300",

        // Border style object
        borderStyle: {
          borderColor:
            item?.type === "youtube"
              ? item?.is_short
                ? `${youtubeColor}50`
                : `${youtubeColor}50`
              : `${rssColor}50`,
          borderLeftWidth: "2px", // Make left border more prominent for visual identity
        },

        // Hover border style
        hoverBorderStyle: {
          "--hover-border-color":
            item?.type === "youtube" ? `${youtubeColor}` : `${rssColor}`,
        },

        // Seçim durumuna göre ring efekti
        selectionClass: isSelected ? "ring-2 ring-primary ring-offset-1" : "",
      };
    }, [getIsRead, item, isSelected, settings.categoryColors, theme]);

    // Buton işlemleri
    const actionButtons = useMemo(
      () => (
        <div
          className={cn(
            "flex items-center gap-2",
            viewMode === "list" && "flex-shrink-0"
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    getIsFavorite() && "text-primary"
                  )}
                  onClick={handleFavoriteToggle}
                >
                  {getIsFavorite() ? (
                    <Star className="h-4 w-4 fill-primary" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t("common.favorite")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {getIsFavorite()
                  ? t("feeds.removeFromFavorites")
                  : t("feeds.addToFavorites")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    getIsReadLater() && "text-primary"
                  )}
                  onClick={handleReadLaterToggle}
                >
                  {getIsReadLater() ? (
                    <BookmarkCheck className="h-4 w-4 fill-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t("common.readLater")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {getIsReadLater()
                  ? t("feeds.removeFromReadLater")
                  : t("feeds.addToReadLater")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.();
                  }}
                >
                  <Share className="h-4 w-4" />
                  <span className="sr-only">{t("common.share")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("feeds.share")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(item?.link || item?.url);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">{t("common.openLink")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("feeds.openInNewTab")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      [
        viewMode,
        handleFavoriteToggle,
        getIsFavorite,
        handleReadLaterToggle,
        getIsReadLater,
        t,
        onShare,
        onClick,
        item,
      ]
    );

    // Klavye olaylarını yönet - Erişilebilirlik için
    const handleKeyDown = useCallback(
      (e) => {
        // Enter veya Space tuşları ile kart tıklanmış gibi davran
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (selectable) {
            onSelect?.(item?.id);
          } else {
            onClick?.(item?.link || item?.url);
          }
        }

        // Klavye kısayolları
        else if (e.key === "f" && e.altKey) {
          e.preventDefault();
          handleFavoriteToggle(e);
        } else if (e.key === "r" && e.altKey) {
          e.preventDefault();
          handleReadLaterToggle(e);
        } else if (e.key === "s" && e.altKey) {
          e.preventDefault();
          if (onShare) {
            e.stopPropagation();
            onShare();
          }
        }
      },
      [
        item,
        onClick,
        onSelect,
        selectable,
        handleFavoriteToggle,
        handleReadLaterToggle,
        onShare,
      ]
    );

    // Debug kodlarını production'da kaldır
    useEffect(() => {
      if (process.env.NODE_ENV === "development") {
        console.debug("ContentCard veri yapısı:", {
          id: item?.id,
          title: item?.title?.slice(0, 30),
        });
      }
    }, [item]);

    // Card içeriğini viewMode'a göre render et
    if (viewMode === "grid") {
      return (
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            layout: {
              duration: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 30,
            },
          }}
          whileHover={{ scale: 1.02, translateY: -2 }}
          className="h-full w-full"
        >
          <Card
            className={cn(
              "overflow-hidden h-full flex flex-col transition-all duration-300",
              "border bg-card text-card-foreground rounded-xl",
              "hover:shadow-md group",
              "hover:border-[var(--hover-border-color)]",
              cardStyles.highlightClass,
              cardStyles.borderClass,
              cardStyles.selectionClass,
              className
            )}
            style={{
              ...cardStyles.borderStyle,
              ...cardStyles.hoverBorderStyle,
            }}
            tabIndex={0}
            role="article"
            aria-label={item?.title || t("feeds.content.titleNotFound")}
            onKeyDown={handleKeyDown}
            onClick={
              selectable
                ? () => onSelect?.(item?.id)
                : () => onClick?.(item?.link || item?.url)
            }
          >
            {/* Seçim modu için checkbox */}
            {selectable && (
              <div
                className="absolute left-2 top-2 z-20 bg-background/90 backdrop-blur-sm rounded-full p-0.5 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(item?.id);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  aria-label={t("feeds.select")}
                  className="h-5 w-5 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
              </div>
            )}

            {/* Kart başlığı */}
            <div className="relative">
              {/* Görsel alanı */}
              <div
                className={cn(
                  "w-full overflow-hidden bg-muted/70",
                  imageError || !isImageLoaded ? "h-28" : "aspect-video"
                )}
              >
                {!imageError && isImageLoaded ? (
                  <div
                    className={cn(
                      "relative h-full w-full overflow-hidden",
                      !isImageLoaded && "animate-pulse bg-muted"
                    )}
                  >
                    <Image
                      src={getValidImageUrl}
                      alt={item?.title || ""}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={cn(
                        "object-cover transition-all duration-300",
                        !isImageLoaded && "opacity-0",
                        isImageLoaded && "opacity-100"
                      )}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      priority={false}
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                    {renderFeedBadge}
                  </div>
                )}
              </div>

              {/* Feed bilgisi */}
              {renderFeedBadge && (
                <div className="absolute left-2 bottom-2 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm text-xs px-2 py-1 rounded-md shadow-sm">
                  {renderFeedBadge}
                </div>
              )}
            </div>

            <CardContent className="flex-1 flex flex-col p-3 gap-2">
              {/* Başlık */}
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-medium text-foreground line-clamp-2 leading-snug text-sm md:text-base mb-1",
                    getIsRead() && "text-muted-foreground"
                  )}
                >
                  {item?.title || t("feeds.content.titleNotFound")}
                </h3>

                {/* Açıklama */}
                {item?.description && (
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-snug mt-1">
                    {truncateText(stripHtml(item.description), 120)}
                  </p>
                )}
              </div>

              {/* Alt bilgi alanı */}
              <div className="flex items-center justify-between mt-auto pt-2">
                {/* Tarih */}
                <div className="text-xs text-muted-foreground">
                  {formattedDate}
                </div>

                {/* Aksiyon butonları */}
                <div className="flex space-x-1">
                  {/* Daha sonra oku */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            getIsReadLater() && "text-primary bg-primary/10"
                          )}
                          onClick={handleReadLaterToggle}
                          aria-label={
                            getIsReadLater()
                              ? t("feeds.content.removeFromReadLater")
                              : t("feeds.content.addToReadLater")
                          }
                        >
                          {getIsReadLater() ? (
                            <BookmarkCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {getIsReadLater()
                          ? t("feeds.content.removeFromReadLater")
                          : t("feeds.content.addToReadLater")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Favori */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            getIsFavorite() &&
                              "text-yellow-500 bg-yellow-500/10"
                          )}
                          onClick={handleFavoriteToggle}
                          aria-label={
                            getIsFavorite()
                              ? t("feeds.content.removeFromFavorites")
                              : t("feeds.content.addToFavorites")
                          }
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              getIsFavorite() && "fill-yellow-500"
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {getIsFavorite()
                          ? t("feeds.content.removeFromFavorites")
                          : t("feeds.content.addToFavorites")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Paylaş */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onShare) {
                              onShare(item);
                            } else {
                              handleShare();
                            }
                          }}
                          aria-label={t("feeds.content.share")}
                        >
                          <Share className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t("feeds.content.share")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Link */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item?.link || item?.url) {
                              window.open(item.link || item.url, "_blank");
                            }
                          }}
                          aria-label={t("feeds.content.openInNewTab")}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t("feeds.content.openInNewTab")}
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

    // Liste görünümü
    if (viewMode === "list") {
      return (
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
            layout: {
              duration: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 30,
            },
          }}
          whileHover={{ scale: 1.01 }}
          className="w-full"
        >
          <Card
            className={cn(
              "light-card hover:shadow-md transition-all duration-200 group",
              cardStyles.borderClass,
              "hover:border-[var(--hover-border-color)]",
              cardStyles.highlightClass,
              isSelected && "ring-2 ring-primary ring-offset-2",
              className
            )}
            style={{
              ...cardStyles.borderStyle,
              ...cardStyles.hoverBorderStyle,
            }}
            tabIndex={0}
            role="article"
            aria-label={item?.title || t("feeds.content.titleNotFound")}
            onKeyDown={handleKeyDown}
            onClick={
              selectable
                ? () => onSelect?.(item?.id)
                : () => onClick?.(item?.link || item?.url)
            }
          >
            {/* Checkbox for selection mode */}
            {selectable && (
              <div
                className="absolute left-2 top-2 z-20 bg-background/80 backdrop-blur-sm rounded-full p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(item?.id);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  aria-label={t("feeds.select")}
                  className="h-5 w-5 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
              </div>
            )}

            <div className="flex gap-4 p-4">
              {/* Resim */}
              <div className="relative w-48 h-32 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={getValidImageUrl}
                  alt={item?.title || t("feeds.content.imageAlt")}
                  fill
                  className={cn(
                    "object-cover rounded-md transition-all duration-300 group-hover:scale-105",
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  sizes="(max-width: 768px) 192px, 192px"
                  priority={false}
                />
                {!getIsRead() && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "absolute top-2 right-2",
                      cardStyles.highlightClass
                    )}
                  >
                    {t("feeds.new")}
                  </Badge>
                )}

                {renderFeedBadge}
              </div>

              {/* İçerik */}
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {item?.title || t("feeds.content.titleNotFound")}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {truncateText(stripHtml(item?.description || ""), 120)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formattedDate}
                  </p>
                </div>
                {actionButtons}
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }
  }),
  (prevProps, nextProps) => {
    // Önemli değişiklikleri kontrol ederek gereksiz render'ları önle
    return (
      prevProps.item?.id === nextProps.item?.id &&
      prevProps.isRead === nextProps.isRead &&
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.isReadLater === nextProps.isReadLater &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.selectable === nextProps.selectable
    );
  }
);

ContentCard.displayName = "ContentCard";

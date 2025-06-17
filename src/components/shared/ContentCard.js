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

    // Modern, visually striking card design
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group rounded-xl bg-card/80 backdrop-blur-md shadow-lg hover:shadow-2xl border border-border/30 hover:border-primary/40 p-5 flex flex-col min-h-[220px] cursor-pointer hover:scale-[1.03] transition-all duration-300",
          className
        )}
        onClick={onClick}
      >
        {/* Badge */}
        <div className="flex items-center gap-2 mb-2">
          {item.type === "youtube" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold shadow-sm">
              <YoutubeIcon className="w-4 h-4" /> YouTube
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm">
              <RssIcon className="w-4 h-4" /> RSS
            </span>
          )}
        </div>
        {/* Title */}
        <h3 className="font-extrabold text-lg mb-1 line-clamp-2 text-foreground drop-shadow-sm">
          {item.title}
        </h3>
        {/* Description */}
        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
          {item.description || t("feeds.content.noDescription")}
        </p>
        {/* Bottom row: date & actions */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-muted-foreground">
            {item.published_at
              ? new Date(item.published_at).toLocaleDateString(
                  language === "tr" ? "tr-TR" : "en-US",
                  { day: "numeric", month: "long", year: "numeric" }
                )
              : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 transition-colors"
              onClick={onReadLater}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 transition-colors"
              onClick={onFavorite}
            >
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  })
);

ContentCard.displayName = "ContentCard";

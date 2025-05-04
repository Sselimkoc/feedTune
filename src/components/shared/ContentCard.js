"use client";

import {
  memo,
  useState,
  useCallback,
  forwardRef,
  useEffect,
  useRef,
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

// YouTube ikonu için özel bileşen
const YoutubeIcon = (props) => (
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
);

// YouTube Shorts ikonu için özel bileşen
const YoutubeShortIcon = (props) => (
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
);

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
      className,
    },
    ref
  ) {
    const { t, language } = useLanguage();
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

        // Değişiklik: onFavorite fonksiyonuna item.id ve yeni durum değerini geçir
        if (onFavorite && item) {
          try {
            onFavorite(item.id, newFavoriteState);
            console.debug(
              `FavoriteToggle çağrıldı: ${item.id}, ${newFavoriteState}`
            );
          } catch (error) {
            console.error("Favori değiştirme hatası:", error);
            // Hata durumunda state'i geri al
            setInternalIsFavorite(!newFavoriteState);
          }
        }
      },
      [getIsFavorite, onFavorite, item]
    );

    // Daha sonra oku değiştirme işleyicisi - component durumunu günceller
    const handleReadLaterToggle = useCallback(
      (e) => {
        e.stopPropagation();
        const newReadLaterState = !getIsReadLater();
        setInternalIsReadLater(newReadLaterState);

        // Değişiklik: onReadLater fonksiyonuna item.id ve yeni durum değerini geçir
        if (onReadLater && item) {
          try {
            onReadLater(item.id, newReadLaterState);
            console.debug(
              `ReadLaterToggle çağrıldı: ${item.id}, ${newReadLaterState}`
            );
          } catch (error) {
            console.error("Daha sonra oku değiştirme hatası:", error);
            // Hata durumunda state'i geri al
            setInternalIsReadLater(!newReadLaterState);
          }
        }
      },
      [getIsReadLater, onReadLater, item]
    );

    // Resim URL'sini alma
    const getValidImageUrl = useCallback(() => {
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
    const formatDate = useCallback(
      (date) => {
        try {
          const publishDate = item.published_at || item.publishedAt;
          return new Date(publishDate).toLocaleDateString(language, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch (error) {
          console.error("Tarih formatlanırken hata oluştu:", error);
          return date;
        }
      },
      [language, item]
    );

    // Besleme türü badgesi
    const renderFeedBadge = () => {
      const feedType = item.feed_type || item.feedType;
      const feedTitle = item.feed_title || item.feedTitle;
      const isShort = item.is_short || item.isShort || item.type === "shorts";

      return (
        <div className="absolute left-3 top-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-medium z-10">
          {feedType === "youtube" ? (
            <>
              {isShort ? (
                <YoutubeShortIcon className="h-3 w-3 text-red-400" />
              ) : (
                <YoutubeIcon className="h-3 w-3 text-red-500" />
              )}
              <span className="line-clamp-1 max-w-[100px]">
                {isShort
                  ? `${feedTitle} (Shorts)`
                  : feedTitle || t("home.recentContent.unknownSource")}
              </span>
            </>
          ) : (
            <>
              <RssIcon className="h-3 w-3 text-orange-500" />
              <span className="line-clamp-1 max-w-[100px]">
                {feedTitle || t("home.recentContent.unknownSource")}
              </span>
            </>
          )}
        </div>
      );
    };

    // Kart tipine göre renk varyasyonları
    const getCardTypeStyles = () => {
      switch (cardType) {
        case "favorite":
          return {
            badgeClass: "bg-yellow-500/90 text-white",
            highlightClass: "group-hover:border-yellow-400/30",
          };
        case "readLater":
          return {
            badgeClass: "bg-blue-500/90 text-white",
            highlightClass: "group-hover:border-blue-400/30",
          };
        default:
          return {
            badgeClass: "bg-primary text-primary-foreground",
            highlightClass: "group-hover:border-primary/30",
          };
      }
    };

    const cardStyles = getCardTypeStyles();

    // Buton işlemleri
    const renderActionButtons = () => (
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
                onClick={handleFavoriteToggle}
                className={cn(
                  "hover:text-yellow-500 transition-colors",
                  getIsFavorite() && "text-yellow-500"
                )}
              >
                <Star className="h-4 w-4" />
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
                onClick={handleReadLaterToggle}
                className={cn(
                  "hover:text-blue-500 transition-colors",
                  getIsReadLater() && "text-blue-500"
                )}
              >
                {getIsReadLater() ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
                className="hover:text-primary transition-colors"
              >
                <Share className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("feeds.share")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(item.link || item.url);
                }}
                className="ml-auto hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("feeds.openInNewTab")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );

    // Debug koddaki durumları
    useEffect(() => {
      if (process.env.NODE_ENV === "development") {
        console.debug("ContentCard veri yapısı:", {
          id: item?.id,
          title: item?.title?.slice(0, 30),
          cardType,
          is_favorite_from_item: item?.is_favorite,
          is_read_later_from_item: item?.is_read_later,
          is_favorite_prop: isFavorite,
          is_read_later_prop: isReadLater,
          internal_isFavorite: internalIsFavorite,
          internal_isReadLater: internalIsReadLater,
          calculated_isFavorite: getIsFavorite(),
          calculated_isReadLater: getIsReadLater(),
        });
      }
    }, [item, isFavorite, isReadLater, internalIsFavorite, internalIsReadLater, getIsFavorite, getIsReadLater, cardType]);

    // Gereksiz render olduğunda konsola log
    const renderCount = useRef(0);
    useEffect(() => {
      if (process.env.NODE_ENV === "development") {
        renderCount.current += 1;
        console.debug(
          `ContentCard (${item?.id}) rendered ${renderCount.current} times`
        );
      }
    });

    // Liste görünümü
    if (viewMode === "list") {
      return (
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <Card
            className={cn(
              "light-card border border-border/40 hover:border-border/60 hover:shadow-md transition-all duration-200 group",
              cardStyles.highlightClass,
              className
            )}
          >
            <div className="flex gap-4 p-4">
              {/* Resim */}
              <div className="relative w-48 h-32 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={getValidImageUrl()}
                  alt={item.title}
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
                      cardStyles.badgeClass
                    )}
                  >
                    {t("feeds.new")}
                  </Badge>
                )}

                {renderFeedBadge()}
              </div>

              {/* İçerik */}
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {stripHtml(item.description)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate()}
                  </p>
                </div>
                {renderActionButtons()}
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }

    // Izgara görünümü
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            "w-full h-full overflow-hidden light-card border border-border/40 hover:border-border/60 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col group",
            cardStyles.highlightClass,
            className
          )}
        >
          <div
            className={cn(
              "relative w-full pt-[56.25%] bg-muted rounded-t-xl", // 16:9 aspect ratio
              !isImageLoaded && "animate-pulse"
            )}
          >
            <Image
              src={getValidImageUrl()}
              alt={item.title}
              fill
              className={cn(
                "object-cover transition-all duration-300 group-hover:scale-105",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              onError={handleImageError}
              onLoad={handleImageLoad}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={false}
            />
            {!getIsRead() && (
              <Badge
                variant="secondary"
                className={cn(
                  "absolute top-2 right-2 shadow-sm",
                  cardStyles.badgeClass
                )}
              >
                {t("feeds.new")}
              </Badge>
            )}

            {renderFeedBadge()}
          </div>

          <CardHeader className="space-y-2 flex-grow">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors text-base">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground">{formatDate()}</p>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {truncateText(stripHtml(item.description), 120)}
            </p>
            {renderActionButtons()}
          </CardContent>
        </Card>
      </motion.div>
    );
  })
);

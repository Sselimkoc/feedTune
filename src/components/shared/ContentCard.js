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

    // Kart türüne göre border rengini belirleyen fonksiyon
    const getCardBorderStyle = useMemo(() => {
      if (!item) return "border-2 border-gray-300";

      const feedType = item.type;
      const isShort = item.is_short;

      if (feedType === "youtube") {
        return isShort
          ? "border-2 border-red-400 hover:border-red-500"
          : "border-2 border-red-600 hover:border-red-700";
      }

      return "border-2 border-blue-500 hover:border-blue-600";
    }, [item]);

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

      // Besleme türüne göre stil sınıfları - RSS için mavi, YouTube için kırmızı
      const badgeClasses = {
        youtube: isShort
          ? "bg-gradient-to-r from-red-500/90 to-red-400/90 border border-red-400/30"
          : "bg-gradient-to-r from-red-600/90 to-red-500/90 border border-red-500/30",
        rss: "bg-gradient-to-r from-blue-500/90 to-blue-400/90 border border-blue-400/30",
      };

      const selectedBadgeClass =
        feedType === "youtube" ? badgeClasses.youtube : badgeClasses.rss;

      return (
        <div
          className={`absolute left-0 top-0 flex items-center gap-2 ${selectedBadgeClass} px-3 py-2 rounded-br-lg text-sm font-medium z-10 shadow-md text-white`}
        >
          {feedType === "youtube" ? (
            <>
              {isShort ? (
                <YoutubeShortIcon className="h-5 w-5 text-white" />
              ) : (
                <YoutubeIcon className="h-5 w-5 text-white" />
              )}
              <span className="line-clamp-1 max-w-[150px] font-bold">
                {feedTitle || "YouTube"}
                {isShort && (
                  <span className="ml-1 font-normal text-xs opacity-90">
                    ({t("feeds.content.shorts")})
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <RssIcon className="h-5 w-5 text-white" />
              <span className="line-clamp-1 max-w-[150px] font-bold">
                {feedTitle || "RSS"}
              </span>
            </>
          )}
        </div>
      );
    }, [item, t]);

    // Kart tipine göre renk varyasyonları
    const cardStyles = useMemo(() => {
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
    }, [cardType]);

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
                    onClick?.(item?.link || item?.url);
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

    // Debug kodlarını production'da kaldır
    useEffect(() => {
      if (process.env.NODE_ENV === "development") {
        console.debug("ContentCard veri yapısı:", {
          id: item?.id,
          title: item?.title?.slice(0, 30),
        });
      }
    }, [item]);

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
              "light-card hover:shadow-md transition-all duration-200 group",
              getCardBorderStyle,
              cardStyles.highlightClass,
              className
            )}
          >
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
                      cardStyles.badgeClass
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
                    {stripHtml(item?.description || "")}
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
            "w-full h-full overflow-hidden light-card rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col group",
            getCardBorderStyle,
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
              src={getValidImageUrl}
              alt={item?.title || t("feeds.content.imageAlt")}
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

            {renderFeedBadge}
          </div>

          <CardHeader className="space-y-2 flex-grow">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors text-base">
              {item?.title || t("feeds.content.titleNotFound")}
              {item?.feed_type === "youtube" && item?.is_short && (
                <span className="inline-flex items-center bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-xs px-1.5 py-0.5 rounded-full ml-1">
                  <YoutubeShortIcon className="h-3 w-3 mr-0.5" />
                  {t("feeds.content.shorts")}
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {truncateText(stripHtml(item?.description || ""), 120)}
            </p>
            {actionButtons}
          </CardContent>
        </Card>
      </motion.div>
    );
  }),
  (prevProps, nextProps) => {
    // Önemli değişiklikleri kontrol ederek gereksiz render'ları önle
    return (
      prevProps.item?.id === nextProps.item?.id &&
      prevProps.isRead === nextProps.isRead &&
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.isReadLater === nextProps.isReadLater &&
      prevProps.viewMode === nextProps.viewMode
    );
  }
);

ContentCard.displayName = "ContentCard";

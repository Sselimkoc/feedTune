"use client";

import { memo, useState, useCallback, forwardRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Star, Share, Bookmark, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const FeedItem = memo(
  forwardRef(function FeedItem(
    {
  item,
  viewMode = "grid",
      isRead = false,
      isFavorite = false,
      isReadLater = false,
  onClick,
  onFavorite,
  onReadLater,
  onShare,
    },
    ref
  ) {
  const { t, language } = useLanguage();
  const [imageError, setImageError] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const getValidImageUrl = useCallback(() => {
      if (imageError || !item.thumbnail) {
        return "/images/placeholder.webp";
      }
      return item.thumbnail;
    }, [imageError, item.thumbnail]);

    const truncateText = useCallback((text, length) => {
    if (!text) return "";
      return text.length > length ? text.slice(0, length) + "..." : text;
    }, []);

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
      setIsImageLoaded(true);
    }, []);

    const formatDate = useCallback(
      (date) => {
        try {
          return new Date(date).toLocaleDateString(language, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch (error) {
          console.error("Tarih formatlanırken hata oluştu:", error);
          return date;
        }
      },
      [language]
    );

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
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.();
                }}
                className={cn(
                  "hover:text-yellow-500 transition-colors",
                  isFavorite && "text-yellow-500"
                )}
              >
                <Star className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isFavorite
            ? t("feeds.removeFromFavorites")
            : t("feeds.addToFavorites")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onReadLater?.();
                }}
                className={cn(
                  "hover:text-blue-500 transition-colors",
                  isReadLater && "text-blue-500"
                )}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isReadLater
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
                  onClick?.();
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
          <Card className="hover:shadow-md transition-all duration-200">
            <div className="flex gap-4 p-4">
              {/* Resim */}
              <div className="relative w-48 h-32 flex-shrink-0">
                <Image
                  src={getValidImageUrl()}
                  alt={item.title}
                  fill
                  className={cn(
                    "object-cover rounded-md transition-opacity duration-200",
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  sizes="(max-width: 768px) 192px, 192px"
                  priority={false}
                />
                {!isRead && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 bg-primary text-primary-foreground"
                  >
                    {t("feeds.new")}
                  </Badge>
                )}
              </div>

              {/* İçerik */}
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.published_at)}
                  </p>
                </div>
                {renderActionButtons()}
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="w-full h-full overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col">
          <div
            className={cn(
              "relative w-full pt-[56.25%] bg-muted", // 16:9 aspect ratio
              !isImageLoaded && "animate-pulse"
            )}
          >
            <Image
              src={getValidImageUrl()}
              alt={item.title}
              fill
              className={cn(
                "object-cover transition-opacity duration-200",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              onError={handleImageError}
              onLoad={handleImageLoad}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={false}
            />
            {!isRead && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-primary text-primary-foreground"
              >
                {t("feeds.new")}
              </Badge>
            )}
          </div>

          <CardHeader className="space-y-2 flex-grow">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors text-base">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatDate(item.published_at)}
            </p>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {truncateText(item.description, 120)}
            </p>
            {renderActionButtons()}
          </CardContent>
        </Card>
      </motion.div>
    );
  })
);

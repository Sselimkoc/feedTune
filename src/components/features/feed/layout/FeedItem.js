"use client";

import { memo, forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import {
  Bookmark,
  Clock,
  Share2,
  ExternalLink,
  Eye,
  EyeOff,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { NavigationButtons } from "./NavigationButtons";

export const FeedItem = memo(
  forwardRef(function FeedItem(
    {
      item,
      viewMode = "grid",
      onClick,
      onFavorite,
      onReadLater,
      onShare,
      className,
      ...props
    },
    ref
  ) {
    const { language, t } = useLanguage();
    const [isHovered, setIsHovered] = useState(false);

    const dateLocale = language === "tr" ? tr : enUS;

    // Thumbnail değerini işleyen yardımcı fonksiyon
    const getValidThumbnail = (thumbnail) => {
      if (!thumbnail) return null;

      // Eğer zaten geçerli bir URL ise doğrudan döndür
      if (
        typeof thumbnail === "string" &&
        (thumbnail.startsWith("http") || thumbnail.startsWith("/"))
      ) {
        return thumbnail;
      }

      // JSON string olarak kaydedilmiş olabilir, çözmeyi dene
      if (typeof thumbnail === "string") {
        try {
          // Çift tırnak içinde tek tırnak kullanımı ile oluşabilecek sorunları gider
          const cleanedString = thumbnail
            .replace(/^"(.*)"$/, "$1")
            .replace(/\\"/g, '"');

          // Düz dizi stringi (["...."]) formatı için kontrol
          if (cleanedString.startsWith("[") && cleanedString.endsWith("]")) {
            const parsed = JSON.parse(cleanedString);
            // Dizi içinde URL varsa ilk geçerli URL'yi döndür
            if (Array.isArray(parsed) && parsed.length > 0) {
              const validUrl = parsed.find(
                (url) =>
                  typeof url === "string" &&
                  (url.startsWith("http") || url.startsWith("/"))
              );
              return validUrl || null;
            }
          }

          // Normal JSON nesnesi için kontrol
          const parsed = JSON.parse(cleanedString);

          // Dizi ise ilk öğeyi al
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstItem = parsed[0];
            // Eğer ilk öğe bir string ise doğrudan döndür
            if (typeof firstItem === "string") {
              return firstItem;
            }
            // Eğer ilk öğe bir nesne ise, url özelliğini kontrol et
            if (firstItem && firstItem.url) {
              return firstItem.url;
            }
          }

          // Nesne ve url özelliği varsa döndür
          if (parsed && parsed.url) {
            return parsed.url;
          }

          return null;
        } catch (e) {
          console.error(
            "Thumbnail ayrıştırma hatası:",
            e,
            "Thumbnail değeri:",
            thumbnail
          );
          return null;
        }
      }

      // Zaten bir dizi ise ilk öğeyi al
      if (Array.isArray(thumbnail) && thumbnail.length > 0) {
        const firstItem = thumbnail[0];
        return typeof firstItem === "string"
          ? firstItem
          : firstItem && firstItem.url
          ? firstItem.url
          : null;
      }

      // Nesne ise url özelliğini al
      if (thumbnail && typeof thumbnail === "object" && thumbnail.url) {
        return thumbnail.url;
      }

      return null;
    };

    // Format tarih ve kaynak
    const formatPublishedDate = (date) => {
      if (!date) return "";

      try {
        const publishedDate = new Date(date);
        return format(publishedDate, "d MMM yyyy", { locale: dateLocale });
      } catch (error) {
        console.error("Date formatting error:", error);
        return "";
      }
    };

    // İçerik tipi gösterimini belirle (YouTube, RSS, vs)
    const renderContentTypeBadge = () => {
      if (!item.feed_type && !item.type) return null;

      const contentType =
        item.feed_type?.toLowerCase() || item.type?.toLowerCase();

      switch (contentType) {
        case "youtube":
          return (
            <Badge
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-500"
            >
              YouTube
            </Badge>
          );
        case "rss":
          return (
            <Badge
              variant="outline"
              className="bg-primary/10 border-primary/20 text-primary"
            >
              RSS
            </Badge>
          );
        default:
          return null;
      }
    };

    // Handle item click
    const handleItemClick = (e) => {
      e.preventDefault();
      if (onClick) {
        onClick(item.url, item);
      }
    };

    // Grid görünümü
    if (viewMode === "grid") {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn("group", className)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          layout
          {...props}
        >
          <Card
            className={cn(
              "overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 h-full flex flex-col",
              item.is_read ? "bg-card/60" : "bg-card/90 shadow-sm",
              isHovered && "shadow-md"
            )}
          >
            <div className="relative">
              {item.thumbnail ? (
                <div
                  className="aspect-video overflow-hidden bg-muted relative cursor-pointer"
                  onClick={handleItemClick}
                >
                  {(() => {
                    // Thumbnail URL'sini güvenli bir şekilde al ve doğrula
                    let thumbnailUrl = getValidThumbnail(item.thumbnail);

                    // Thumbnail URL'si geçersizse veya biçim uygun değilse, placeholder göster
                    if (
                      !thumbnailUrl ||
                      typeof thumbnailUrl !== "string" ||
                      !(
                        thumbnailUrl.startsWith("http") ||
                        thumbnailUrl.startsWith("/")
                      )
                    ) {
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-muted-foreground/40 text-3xl font-medium">
                            {item.feed_title?.charAt(0) || "?"}
                          </div>
                        </div>
                      );
                    }

                    // Geçerli thumbnail varsa Image bileşenini göster
                    return (
                      <Image
                        src={thumbnailUrl}
                        alt={item.title || "Content thumbnail"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={cn(
                          "object-cover transition-transform duration-500",
                          isHovered && "scale-105"
                        )}
                        priority={false}
                        onError={(e) => {
                          console.error("Image loading error for:", item.title);
                          // Resim yüklenemediğinde feed adının ilk harfini gösteren div'e dönüştür
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            while (parent.firstChild) {
                              parent.removeChild(parent.firstChild);
                            }
                            const fallbackDiv = document.createElement("div");
                            fallbackDiv.className =
                              "w-full h-full flex items-center justify-center";
                            fallbackDiv.innerHTML = `<div class="text-muted-foreground/40 text-3xl font-medium">${
                              item.feed_title?.charAt(0) || "?"
                            }</div>`;
                            parent.appendChild(fallbackDiv);
                          }
                        }}
                      />
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div
                  className="aspect-video bg-muted flex items-center justify-center cursor-pointer"
                  onClick={handleItemClick}
                >
                  <div className="text-muted-foreground/40 text-3xl font-medium">
                    {item.feed_title?.charAt(0) || ""}
                  </div>
                </div>
              )}

              {/* Read status indicator */}
              <div className="absolute top-2 right-2 z-10">
                {item.is_read ? (
                  <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full">
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-4 pb-2 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                {renderContentTypeBadge()}

                {/* Display feed source */}
                {item.feed_title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.feed_title}
                  </p>
                )}
              </div>

              <h3
                className={cn(
                  "font-medium mb-2 line-clamp-2 leading-snug transition-colors duration-200 cursor-pointer",
                  item.is_read ? "text-muted-foreground" : "text-foreground",
                  isHovered && !item.is_read && "text-primary"
                )}
                onClick={handleItemClick}
              >
                {item.title}
              </h3>

              {item.description && (
                <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-auto">
                  {item.description}
                </p>
              )}

              {/* Meta info */}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {item.published_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{formatPublishedDate(item.published_at)}</span>
                  </div>
                )}

                {item.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">
                      {item.author}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="px-4 py-3 border-t border-border/30 justify-between">
              <NavigationButtons
                item={item}
                onClick={onClick}
                onFavorite={onFavorite}
                onReadLater={onReadLater}
                onShare={onShare}
              />
            </CardFooter>
          </Card>
        </motion.div>
      );
    }

    // Liste görünümü
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className={cn("group", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        layout
        {...props}
      >
        <Card
          className={cn(
            "overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 mb-2",
            item.is_read ? "bg-card/60" : "bg-card/90 shadow-sm",
            isHovered && "shadow-md"
          )}
        >
          <div className="flex flex-col sm:flex-row">
            {item.thumbnail && (
              <div
                className="sm:w-48 md:w-56 aspect-video sm:aspect-[4/3] overflow-hidden bg-muted relative cursor-pointer"
                onClick={handleItemClick}
              >
                {(() => {
                  // Thumbnail URL'sini güvenli bir şekilde al ve doğrula
                  let thumbnailUrl = getValidThumbnail(item.thumbnail);

                  // Thumbnail URL'si geçersizse veya biçim uygun değilse, placeholder göster
                  if (
                    !thumbnailUrl ||
                    typeof thumbnailUrl !== "string" ||
                    !(
                      thumbnailUrl.startsWith("http") ||
                      thumbnailUrl.startsWith("/")
                    )
                  ) {
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-muted-foreground/40 text-3xl font-medium">
                          {item.feed_title?.charAt(0) || "?"}
                        </div>
                      </div>
                    );
                  }

                  // Geçerli thumbnail varsa Image bileşenini göster
                  return (
                    <Image
                      src={thumbnailUrl}
                      alt={item.title || "Content thumbnail"}
                      fill
                      sizes="(max-width: 640px) 100vw, 224px"
                      className={cn(
                        "object-cover transition-transform duration-500",
                        isHovered && "scale-105"
                      )}
                      priority={false}
                      onError={(e) => {
                        console.error("Image loading error for:", item.title);
                        // Resim yüklenemediğinde feed adının ilk harfini gösteren div'e dönüştür
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                          }
                          const fallbackDiv = document.createElement("div");
                          fallbackDiv.className =
                            "w-full h-full flex items-center justify-center";
                          fallbackDiv.innerHTML = `<div class="text-muted-foreground/40 text-3xl font-medium">${
                            item.feed_title?.charAt(0) || "?"
                          }</div>`;
                          parent.appendChild(fallbackDiv);
                        }
                      }}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}

            <div className="flex-1 p-4 sm:p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                {renderContentTypeBadge()}

                {/* Display feed source */}
                {item.feed_title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.feed_title}
                  </p>
                )}

                {/* Read status indicator */}
                <div className="ml-auto">
                  {item.is_read ? (
                    <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full">
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                </div>
              </div>

              <h3
                className={cn(
                  "font-medium mb-2 line-clamp-2 leading-snug transition-colors duration-200 cursor-pointer",
                  item.is_read ? "text-muted-foreground" : "text-foreground",
                  isHovered && !item.is_read && "text-primary"
                )}
                onClick={handleItemClick}
              >
                {item.title}
              </h3>

              {item.description && (
                <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-auto">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                {/* Meta info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.published_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{formatPublishedDate(item.published_at)}</span>
                    </div>
                  )}

                  {item.author && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {item.author}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <NavigationButtons
                  item={item}
                  onClick={onClick}
                  onFavorite={onFavorite}
                  onReadLater={onReadLater}
                  onShare={onShare}
                  size="small"
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  })
);

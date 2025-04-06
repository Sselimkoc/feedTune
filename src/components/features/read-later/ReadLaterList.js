"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Check,
  Star,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn, stripHtml } from "@/lib/utils";
import Link from "next/link";
import { RssIcon, YoutubeIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { EmptyState } from "@/components/ui-states/EmptyState";

export function ReadLaterList({
  initialItems,
  isLoading,
  isError,
  error,
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
  onRefresh,
}) {
  const [items, setItems] = useState(initialItems || []);
  const { t, language } = useLanguage();

  // Debug bilgisi
  console.log("ReadLaterList: Initial items:", initialItems?.length);

  // initialItems değiştiğinde items state'ini güncelle
  useEffect(() => {
    // Eğer initialItems varsa ve yükleme tamamlandıysa, items state'ini güncelle
    if (initialItems && !isLoading) {
      setItems(initialItems);
    }
  }, [initialItems, isLoading]);

  const toggleItemRead = async (itemId, isRead) => {
    try {
      // Optimistic update
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, is_read: isRead } : item
      );
      setItems(updatedItems);

      // API call via props
      await onToggleRead(itemId, isRead);
    } catch (error) {
      console.error("Error updating read status:", error);
      toast.error(t("errors.general"));

      // Rollback on error
      const rollbackItems = items.map((item) =>
        item.id === itemId ? { ...item, is_read: !isRead } : item
      );
      setItems(rollbackItems);
    }
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    try {
      // Optimistic update
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, is_favorite: isFavorite } : item
      );
      setItems(updatedItems);

      // API call via props
      await onToggleFavorite(itemId, isFavorite);
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error(t("errors.general"));

      // Rollback on error
      const rollbackItems = items.map((item) =>
        item.id === itemId ? { ...item, is_favorite: !isFavorite } : item
      );
      setItems(rollbackItems);
    }
  };

  const toggleItemReadLater = async (itemId, isReadLater) => {
    try {
      // Optimistic update - Okuma listesinden çıkarılıyorsa, öğeyi listeden kaldır
      if (isReadLater === false) {
        setItems(items.filter((item) => item.id !== itemId));
      } else {
        setItems(
          items.map((item) =>
            item.id === itemId ? { ...item, is_read_later: isReadLater } : item
          )
        );
      }

      // API call via props
      await onToggleReadLater(itemId, isReadLater);
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error(t("errors.general"));

      // Rollback on error - Okuma listesinden çıkarma işlemi başarısız olduysa
      if (isReadLater === false) {
        const itemToRestore = initialItems.find((item) => item.id === itemId);
        if (itemToRestore) {
          setItems([...items, itemToRestore]);
        }
      } else {
        const rollbackItems = items.map((item) =>
          item.id === itemId ? { ...item, is_read_later: !isReadLater } : item
        );
        setItems(rollbackItems);
      }
    }
  };

  const handleOpenLink = (link) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      console.error("No link provided");
    }
  };

  // Hata durumu
  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={onRefresh}
        title={t("readLater.errorTitle")}
        description={t("readLater.errorDescription")}
      />
    );
  }

  // Boş durum
  if (!isLoading && (!items || items.length === 0)) {
    return (
      <EmptyState
        title={t("readLater.emptyTitle")}
        description={t("readLater.emptyDescription")}
        icon={<BookmarkCheck className="h-10 w-10 opacity-20" />}
      />
    );
  }

  // Yükleme durumu için dönen loading ekranı
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] loading-container rounded-xl p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
          <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-full p-4 shadow-lg border">
            <BookmarkCheck className="h-12 w-12 text-primary loading-spinner" />
          </div>
        </div>

        <h3 className="text-xl font-medium mb-2 loading-pulse">
          {t("readLater.title")}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-4 loading-pulse">
          {t("common.loading")}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <div
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    );
  }

  // İçerik listesini render et
  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            layout
            className="w-full"
          >
            <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300 group border-border/40">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Thumbnail */}
                <div className="relative w-full pt-[56.25%] bg-accent/30">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      className="object-cover transition-all duration-300 group-hover:scale-105"
                      fill
                      priority={false}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                      <BookmarkCheck className="h-12 w-12 text-primary/20" />
                    </div>
                  )}

                  {/* Feed info badge */}
                  <div className="absolute left-3 top-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-medium z-10">
                    {item.feed_type === "youtube" ? (
                      <YoutubeIcon className="h-3 w-3 text-red-500" />
                    ) : (
                      <RssIcon className="h-3 w-3 text-orange-500" />
                    )}
                    <span className="line-clamp-1 max-w-[100px]">
                      {item.feed_title || t("home.recentContent.unknownSource")}
                    </span>
                  </div>

                  {/* Actions bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 flex justify-between items-center text-white">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-white/20 text-white"
                      onClick={() => toggleItemRead(item.id, !item.is_read)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          item.is_read ? "text-green-400" : "text-white/70"
                        )}
                      />
                      <span className="sr-only">
                        {item.is_read
                          ? t("feedItem.markAsUnread")
                          : t("feedItem.markAsRead")}
                      </span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/20 text-white"
                        onClick={() =>
                          toggleItemReadLater(item.id, !item.is_read_later)
                        }
                      >
                        {item.is_read_later ? (
                          <BookmarkCheck className="h-4 w-4 text-blue-400" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4 text-white/70" />
                        )}
                        <span className="sr-only">
                          {item.is_read_later
                            ? t("feedItem.removeFromReadLater")
                            : t("feedItem.addToReadLater")}
                        </span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/20 text-white"
                        onClick={() =>
                          toggleItemFavorite(item.id, !item.is_favorite)
                        }
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            item.is_favorite
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-white/70"
                          )}
                        />
                        <span className="sr-only">
                          {item.is_favorite
                            ? t("feedItem.removeFromFavorites")
                            : t("feedItem.addToFavorites")}
                        </span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/20 text-white"
                        onClick={() => handleOpenLink(item.link)}
                      >
                        <ExternalLink className="h-4 w-4 text-white/70" />
                        <span className="sr-only">
                          {t("feedItem.openInNewTab")}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3
                    className={cn(
                      "text-base font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors",
                      item.is_read && "text-muted-foreground"
                    )}
                  >
                    <Link
                      href={item.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenLink(item.link);
                      }}
                      className="hover:underline focus:outline-none focus:underline"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p
                    className={cn(
                      "text-sm line-clamp-3 text-muted-foreground mb-3",
                      item.is_read && "text-muted-foreground/70"
                    )}
                  >
                    {stripHtml(item.description) || t("feedItem.noDescription")}
                  </p>

                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        {item.site_favicon ? (
                          <Image
                            src={item.site_favicon}
                            alt={item.feed_title || "Feed favicon"}
                            width={24}
                            height={24}
                          />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {item.feed_type === "youtube" ? (
                              <YoutubeIcon className="h-3 w-3" />
                            ) : (
                              <RssIcon className="h-3 w-3" />
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.published_at).toLocaleDateString(
                          language === "tr" ? "tr-TR" : "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.is_favorite && (
                        <div className="text-yellow-500 flex items-center">
                          <Star className="h-3 w-3 fill-yellow-500" />
                        </div>
                      )}
                      {item.is_read_later && (
                        <div className="text-blue-500 flex items-center">
                          <BookmarkCheck className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

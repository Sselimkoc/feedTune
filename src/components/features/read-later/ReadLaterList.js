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

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden border">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-muted mb-3">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookmarkCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                {/* Kaynak ve Tarih */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {item.site_favicon ? (
                      <div className="relative w-4 h-4 flex-shrink-0">
                        <Image
                          src={item.site_favicon}
                          alt=""
                          width={16}
                          height={16}
                          className="object-cover rounded"
                          unoptimized={true}
                        />
                      </div>
                    ) : item.feed_type === "youtube" ? (
                      <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <RssIcon className="h-3.5 w-3.5 text-orange-500" />
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {item.feed_title || t("home.recentContent.unknownSource")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-muted-foreground">
                    <span className="line-clamp-1">
                      {
                        item.timeAgoData
                          ? item.timeAgoData.isJustNow
                            ? t("timeAgo.justNow")
                            : item.timeAgoData.value === 1
                            ? t(`timeAgo.${item.timeAgoData.unit}_one`)
                            : t(`timeAgo.${item.timeAgoData.unit}_other`, {
                                count: item.timeAgoData.value,
                              })
                          : new Date(item.published_at).toLocaleDateString() // timeAgoData yoksa basit tarih formatı
                      }
                    </span>
                  </div>
                </div>

                {/* Başlık */}
                <h3 className="font-semibold text-base mb-2 line-clamp-2">
                  {item.title}
                </h3>

                {/* Açıklama */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {stripHtml(item.description || "")}
                </p>

                {/* Butonlar */}
                <div className="flex items-center gap-1 mt-auto pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-md flex-1"
                    onClick={() => handleOpenLink(item.link)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    {t("home.recentContent.read")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md"
                    onClick={() => toggleItemReadLater(item.id, false)}
                  >
                    <BookmarkCheck className="h-4 w-4 fill-current text-blue-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

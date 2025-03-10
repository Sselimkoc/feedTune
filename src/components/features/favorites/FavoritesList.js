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
  Badge,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { cn, stripHtml } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { RssIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export function FavoritesList({ initialItems, isLoading }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();
  const { t, language } = useLanguage();

  // Debug bilgisi
  console.log("FavoritesList: Initial items:", initialItems?.length);

  // initialItems değiştiğinde items state'ini güncelle
  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  const toggleItemRead = async (itemId, isRead) => {
    try {
      // Optimistic update
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, is_read: isRead } : item
      );
      setItems(updatedItems);

      // API call
      const { data: existingInteraction } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (existingInteraction) {
        // Etkileşim varsa güncelle
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_read: isRead })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        // Etkileşim yoksa oluştur
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: isRead,
            is_favorite: true,
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }
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
      // Optimistic update - Favorilerden çıkarılıyorsa, öğeyi listeden kaldır
      if (isFavorite === false) {
        setItems(items.filter((item) => item.id !== itemId));
      } else {
        setItems(
          items.map((item) =>
            item.id === itemId ? { ...item, is_favorite: isFavorite } : item
          )
        );
      }

      // API call
      const { data: existingInteraction } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (existingInteraction) {
        // Etkileşim varsa güncelle
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_favorite: isFavorite })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        // Etkileşim yoksa oluştur
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: false,
            is_favorite: isFavorite,
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error(t("errors.general"));

      // Rollback on error - Favorilerden çıkarma işlemi başarısız olduysa, öğeyi geri ekle
      if (isFavorite === false) {
        const itemToRestore = initialItems.find((item) => item.id === itemId);
        if (itemToRestore) {
          setItems([...items, itemToRestore]);
        }
      } else {
        const rollbackItems = items.map((item) =>
          item.id === itemId ? { ...item, is_favorite: !isFavorite } : item
        );
        setItems(rollbackItems);
      }
    }
  };

  const toggleItemReadLater = async (itemId, isReadLater) => {
    try {
      // Optimistic update
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, is_read_later: isReadLater } : item
      );
      setItems(updatedItems);

      // API call
      const { data: existingInteraction } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (existingInteraction) {
        // Etkileşim varsa güncelle
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_read_later: isReadLater })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        // Etkileşim yoksa oluştur
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: false,
            is_favorite: true,
            is_read_later: isReadLater,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error(t("errors.general"));

      // Rollback on error
      const rollbackItems = items.map((item) =>
        item.id === itemId ? { ...item, is_read_later: !isReadLater } : item
      );
      setItems(rollbackItems);
    }
  };

  const handleOpenLink = (link) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      console.error("No link provided");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">
          <Star className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">
          {t("favorites.noFavorites")}
        </h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {t("favorites.addToFavorites")}
        </p>
        <Button asChild>
          <Link href="/feeds">
            <RssIcon className="h-4 w-4 mr-2" />
            {t("feeds.feedList.title")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
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
                  unoptimized={true}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
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
                    <Youtube className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <RssIcon className="h-3.5 w-3.5 text-orange-500" />
                  )}
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {item.feed_title || t("home.recentContent.unknownSource")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
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

              {/* Title */}
              <h3 className="font-semibold text-base mb-2 line-clamp-2">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {stripHtml(item.description)}
              </p>

              {/* Actions */}
              <div className="mt-auto flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-md flex-1"
                  onClick={() => handleOpenLink(item.link)}
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  {t("home.recentContent.read")}
                </Button>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md"
                    onClick={() => toggleItemRead(item.id, !item.is_read)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        item.is_read && "fill-current text-green-500"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md"
                    onClick={() => toggleItemFavorite(item.id, false)}
                  >
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md"
                    onClick={() =>
                      toggleItemReadLater(item.id, !item.is_read_later)
                    }
                  >
                    {item.is_read_later ? (
                      <BookmarkCheck className="h-4 w-4 fill-current text-blue-500" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

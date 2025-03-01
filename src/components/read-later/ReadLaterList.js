"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Star,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ReadLaterList({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClientComponentClient();

  const toggleItemRead = async (itemId, isRead) => {
    try {
      console.log("Toggling read status in ReadLaterList:", itemId, isRead);

      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read: isRead } : item
        )
      );

      const { error } = await supabase
        .from("feed_items")
        .update({ is_read: isRead })
        .eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling read status:", error);

      // Rollback on error
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read: !isRead } : item
        )
      );
      toast.error("Öğe durumu güncellenirken hata oluştu");
    }
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    try {
      console.log(
        "Toggling favorite status in ReadLaterList:",
        itemId,
        isFavorite
      );

      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_favorite: isFavorite } : item
        )
      );

      const { error } = await supabase
        .from("feed_items")
        .update({ is_favorite: isFavorite })
        .eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling favorite status:", error);

      // Rollback on error
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_favorite: !isFavorite } : item
        )
      );
      toast.error("Favori durumu güncellenirken hata oluştu");
    }
  };

  const toggleItemReadLater = async (itemId, isReadLater) => {
    try {
      console.log(
        "Toggling read later status in ReadLaterList:",
        itemId,
        isReadLater
      );

      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read_later: isReadLater } : item
        )
      );

      const { error } = await supabase
        .from("feed_items")
        .update({ is_read_later: isReadLater })
        .eq("id", itemId);

      if (error) throw error;

      // Remove from list if removed from read later
      if (!isReadLater) {
        setItems((currentItems) =>
          currentItems.filter((item) => item.id !== itemId)
        );
      }
    } catch (error) {
      console.error("Error toggling read later status:", error);

      // Rollback on error
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read_later: !isReadLater } : item
        )
      );
      toast.error("Okuma listesi durumu güncellenirken hata oluştu");
    }
  };

  const handleOpenLink = (link) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      console.error("No link provided");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>
          Henüz okuma listenizde öğe yok. Beslemelerinizdeki öğeleri "Listeye
          Ekle" butonuna tıklayarak okuma listenize ekleyebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card
              className="group hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => {
                handleOpenLink(item.link);
                if (!item.is_read) {
                  toggleItemRead(item.id, true);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4 h-[120px]">
                  {item.thumbnail && (
                    <div className="relative w-[120px] h-[90px] flex-shrink-0">
                      <Image
                        src={item.thumbnail}
                        alt=""
                        fill
                        className="object-cover rounded"
                        sizes="120px"
                        priority={false}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4">
                      <h2
                        className={`text-lg font-medium line-clamp-2 ${
                          item.is_read ? "text-muted-foreground" : ""
                        }`}
                      >
                        {item.title}
                      </h2>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant={item.is_read ? "secondary" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemRead(item.id, !item.is_read);
                          }}
                          className={cn(
                            "h-8 px-2 rounded-full transition-all",
                            item.is_read
                              ? "bg-green-500/10 hover:bg-green-500/20"
                              : ""
                          )}
                          title={
                            item.is_read
                              ? "Okunmadı olarak işaretle"
                              : "Okundu olarak işaretle"
                          }
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 mr-1",
                              item.is_read
                                ? "text-green-500"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="text-xs">
                            {item.is_read ? "Okundu" : "Okunmadı"}
                          </span>
                        </Button>

                        <Button
                          variant={item.is_favorite ? "secondary" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemFavorite(item.id, !item.is_favorite);
                          }}
                          className={cn(
                            "h-8 px-2 rounded-full transition-all",
                            item.is_favorite
                              ? "bg-yellow-500/10 hover:bg-yellow-500/20"
                              : ""
                          )}
                          title={
                            item.is_favorite
                              ? "Favorilerden çıkar"
                              : "Favorilere ekle"
                          }
                        >
                          <Star
                            className={cn(
                              "h-4 w-4 mr-1",
                              item.is_favorite
                                ? "fill-yellow-400 text-yellow-500"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="text-xs">
                            {item.is_favorite ? "Favori" : "Favorile"}
                          </span>
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemReadLater(item.id, false);
                          }}
                          className="h-8 px-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20"
                          title="Okuma listesinden çıkar"
                        >
                          <BookmarkCheck className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-xs">Listeden Çıkar</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLink(item.link);
                            if (!item.is_read) {
                              toggleItemRead(item.id, true);
                            }
                          }}
                          className="h-8 px-3 text-xs rounded-full"
                          title="Yeni sekmede aç"
                        >
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Aç
                        </Button>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                        {item.description.replace(/<[^>]*>/g, "")}
                      </p>
                    )}
                    {item.published_at && (
                      <time
                        dateTime={item.published_at}
                        className="text-xs text-muted-foreground mt-auto"
                      >
                        {new Date(item.published_at).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

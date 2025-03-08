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
import { useAuthStore } from "@/store/useAuthStore";

export function FavoritesList({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();

  const toggleItemRead = async (itemId, isRead) => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      console.log("Toggling read status in FavoritesList:", itemId, isRead);

      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read: isRead } : item
        )
      );

      // Önce etkileşim var mı kontrol et
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

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
            is_favorite: true, // Favoriler sayfasında olduğu için
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isRead
          ? "Öğe okundu olarak işaretlendi"
          : "Öğe okunmadı olarak işaretlendi",
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
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
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      console.log(
        "Toggling favorite status in FavoritesList:",
        itemId,
        isFavorite
      );

      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_favorite: isFavorite } : item
        )
      );

      // Önce etkileşim var mı kontrol et
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

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

      // Remove from list if unfavorited
      if (!isFavorite) {
        setItems((currentItems) =>
          currentItems.filter((item) => item.id !== itemId)
        );
      }
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
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      console.log(
        "Toggling read later status in FavoritesList:",
        itemId,
        isReadLater
      );

      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read_later: isReadLater } : item
        )
      );

      // Önce etkileşim var mı kontrol et
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

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
            is_favorite: true, // Favoriler sayfasında olduğu için
            is_read_later: isReadLater,
          },
        ]);

        if (error) throw error;
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
          Henüz favori öğeniz yok. Beslemelerinizdeki öğeleri yıldızlayarak
          burada görüntüleyebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card
          key={item.id}
          className="group hover:shadow-md transition-shadow cursor-pointer"
          onClick={(e) => {
            if (item.link) {
              handleOpenLink(item.link);
              // Sadece okunmamış ise okundu olarak işaretle
              if (!item.is_read) {
                toggleItemRead(item.id, true);
              }
            } else {
              toast.error("Bu öğe için bağlantı bulunamadı");
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {item.thumbnail && (
                <div className="relative w-full sm:w-[120px] h-[160px] sm:h-[90px] flex-shrink-0 mb-3 sm:mb-0">
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 640px) 100vw, 120px"
                    priority={false}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <h2
                    className={`text-lg font-medium line-clamp-2 mb-2 sm:mb-0 ${
                      item.is_read ? "text-muted-foreground" : ""
                    }`}
                  >
                    {item.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0 mb-3 sm:mb-0">
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
                          : "hover:bg-green-500/10"
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
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemFavorite(item.id, !item.is_favorite);
                      }}
                      className="h-8 px-2 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20"
                      title="Favorilerden çıkar"
                    >
                      <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-500" />
                      <span className="text-xs">Favori</span>
                    </Button>

                    <Button
                      variant={item.is_read_later ? "secondary" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemReadLater(item.id, !item.is_read_later);
                      }}
                      className={cn(
                        "h-8 px-2 rounded-full transition-all",
                        item.is_read_later
                          ? "bg-blue-500/10 hover:bg-blue-500/20"
                          : ""
                      )}
                      title={
                        item.is_read_later
                          ? "Okuma listesinden çıkar"
                          : "Okuma listesine ekle"
                      }
                    >
                      {item.is_read_later ? (
                        <BookmarkCheck className="h-4 w-4 mr-1 text-blue-500" />
                      ) : (
                        <BookmarkPlus className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs">
                        {item.is_read_later ? "Listede" : "Listeye Ekle"}
                      </span>
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {item.description.replace(/<[^>]*>/g, "")}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-auto pt-3 text-xs text-muted-foreground">
                  {item.feeds?.title && (
                    <>
                      <span>{item.feeds.title}</span>
                      <span>•</span>
                    </>
                  )}
                  {item.published_at && (
                    <span>
                      {new Date(item.published_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

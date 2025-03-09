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
} from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { RssIcon } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { stripHtml } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function ReadLaterList({ initialItems, isLoading }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();
  const { t, language } = useLanguage();

  // Debug bilgisi
  useEffect(() => {
    console.log("ReadLaterList received items:", initialItems?.length || 0);
    console.log("Sample item:", initialItems?.[0]);

    // Render edilecek öğeleri kontrol et
    if (initialItems?.length > 0) {
      console.log("Items to be rendered:", items.length);
      console.log("First item feed info:", {
        feed_title: initialItems[0].feed_title,
        feed_type: initialItems[0].feed_type,
        feed_id: initialItems[0].feed_id,
      });
    }
  }, [initialItems, items]);

  // initialItems değiştiğinde items state'ini güncelle
  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  const toggleItemRead = async (itemId, isRead) => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      console.log("Toggling read status in ReadLaterList:", itemId, isRead);

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
            is_favorite: false,
            is_read_later: true, // Okuma listesi sayfasında olduğu için
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

      // Hata durumunda optimistic update'i geri al
      setItems(initialItems);
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
            is_read_later: true, // Okuma listesi sayfasında olduğu için
          },
        ]);

        if (error) throw error;
      }

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isFavorite ? "Öğe favorilere eklendi" : "Öğe favorilerden çıkarıldı",
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);

      // Hata durumunda optimistic update'i geri al
      setItems(initialItems);
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
        "Toggling read later status in ReadLaterList:",
        itemId,
        isReadLater
      );

      // Optimistic update
      setItems((currentItems) =>
        // Okuma listesinden çıkarılıyorsa, öğeyi listeden kaldır
        isReadLater === false
          ? currentItems.filter((item) => item.id !== itemId)
          : currentItems.map((item) =>
              item.id === itemId
                ? { ...item, is_read_later: isReadLater }
                : item
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
            is_favorite: false,
            is_read_later: isReadLater,
          },
        ]);

        if (error) throw error;
      }

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isReadLater
          ? "Öğe okuma listesine eklendi"
          : "Öğe okuma listesinden çıkarıldı",
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error toggling read later status:", error);

      // Hata durumunda optimistic update'i geri al
      setItems(initialItems);
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
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <BookmarkCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Okuma listeniz boş</h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            İçerikleri okuma listenize ekleyerek daha sonra okumak üzere
            kaydedebilirsiniz.
          </p>
          <Button asChild>
            <Link href="/feeds">
              <RssIcon className="h-4 w-4 mr-2" />
              Feed&apos;lere Git
            </Link>
          </Button>
        </div>
      ) : (
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
                  {/* Feed bilgisi ve tarih */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        {item.feed_title || "Bilinmeyen Kaynak"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(new Date(item.published_at))}
                    </span>
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
                      Oku
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
      )}
    </div>
  );
}

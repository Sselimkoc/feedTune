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
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { RssIcon } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { stripHtml } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

export function FavoritesList({ initialItems, isLoading }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();

  // Debug bilgisi
  useEffect(() => {
    console.log("FavoritesList received items:", initialItems?.length || 0);
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
        "Toggling favorite status in FavoritesList:",
        itemId,
        isFavorite
      );

      // Optimistic update
      setItems((currentItems) =>
        // Favorilerden çıkarılıyorsa, öğeyi listeden kaldır
        isFavorite === false
          ? currentItems.filter((item) => item.id !== itemId)
          : currentItems.map((item) =>
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
        <h3 className="mb-2 text-lg font-medium">Henüz favoriniz yok</h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Beğendiğiniz içerikleri favorilere ekleyerek daha sonra kolayca
          erişebilirsiniz.
        </p>
        <Button asChild>
          <Link href="/feeds">
            <RssIcon className="h-4 w-4 mr-2" />
            Feed&apos;lere Git
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        console.log("Rendering item:", item.id, item.title);
        return (
          <Card key={item.id} className="overflow-hidden border">
            <CardContent className="p-0 flex flex-col h-full">
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
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-base mb-2 line-clamp-2">
                  {item.title}
                </h3>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

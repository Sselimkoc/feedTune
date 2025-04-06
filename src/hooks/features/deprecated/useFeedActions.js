"use client";

import { useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedService } from "@/hooks/features/useFeedService";
import { useFeedManagement } from "@/hooks/features/useFeedManagement";

/**
 * Feed etkileşimleri için hook
 * Bu hook, feed ve içerikler üzerinde yapılabilecek işlemleri yönetir.
 */
export function useFeedActions() {
  const { user } = useAuthStore();
  const { toggleRead, toggleFavorite, toggleReadLater } = useFeedService();
  const { deleteFeed } = useFeedManagement();

  // API yanıtlarını işlemek için yardımcı fonksiyon
  const handleApiResponse = useCallback(
    (error, successMessage, errorMessage) => {
      if (error) {
        console.error(`API Hatası:`, error);
        toast.error(errorMessage);
        return false;
      }

      if (successMessage) {
        toast.success(successMessage);
      }

      return true;
    },
    []
  );

  // Feed silme - Yeni hook kullanarak
  const removeFeed = useCallback(
    async (feedId) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      try {
        // Yeni servis katmanı üzerinden silme
        await deleteFeed(feedId);
        return true;
      } catch (error) {
        return handleApiResponse(
          error,
          null,
          "Feed silinirken beklenmeyen bir hata oluştu"
        );
      }
    },
    [user, deleteFeed, handleApiResponse]
  );

  // İçeriği okundu/okunmadı olarak işaretleme
  const toggleItemRead = useCallback(
    async (itemIdOrParams, isReadMaybe, shouldRefetchMaybe = true) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      // Parametreleri normalize et (hem obje hem de ayrı parametreler olarak çağrılabilir)
      let itemId, isRead;

      if (typeof itemIdOrParams === "object") {
        // Obje olarak geçilmiş: { itemId, isRead, ... }
        const params = itemIdOrParams;
        itemId = params.itemId;
        isRead = params.isRead;
      } else {
        // Ayrı parametreler olarak geçilmiş: (itemId, isRead, shouldRefetch)
        itemId = itemIdOrParams;
        isRead = isReadMaybe;
      }

      console.log(
        `toggleItemRead çağrıldı: itemId=${itemId}, isRead=${isRead}`
      );

      try {
        // Yeni servis katmanı üzerinden işlem
        await toggleRead(itemId, isRead);
        console.log("İçerik okundu/okunmadı durumu güncellendi");
        return true;
      } catch (error) {
        return handleApiResponse(
          error,
          null,
          "İçerik durumu güncellenirken beklenmeyen bir hata oluştu"
        );
      }
    },
    [user, toggleRead, handleApiResponse]
  );

  // İçeriği favorilere ekleme/çıkarma
  const toggleItemFavorite = useCallback(
    async (itemIdOrParams, isFavoriteMaybe, shouldRefetchMaybe = true) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      // Parametreleri normalize et (hem obje hem de ayrı parametreler olarak çağrılabilir)
      let itemId, isFavorite;

      if (typeof itemIdOrParams === "object") {
        // Obje olarak geçilmiş: { itemId, isFavorite, ... }
        const params = itemIdOrParams;
        itemId = params.itemId;
        isFavorite = params.isFavorite;
      } else {
        // Ayrı parametreler olarak geçilmiş: (itemId, isFavorite, shouldRefetch)
        itemId = itemIdOrParams;
        isFavorite = isFavoriteMaybe;
      }

      console.log(
        `toggleItemFavorite çağrıldı: itemId=${itemId}, isFavorite=${isFavorite}`
      );

      try {
        // Yeni servis katmanı üzerinden işlem
        await toggleFavorite(itemId, isFavorite);
        console.log("İçerik favori durumu güncellendi");
        return true;
      } catch (error) {
        return handleApiResponse(
          error,
          null,
          "Favori durumu güncellenirken beklenmeyen bir hata oluştu"
        );
      }
    },
    [user, toggleFavorite, handleApiResponse]
  );

  // İçeriği daha sonra oku listesine ekleme/çıkarma
  const toggleItemReadLater = useCallback(
    async (itemIdOrParams, isReadLaterMaybe, shouldRefetchMaybe = true) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      // Parametreleri normalize et (hem obje hem de ayrı parametreler olarak çağrılabilir)
      let itemId, isReadLater;

      if (typeof itemIdOrParams === "object") {
        // Obje olarak geçilmiş: { itemId, isReadLater, ... }
        const params = itemIdOrParams;
        itemId = params.itemId;
        isReadLater = params.isReadLater;
      } else {
        // Ayrı parametreler olarak geçilmiş: (itemId, isReadLater, shouldRefetch)
        itemId = itemIdOrParams;
        isReadLater = isReadLaterMaybe;
      }

      console.log(
        `toggleItemReadLater çağrıldı: itemId=${itemId}, isReadLater=${isReadLater}`
      );

      try {
        // Yeni servis katmanı üzerinden işlem
        await toggleReadLater(itemId, isReadLater);
        console.log("İçerik daha sonra oku durumu güncellendi");
        return true;
      } catch (error) {
        return handleApiResponse(
          error,
          null,
          "Daha sonra oku durumu güncellenirken beklenmeyen bir hata oluştu"
        );
      }
    },
    [user, toggleReadLater, handleApiResponse]
  );

  return {
    removeFeed,
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
  };
}

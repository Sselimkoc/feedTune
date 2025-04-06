"use client";

import { useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/features/useFeeds";

/**
 * Feed etkileşimleri için hook
 * Bu hook, feed ve içerikler üzerinde yapılabilecek işlemleri yönetir.
 */
export function useFeedActions() {
  const { user } = useAuthStore();
  const supabase = createClientComponentClient();
  const {
    toggleItemRead: apiToggleRead,
    toggleItemFavorite: apiToggleFavorite,
    toggleItemReadLater: apiToggleReadLater,
  } = useFeeds();

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

  // Feed silme
  const removeFeed = useCallback(
    async (feedId) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      try {
        // Feeds tablosundan silme
        const { error } = await supabase
          .from("feeds")
          .delete()
          .eq("id", feedId)
          .eq("user_id", user.id);

        return handleApiResponse(
          error,
          "Feed başarıyla silindi",
          "Feed silinirken bir hata oluştu"
        );
      } catch (error) {
        return handleApiResponse(
          error,
          null,
          "Feed silinirken beklenmeyen bir hata oluştu"
        );
      }
    },
    [user, supabase, handleApiResponse]
  );

  // İçeriği okundu/okunmadı olarak işaretleme
  const toggleItemRead = useCallback(
    async (itemIdOrParams, isReadMaybe, shouldRefetchMaybe = true) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      // Parametreleri normalize et (hem obje hem de ayrı parametreler olarak çağrılabilir)
      let itemId, isRead, shouldRefetch;

      if (typeof itemIdOrParams === "object") {
        // Obje olarak geçilmiş: { itemId, isRead, ... }
        const params = itemIdOrParams;
        itemId = params.itemId;
        isRead = params.isRead;
        shouldRefetch =
          params.shouldRefetch !== undefined ? params.shouldRefetch : true;
      } else {
        // Ayrı parametreler olarak geçilmiş: (itemId, isRead, shouldRefetch)
        itemId = itemIdOrParams;
        isRead = isReadMaybe;
        shouldRefetch = shouldRefetchMaybe;
      }

      console.log(
        `toggleItemRead çağrıldı: itemId=${itemId}, isRead=${isRead}, shouldRefetch=${shouldRefetch}`
      );

      try {
        // React Query API'si üzerinden işlem
        await apiToggleRead({
          itemId,
          isRead,
          userId: user.id,
          skipInvalidation: !shouldRefetch,
        });

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
    [user, apiToggleRead, handleApiResponse]
  );

  // İçeriği favorilere ekleme/çıkarma
  const toggleItemFavorite = useCallback(
    async (itemIdOrParams, isFavoriteMaybe, shouldRefetchMaybe = true) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      // Parametreleri normalize et (hem obje hem de ayrı parametreler olarak çağrılabilir)
      let itemId, isFavorite, shouldRefetch;

      if (typeof itemIdOrParams === "object") {
        // Obje olarak geçilmiş: { itemId, isFavorite, ... }
        const params = itemIdOrParams;
        itemId = params.itemId;
        isFavorite = params.isFavorite;
        shouldRefetch =
          params.shouldRefetch !== undefined ? params.shouldRefetch : true;
      } else {
        // Ayrı parametreler olarak geçilmiş: (itemId, isFavorite, shouldRefetch)
        itemId = itemIdOrParams;
        isFavorite = isFavoriteMaybe;
        shouldRefetch = shouldRefetchMaybe;
      }

      console.log(
        `toggleItemFavorite çağrıldı: itemId=${itemId}, isFavorite=${isFavorite}, shouldRefetch=${shouldRefetch}`
      );

      try {
        // React Query API'si üzerinden işlem
        await apiToggleFavorite({
          itemId,
          isFavorite,
          userId: user.id,
          skipInvalidation: !shouldRefetch,
        });

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
    [user, apiToggleFavorite, handleApiResponse]
  );

  // İçeriği daha sonra oku listesine ekleme/çıkarma
  const toggleItemReadLater = useCallback(
    async (itemIdOrParams, isReadLaterMaybe, shouldRefetchMaybe = true) => {
      if (!user) {
        toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız");
        return;
      }

      // Parametreleri normalize et (hem obje hem de ayrı parametreler olarak çağrılabilir)
      let itemId, isReadLater, shouldRefetch;

      if (typeof itemIdOrParams === "object") {
        // Obje olarak geçilmiş: { itemId, isReadLater, ... }
        const params = itemIdOrParams;
        itemId = params.itemId;
        isReadLater = params.isReadLater;
        shouldRefetch =
          params.shouldRefetch !== undefined ? params.shouldRefetch : true;
      } else {
        // Ayrı parametreler olarak geçilmiş: (itemId, isReadLater, shouldRefetch)
        itemId = itemIdOrParams;
        isReadLater = isReadLaterMaybe;
        shouldRefetch = shouldRefetchMaybe;
      }

      console.log(
        `toggleItemReadLater çağrıldı: itemId=${itemId}, isReadLater=${isReadLater}, shouldRefetch=${shouldRefetch}`
      );

      try {
        // React Query API'si üzerinden işlem
        await apiToggleReadLater({
          itemId,
          isReadLater,
          userId: user.id,
          skipInvalidation: !shouldRefetch,
        });

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
    [user, apiToggleReadLater, handleApiResponse]
  );

  return {
    removeFeed,
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
  };
}

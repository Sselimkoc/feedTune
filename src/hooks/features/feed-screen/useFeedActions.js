"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { feedService } from "@/services/feedService";

/**
 * Hook for feed-related actions
 * @param {object} user The current user
 * @param {function} refreshFeeds Function to refresh feeds list
 * @param {function} refreshItems Function to refresh feed items
 * @param {object} feedServiceInstance Service for feed operations
 * @returns {object} Feed action methods
 */
export function useFeedActions(
  user,
  refreshFeeds,
  refreshItems,
  feedServiceInstance
) {
  const { t } = useLanguage();
  const router = useRouter();
  const userId = user?.id;
  const localFeedService = feedServiceInstance || feedService;

  // Feed senkronizasyonu
  const syncFeeds = useCallback(async () => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return { success: false, error: "Login required" };
    }

    try {
      const result = await localFeedService.syncAllFeeds(userId);
      toast.success(t("feeds.syncSuccess"));
      refreshFeeds();
      refreshItems();
      return { success: true, result };
    } catch (error) {
      console.error("Feed sync error:", error);
      toast.error(`${t("feeds.syncError")}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [userId, localFeedService, refreshFeeds, refreshItems, t]);

  /**
   * Verilen URL'ye sahip beslemeleri ekler
   * @param {string} url - Eklenecek beslemenin URL'si
   * @param {string} type - Besleme türü ('rss' veya 'youtube')
   * @returns {Promise<Object>} - Eklenen besleme veya hata
   */
  const addFeed = useCallback(
    async (url, type = "rss") => {
      if (!url) {
        toast.error(t("error.missingUrl.description"));
        return { success: false, error: "URL bulunamadı" };
      }

      try {
        // İlk önce useAuthStore'dan gelen userId'yi kontrol et
        let currentUserId = userId;

        // Eğer userId yoksa, oturumu tekrar kontrol et
        if (!currentUserId) {
          console.log(
            "useAuthStore'dan userId bulunamadı, oturum kontrolü yapılıyor..."
          );
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            console.log("Oturum kontrolünden userId alındı:", session.user.id);
            currentUserId = session.user.id;
          } else {
            console.error("Feed eklenemedi: Kullanıcı oturumu bulunamadı");
            toast.error(t("error.authRequired.description"));
            return { success: false, error: "Kullanıcı oturumu bulunamadı" };
          }
        }

        // YouTube URL'si ise ayrıştırma yapılabilir
        let processedUrl = url;
        if (
          type === "youtube" &&
          (url.includes("youtube.com") || url.includes("youtu.be"))
        ) {
          try {
            // YouTube to RSS API'sini kullan
            const response = await fetch("/api/youtube/to-rss", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url }),
            });

            if (!response.ok) {
              throw new Error(
                `YouTube URL ayrıştırma hatası: ${response.statusText}`
              );
            }

            const result = await response.json();
            if (result?.rssUrl) {
              console.log("YouTube URL'si RSS'e dönüştürüldü:", result.rssUrl);
              processedUrl = result.rssUrl;
            }
          } catch (youtubeError) {
            console.error("YouTube URL ayrıştırma hatası:", youtubeError);
            // Hatayı goster ama işleme devam et - belki direkt URL işe yarar
          }
        }

        console.log("Feed ekleniyor:", processedUrl, type, currentUserId);
        const result = await localFeedService.addFeed(
          processedUrl,
          type,
          currentUserId
        );

        if (result.error) {
          throw new Error(result.error);
        }

        toast.success(t("success.feedAdded.description"));

        // Dashboard'u güncelle
        if (typeof refreshFeeds === "function") {
          refreshFeeds();
        } else {
          console.warn(
            "refreshFeeds fonksiyonu tanımlı değil veya bir fonksiyon değil"
          );
        }

        return { success: true, feed: result };
      } catch (error) {
        console.error("Feed ekleme hatası:", error);

        // Hata mesajını kontrol et ve kullanıcıya anlamlı bir mesaj göster
        let errorMessage = error.message;

        if (error.message.includes("foreign key constraint")) {
          errorMessage =
            "Kullanıcı hesabı veritabanında bulunamadı. Lütfen oturumu kapatıp tekrar giriş yapın.";
        } else if (error.message.includes("CORS")) {
          errorMessage =
            "CORS hatası: Bu feed'e erişim engellenmiş. Başka bir feed deneyin.";
        } else if (error.message.includes("Network Error")) {
          errorMessage =
            "Ağ hatası: Besleme sunucusuna erişilemiyor veya CORS sorunu var.";
        } else if (error.message.includes("duplicate")) {
          errorMessage = "Bu besleme zaten eklenmiş.";
        }

        toast.error(errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [t, refreshFeeds, supabase, localFeedService, userId]
  );

  /**
   * Verilen ID'ye sahip beslemeyi kaldırır
   * @param {string} feedId - Kaldırılacak beslemenin ID'si
   * @returns {Promise<Object>} - İşlem sonucu
   */
  const removeFeed = useCallback(
    async (feedId) => {
      if (!feedId) {
        toast.error(t("error.missingFeedId.description"));
        return { success: false, error: "Feed ID bulunamadı" };
      }

      try {
        // İlk önce useAuthStore'dan gelen userId'yi kontrol et
        let currentUserId = userId;

        // Eğer userId yoksa, oturumu tekrar kontrol et
        if (!currentUserId) {
          console.log(
            "useAuthStore'dan userId bulunamadı, oturum kontrolü yapılıyor..."
          );
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            console.log("Oturum kontrolünden userId alındı:", session.user.id);
            currentUserId = session.user.id;
          } else {
            console.error("Feed silinemedi: Kullanıcı oturumu bulunamadı");
            toast.error(t("error.authRequired.description"));
            return { success: false, error: "Kullanıcı oturumu bulunamadı" };
          }
        }

        console.log("Feed silme işlemi için kullanıcı kimliği:", currentUserId);

        // Feed silme işlemini gerçekleştir
        const result = await localFeedService.deleteFeed(feedId, currentUserId);

        if (result.error) {
          throw new Error(result.error);
        }

        toast.success(t("success.feedRemoved.description"));

        // Dashboard'u güncelle
        if (typeof refreshFeeds === "function") {
          refreshFeeds();
        } else {
          console.warn(
            "refreshFeeds fonksiyonu tanımlı değil veya bir fonksiyon değil"
          );
        }

        return { success: true };
      } catch (error) {
        console.error("Feed silme hatası:", error);

        // Hata mesajını kontrol et ve kullanıcıya anlamlı bir mesaj göster
        let errorMessage = error.message;

        if (error.message.includes("foreign key constraint")) {
          errorMessage =
            "Kullanıcı hesabı bulunamadı. Lütfen oturumu kapatıp tekrar giriş yapın.";
        } else if (
          error.message.includes("not found") ||
          error.message.includes("bulunamadı")
        ) {
          errorMessage = "Bu besleme bulunamadı veya zaten silinmiş.";
        } else if (
          error.message.includes("permission") ||
          error.message.includes("izin")
        ) {
          errorMessage = "Bu beslemeyi silme yetkiniz yok.";
        }

        toast.error(errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [t, refreshFeeds, supabase, localFeedService, userId]
  );

  // Tüm öğeleri okundu olarak işaretle
  const markAllRead = useCallback(
    async (items, feedId = null) => {
      // İlk önce useAuthStore'dan gelen userId'yi kontrol et
      let currentUserId = userId;

      if (!currentUserId) {
        console.log(
          "useAuthStore'dan userId bulunamadı, oturum kontrolü yapılıyor..."
        );
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            console.log("Oturum kontrolünden userId alındı:", session.user.id);
            currentUserId = session.user.id;
          } else {
            console.error("markAllRead: Kullanıcı oturumu bulunamadı");
            toast.error(t("errors.loginRequired"));
            return;
          }
        } catch (error) {
          console.error("Oturum kontrolü sırasında hata:", error);
          toast.error(t("errors.loginRequired"));
          return;
        }
      }

      try {
        const itemsToMark = feedId
          ? items.filter((item) => item.feed_id === feedId && !item.is_read)
          : items.filter((item) => !item.is_read);

        if (itemsToMark.length === 0) {
          toast.info(t("feeds.noUnreadItems"));
          return;
        }

        const promises = itemsToMark.map((item) =>
          localFeedService.toggleRead(item.id, true)
        );

        await Promise.all(promises);
        toast.success(
          t("feeds.allItemsMarkedRead", { count: itemsToMark.length })
        );

        if (typeof refreshItems === "function") {
          refreshItems();
        } else {
          console.warn(
            "refreshItems fonksiyonu tanımlı değil veya bir fonksiyon değil"
          );
        }
      } catch (error) {
        console.error("Mark all read error:", error);
        toast.error(`${t("feeds.markReadError")}: ${error.message}`);
      }
    },
    [userId, refreshItems, t, localFeedService, supabase]
  );

  // İçerik paylaşımı
  const shareItem = useCallback(
    async (item) => {
      if (!item?.url) {
        toast.error(t("errors.noItemToShare"));
        return;
      }

      try {
        if (navigator.share) {
          await navigator.share({
            title: item.title,
            text: item.description || "",
            url: item.url,
          });
          toast.success(t("feeds.itemShared"));
        } else {
          await navigator.clipboard.writeText(item.url);
          toast.success(t("feeds.linkCopied"));
        }
      } catch (error) {
        console.error("Share error:", error);
        // Kullanıcı paylaşımı iptal ettiğinde hata mesajı gösterme
        if (error.name !== "AbortError") {
          toast.error(`${t("feeds.shareError")}: ${error.message}`);
        }
      }
    },
    [t]
  );

  // Öğeyi favorilere ekle/kaldır
  const toggleItemFavorite = useCallback(
    async (itemId, isFavorite) => {
      // İlk önce useAuthStore'dan gelen userId'yi kontrol et
      let currentUserId = userId;

      if (!currentUserId) {
        console.log(
          "useAuthStore'dan userId bulunamadı, oturum kontrolü yapılıyor..."
        );
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            console.log("Oturum kontrolünden userId alındı:", session.user.id);
            currentUserId = session.user.id;
          } else {
            console.error("toggleItemFavorite: Kullanıcı oturumu bulunamadı");
            toast.error(t("errors.loginRequired"));
            return;
          }
        } catch (error) {
          console.error("Oturum kontrolü sırasında hata:", error);
          toast.error(t("errors.loginRequired"));
          return;
        }
      }

      // Kullanıcının veritabanında var olup olmadığını kontrol et
      try {
        const { data: dbUser, error: dbUserError } = await supabase
          .from("users")
          .select("id")
          .eq("id", currentUserId)
          .single();

        if (dbUserError || !dbUser) {
          console.warn(
            "Kullanıcı veritabanında bulunamadı, otomatik kayıt denenecek:",
            currentUserId
          );

          // Kullanıcı yoksa, veritabanına kaydedelim
          try {
            const { error: insertError } = await supabase.from("users").insert({
              id: currentUserId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error("Kullanıcı kaydı oluşturulamadı:", insertError);
              toast.error(
                "Kullanıcı hesabı veritabanında bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın."
              );
              return;
            }

            console.log(
              "Kullanıcı veritabanına otomatik kaydedildi:",
              currentUserId
            );
          } catch (insertError) {
            console.error("Kullanıcı kaydı oluşturulurken hata:", insertError);
            toast.error(
              "Kullanıcı hesabı oluşturulamadı. Lütfen çıkış yapıp tekrar giriş yapın."
            );
            return;
          }
        }
      } catch (error) {
        console.error("Kullanıcı kontrolü sırasında hata:", error);
        toast.error(t("errors.generalError"));
        return;
      }

      try {
        const result = await localFeedService.toggleFavorite(
          itemId,
          isFavorite
        );
        console.log("Favori durumu değiştirildi:", result);
        refreshItems();
        const message = isFavorite
          ? t("feeds.addedToFavorites")
          : t("feeds.removedFromFavorites");
        toast.success(message);
      } catch (error) {
        console.error("Favori durumu değiştirme hatası:", error);
        toast.error(
          `${t("feeds.favoriteToggleError")}: ${error.message || error}`
        );
      }
    },
    [userId, refreshItems, t, localFeedService, supabase]
  );

  // Öğeyi sonra okuma listesine ekle/kaldır
  const toggleItemReadLater = useCallback(
    async (itemId, isReadLater) => {
      // İlk önce useAuthStore'dan gelen userId'yi kontrol et
      let currentUserId = userId;

      if (!currentUserId) {
        console.log(
          "useAuthStore'dan userId bulunamadı, oturum kontrolü yapılıyor..."
        );
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            console.log("Oturum kontrolünden userId alındı:", session.user.id);
            currentUserId = session.user.id;
          } else {
            console.error("toggleItemReadLater: Kullanıcı oturumu bulunamadı");
            toast.error(t("errors.loginRequired"));
            return;
          }
        } catch (error) {
          console.error("Oturum kontrolü sırasında hata:", error);
          toast.error(t("errors.loginRequired"));
          return;
        }
      }

      // Kullanıcının veritabanında var olup olmadığını kontrol et
      try {
        const { data: dbUser, error: dbUserError } = await supabase
          .from("users")
          .select("id")
          .eq("id", currentUserId)
          .single();

        if (dbUserError || !dbUser) {
          console.warn(
            "Kullanıcı veritabanında bulunamadı, otomatik kayıt denenecek:",
            currentUserId
          );

          // Kullanıcı yoksa, veritabanına kaydedelim
          try {
            const { error: insertError } = await supabase.from("users").insert({
              id: currentUserId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error("Kullanıcı kaydı oluşturulamadı:", insertError);
              toast.error(
                "Kullanıcı hesabı veritabanında bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın."
              );
              return;
            }

            console.log(
              "Kullanıcı veritabanına otomatik kaydedildi:",
              currentUserId
            );
          } catch (insertError) {
            console.error("Kullanıcı kaydı oluşturulurken hata:", insertError);
            toast.error(
              "Kullanıcı hesabı oluşturulamadı. Lütfen çıkış yapıp tekrar giriş yapın."
            );
            return;
          }
        }
      } catch (error) {
        console.error("Kullanıcı kontrolü sırasında hata:", error);
        toast.error(t("errors.generalError"));
        return;
      }

      try {
        const result = await localFeedService.toggleReadLater(
          itemId,
          isReadLater
        );
        console.log("Sonra oku durumu değiştirildi:", result);
        refreshItems();
        const message = isReadLater
          ? t("feeds.addedToReadLater")
          : t("feeds.removedFromReadLater");
        toast.success(message);
      } catch (error) {
        console.error("Sonra oku durumu değiştirme hatası:", error);
        toast.error(
          `${t("feeds.readLaterToggleError")}: ${error.message || error}`
        );
      }
    },
    [userId, refreshItems, t, localFeedService, supabase]
  );

  return {
    syncFeeds,
    addFeed,
    removeFeed,
    markAllRead,
    shareItem,
    toggleItemFavorite,
    toggleItemReadLater,
  };
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * RSS beslemelerini yönetmek için React hook.
 *
 * Bu hook RSS besleme ekleme, güncelleme, silme ve listeleme işlemleri için
 * gerekli fonksiyonları ve durum değişkenlerini sağlar.
 */
export function useRssFeeds() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  // RSS besleme URL'sini kontrol et
  const parseRssFeed = async (url) => {
    if (!url) throw new Error("URL gereklidir");

    try {
      console.log("[useRssFeeds] RSS besleme ayrıştırma başlatılıyor:", url);

      const response = await fetch(
        `/api/rss/parse?url=${encodeURIComponent(url)}`,
        {
          credentials: "include",
        }
      );

      // Hata durumlarını daha ayrıntılı ele alalım
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[useRssFeeds] RSS ayrıştırma hatası:", {
          status: response.status,
          statusText: response.statusText,
          error,
        });

        // Özel hata türleri için daha açıklayıcı mesajlar oluşturalım
        if (response.status === 408 || error.error?.includes("zaman aşımı")) {
          throw new Error(
            "RSS beslemesi zaman aşımına uğradı. Besleme çok büyük olabilir veya sunucu yanıt vermiyor."
          );
        }

        if (response.status === 400) {
          if (error.error?.includes("çok büyük")) {
            throw new Error(
              "Besleme boyutu çok büyük. En fazla 5MB boyutunda RSS beslemesi desteklenmektedir."
            );
          }
          if (
            error.error?.includes("geçerli") ||
            error.error?.includes("URL")
          ) {
            throw new Error("Geçerli bir RSS/Atom besleme URL'si giriniz.");
          }
        }

        if (response.status === 404) {
          throw new Error(
            "RSS besleme adresi bulunamadı. URL'nin doğru olduğundan emin olun."
          );
        }

        // Genel hata durumları
        throw new Error(
          error.error || `RSS besleme ayrıştırma hatası (${response.status})`
        );
      }

      const data = await response.json();
      console.log("[useRssFeeds] RSS besleme başarıyla ayrıştırıldı");

      return data;
    } catch (error) {
      console.error("[useRssFeeds] RSS besleme ayrıştırma hatası:", error);

      // Network hataları için özel mesajlar
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "RSS beslemesine erişim sağlanamadı. Internet bağlantınızı kontrol edin."
        );
      }

      // Özel hata mesajları eklenmediyse kendi hata mesajını kullan
      throw error;
    }
  };

  // RSS beslemesi ekle
  const { mutate: addRssFeed, isLoading: isAddingRssFeed } = useMutation({
    mutationFn: async (url) => {
      const response = await fetch("/api/rss/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "RSS besleme ekleme hatası");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.addRssFeed.success"));
    },
    onError: (error) => {
      console.error("RSS besleme ekleme hatası:", error);
      toast.error(error.message || t("feeds.addRssFeed.error"));
    },
  });

  // RSS beslemesini güncelle
  const { mutate: updateRssFeed, isLoading: isUpdatingRssFeed } = useMutation({
    mutationFn: async (feedId) => {
      const response = await fetch("/api/rss/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedId }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "RSS besleme güncelleme hatası");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.updateFeed.success"));
    },
    onError: (error) => {
      console.error("RSS besleme güncelleme hatası:", error);
      toast.error(error.message || t("feeds.updateFeed.error"));
    },
  });

  // RSS beslemesini sil
  const { mutate: deleteRssFeed, isLoading: isDeletingRssFeed } = useMutation({
    mutationFn: async (feedId) => {
      const response = await fetch(`/api/rss/delete?feedId=${feedId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "RSS besleme silme hatası");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.deleteFeed.success"));
    },
    onError: (error) => {
      console.error("RSS besleme silme hatası:", error);
      toast.error(error.message || t("feeds.deleteFeed.error"));
    },
  });

  // URL doğrulama
  const validateUrl = (url) => {
    if (!url) return "URL zorunludur";

    // Boşluk kontrolü - genellikle kopyala/yapıştır sorunlarına yol açar
    if (url.trim() !== url)
      return "URL'nin başında veya sonunda boşluk olmamalıdır";

    // Çok uzun URL kontrolü - performans sorunlarını önlemek için
    if (url.length > 2000) return "URL çok uzun";

    try {
      // URL'yi doğrulamak için URL constructor kullan - daha hızlı ve güvenilir
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return "";
    } catch (e) {
      return "Geçerli bir URL giriniz";
    }
  };

  return {
    parseRssFeed,
    addRssFeed,
    updateRssFeed,
    deleteRssFeed,
    validateUrl,
    isAddingRssFeed,
    isUpdatingRssFeed,
    isDeletingRssFeed,
  };
}

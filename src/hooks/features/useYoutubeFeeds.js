"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * YouTube besleme operasyonları için hook.
 *
 * Bu hook, YouTube kanallarını ayrıştırmak, eklemek, güncellemek ve silmek gibi
 * operasyonlar için gereken fonksiyonları ve durum bilgilerini sağlar.
 *
 * @returns {{
 *  parseYoutubeChannel: (channelId: string) => Promise<Object>,
 *  addYoutubeChannel: (channelData: Object) => Promise<Object>,
 *  updateYoutubeChannel: (feedId: string, channelData: Object) => Promise<Object>,
 *  deleteYoutubeChannel: (feedId: string) => Promise<void>,
 *  isParsingChannel: boolean,
 *  isAddingChannel: boolean,
 *  isUpdatingChannel: boolean,
 *  isDeletingChannel: boolean
 * }}
 */
export function useYoutubeFeeds() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  /**
   * AbortController ile birlikte fetch işlemi yapar,
   * belirli bir süre sonra zaman aşımına uğrar
   *
   * @param {string} url - API URL
   * @param {Object} options - Fetch options
   * @param {number} timeoutMs - Zaman aşımı (ms)
   * @returns {Promise<any>} - API yanıtı
   */
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    console.log("[useYoutubeFeeds] fetchWithTimeout başlatılıyor:", {
      url,
      options: { ...options, body: options.body ? "Var" : "Yok" },
      timeoutMs,
    });

    const controller = new AbortController();
    const { signal } = controller;

    // Timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        console.error("[useYoutubeFeeds] Zaman aşımı gerçekleşti:", {
          url,
          timeoutMs,
        });
        reject(new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin."));
      }, timeoutMs);
    });

    try {
      // Birleştirilmiş seçenekler
      const fetchOptions = {
        ...options,
        signal,
        headers: {
          ...options.headers,
        },
      };

      console.log("[useYoutubeFeeds] Fetch isteği gönderiliyor:", { url });

      // Fetch ve timeout yarışını başlat
      const response = await Promise.race([
        fetch(url, fetchOptions),
        timeoutPromise,
      ]);

      console.log("[useYoutubeFeeds] Fetch yanıtı alındı:", {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      });

      // Başarılı yanıt kontrolü
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[useYoutubeFeeds] HTTP Hatası:", {
          url,
          status: response.status,
          errorData,
        });
        throw new Error(errorData.error || `HTTP Hatası: ${response.status}`);
      }

      const data = await response.json();
      console.log("[useYoutubeFeeds] Yanıt başarıyla ayrıştırıldı:", {
        url,
        dataSize: JSON.stringify(data).length,
        dataPreview: truncateObject(data, 3),
      });

      return data;
    } catch (error) {
      console.error("[useYoutubeFeeds] Fetch hatası:", {
        url,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      if (error.name === "AbortError") {
        throw new Error("İstek zaman aşımına uğradı veya iptal edildi.");
      }
      throw error;
    }
  };

  // Büyük objeleri konsol çıktısı için kısaltan yardımcı fonksiyon
  const truncateObject = (obj, depth = 2) => {
    if (depth <= 0) return "...";
    if (!obj || typeof obj !== "object") return obj;

    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (Array.isArray(obj[key])) {
          result[key] =
            obj[key].length > 3
              ? [
                  ...obj[key]
                    .slice(0, 3)
                    .map((i) => truncateObject(i, depth - 1)),
                  `...ve ${obj[key].length - 3} daha`,
                ]
              : obj[key].map((i) => truncateObject(i, depth - 1));
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          result[key] = truncateObject(obj[key], depth - 1);
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  };

  /**
   * YouTube kanalını ayrıştırma mutasyonu
   */
  const parseChannelMutation = useMutation({
    mutationFn: async (channelId) => {
      console.log("[useYoutubeFeeds] parseChannelMutation başlatılıyor:", {
        channelId,
      });

      // URL içerisindeki özel karakterleri kodla
      const encodedChannelId = encodeURIComponent(channelId);
      console.log("[useYoutubeFeeds] Kodlanmış channelId:", {
        encodedChannelId,
      });

      try {
        console.log("[useYoutubeFeeds] fetchWithTimeout çağrılıyor (parse)");
        const data = await fetchWithTimeout(
          `/api/youtube/parse?channelId=${encodedChannelId}`,
          {},
          15000 // 15 saniye timeout
        );
        console.log("[useYoutubeFeeds] parseChannelMutation başarılı:", {
          dataKeys: Object.keys(data),
          channelTitle: data.channel?.title,
          videosCount: data.videos?.length,
          suggestedCount: data.suggestedChannels?.length,
        });
        return data;
      } catch (error) {
        console.error(
          "[useYoutubeFeeds] YouTube kanal ayrıştırma hatası:",
          error
        );
        console.error("[useYoutubeFeeds] Hata detayları:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        throw new Error(error.message || "YouTube kanalı ayrıştırılamadı");
      }
    },
    onError: (error) => {
      console.error("[useYoutubeFeeds] parseChannelMutation onError:", {
        errorMessage: error.message,
      });
      toast.error(error.message || t("feeds.addYoutubeFeed.parseError"), {
        id: "parse-youtube-error",
      });
    },
  });

  /**
   * YouTube kanalı ekleme mutasyonu
   */
  const addChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      if (!channelData || !channelData.channel) {
        throw new Error("Geçersiz kanal verisi");
      }

      try {
        const response = await fetchWithTimeout(
          "/api/youtube/add",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ channelId: channelData.channel.id }),
          },
          15000 // 15 saniye timeout
        );
        return response;
      } catch (error) {
        console.error("YouTube kanal ekleme hatası:", error);
        throw new Error(
          error.message || "YouTube kanalı eklenirken bir hata oluştu"
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      toast.success(t("feeds.addYoutubeFeed.added"), {
        id: "add-youtube-success",
      });
    },
    onError: (error) => {
      toast.error(error.message || t("feeds.addYoutubeFeed.addError"), {
        id: "add-youtube-error",
      });
    },
  });

  /**
   * YouTube kanalı güncelleme mutasyonu
   */
  const updateChannelMutation = useMutation({
    mutationFn: async ({ feedId, channelData }) => {
      if (!feedId) {
        throw new Error("Feed ID gereklidir");
      }

      try {
        const response = await fetchWithTimeout(
          "/api/youtube/update",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ feedId, channelData }),
          },
          15000 // 15 saniye timeout
        );
        return response;
      } catch (error) {
        console.error("YouTube kanal güncelleme hatası:", error);
        throw new Error(
          error.message || "YouTube kanalı güncellenirken bir hata oluştu"
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      toast.success(t("feeds.updateYoutubeFeed.updated"), {
        id: "update-youtube-success",
      });
    },
    onError: (error) => {
      toast.error(error.message || t("feeds.updateYoutubeFeed.updateError"), {
        id: "update-youtube-error",
      });
    },
  });

  /**
   * YouTube kanalı silme mutasyonu
   */
  const deleteChannelMutation = useMutation({
    mutationFn: async (feedId) => {
      if (!feedId) {
        throw new Error("Feed ID gereklidir");
      }

      try {
        const response = await fetchWithTimeout(
          "/api/youtube/delete",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ feedId }),
          },
          10000 // 10 saniye timeout
        );
        return response;
      } catch (error) {
        console.error("YouTube kanal silme hatası:", error);
        throw new Error(
          error.message || "YouTube kanalı silinirken bir hata oluştu"
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      toast.success(t("feeds.deleteYoutubeFeed.deleted"), {
        id: "delete-youtube-success",
      });
    },
    onError: (error) => {
      toast.error(error.message || t("feeds.deleteYoutubeFeed.deleteError"), {
        id: "delete-youtube-error",
      });
    },
  });

  return {
    parseYoutubeChannel: parseChannelMutation.mutateAsync,
    addYoutubeChannel: addChannelMutation.mutateAsync,
    updateYoutubeChannel: updateChannelMutation.mutateAsync,
    deleteYoutubeChannel: deleteChannelMutation.mutateAsync,
    isParsingChannel: parseChannelMutation.isPending,
    isAddingChannel: addChannelMutation.isPending,
    isUpdatingChannel: updateChannelMutation.isPending,
    isDeletingChannel: deleteChannelMutation.isPending,
  };
}

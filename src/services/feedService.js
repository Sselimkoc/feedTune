"use client";

import { feedRepository } from "@/repositories/feedRepository";
import { toast } from "sonner";

/**
 * Feed işlemlerini yöneten servis katmanı.
 * Bu katman repository ile UI arasında aracılık yapar ve iş mantığını içerir.
 */
export class FeedService {
  constructor() {
    this.repository = feedRepository;
  }

  /**
   * Kullanıcının feedlerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Kullanıcının feedleri
   */
  async getFeeds(userId) {
    try {
      return await this.repository.getFeeds(userId);
    } catch (error) {
      console.error("Feed getirme hatası:", error);
      toast.error("Feed'ler yüklenirken bir hata oluştu.");
      return [];
    }
  }

  /**
   * Feed öğelerini getirir ve her feed için öğe sayısını sınırlar
   * @param {Array<string>} feedIds Feed ID'leri
   * @param {number} limit Her feed için maksimum öğe sayısı
   * @returns {Promise<Array>} Feed öğeleri
   */
  async getFeedItems(feedIds, limit = 10) {
    try {
      if (!feedIds || feedIds.length === 0) return [];
      return await this.repository.getFeedItems(feedIds, limit);
    } catch (error) {
      console.error("Feed öğeleri getirme hatası:", error);
      toast.error("Feed içerikleri yüklenirken bir hata oluştu.");
      return [];
    }
  }

  /**
   * Kullanıcının favori öğelerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Favori öğeler
   */
  async getFavorites(userId) {
    try {
      return await this.repository.getFavoriteItems(userId);
    } catch (error) {
      console.error("Favorileri getirme hatası:", error);
      toast.error("Favoriler yüklenirken bir hata oluştu.");
      return [];
    }
  }

  /**
   * Kullanıcının daha sonra okuma listesindeki öğeleri getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Daha sonra okunacak öğeler
   */
  async getReadLaterItems(userId) {
    try {
      return await this.repository.getReadLaterItems(userId);
    } catch (error) {
      console.error("Okuma listesini getirme hatası:", error);
      toast.error("Okuma listesi yüklenirken bir hata oluştu.");
      return [];
    }
  }

  /**
   * Öğe okundu/okunmadı durumunu değiştirir
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {boolean} isRead Okundu durumu
   * @returns {Promise<object>} Güncellenen veri
   */
  async toggleItemReadStatus(userId, itemId, isRead) {
    try {
      return await this.repository.updateItemInteraction(userId, itemId, {
        is_read: isRead,
      });
    } catch (error) {
      console.error("Okuma durumu güncelleme hatası:", error);
      toast.error("Okuma durumu güncellenirken bir hata oluştu.");
      throw error;
    }
  }

  /**
   * Öğe favori durumunu değiştirir
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {boolean} isFavorite Favori durumu
   * @returns {Promise<object>} Güncellenen veri
   */
  async toggleItemFavoriteStatus(userId, itemId, isFavorite) {
    try {
      return await this.repository.updateItemInteraction(userId, itemId, {
        is_favorite: isFavorite,
      });
    } catch (error) {
      console.error("Favori durumu güncelleme hatası:", error);
      toast.error("Favori durumu güncellenirken bir hata oluştu.");
      throw error;
    }
  }

  /**
   * Öğe daha sonra oku durumunu değiştirir
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {boolean} isReadLater Daha sonra oku durumu
   * @returns {Promise<object>} Güncellenen veri
   */
  async toggleItemReadLaterStatus(userId, itemId, isReadLater) {
    try {
      return await this.repository.updateItemInteraction(userId, itemId, {
        is_read_later: isReadLater,
      });
    } catch (error) {
      console.error("Daha sonra oku durumu güncelleme hatası:", error);
      toast.error("Daha sonra oku durumu güncellenirken bir hata oluştu.");
      throw error;
    }
  }

  /**
   * Yeni bir RSS feed ekler
   * @param {string} url RSS feed URL'si
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<object>} Eklenen feed
   */
  async addRssFeed(url, userId) {
    try {
      if (!userId) throw new Error("Kullanıcı ID'si gerekli");
      if (!url) throw new Error("Feed URL'si gerekli");

      // URL validasyonu
      try {
        new URL(url);
      } catch (e) {
        throw new Error("Geçerli bir URL giriniz");
      }

      // Repository çağrısı
      return await this.repository.addFeed({
        url,
        user_id: userId,
        type: "rss",
        is_active: true,
      });
    } catch (error) {
      console.error("RSS Feed ekleme hatası:", error);
      throw error;
    }
  }

  /**
   * Yeni bir YouTube feed ekler
   * @param {string} channelId YouTube kanal ID'si veya URL'si
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<object>} Eklenen feed
   */
  async addYoutubeFeed(channelId, userId) {
    try {
      if (!userId) throw new Error("Kullanıcı ID'si gerekli");
      if (!channelId) throw new Error("Kanal ID'si veya URL'si gerekli");

      // URL'den kanal ID'si çıkarma
      let actualChannelId = channelId;
      if (channelId.includes("youtube.com")) {
        try {
          const url = new URL(channelId);
          if (url.pathname.includes("/channel/")) {
            actualChannelId = url.pathname.split("/channel/")[1];
          } else if (
            url.pathname.includes("/c/") ||
            url.pathname.includes("/@")
          ) {
            // Kanal adı formatını ID'ye çevirme burada yapılabilir
            // Gerçek implementasyonda YouTube API kullanmak gerekebilir
          }
        } catch (e) {
          throw new Error("Geçerli bir YouTube URL'si giriniz");
        }
      }

      // Repository çağrısı
      return await this.repository.addFeed({
        url: `https://www.youtube.com/feeds/videos.xml?channel_id=${actualChannelId}`,
        user_id: userId,
        type: "youtube",
        channel_id: actualChannelId,
        is_active: true,
      });
    } catch (error) {
      console.error("YouTube Feed ekleme hatası:", error);
      throw error;
    }
  }

  /**
   * Feed siler
   * @param {string} feedId Feed ID'si
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<boolean>} İşlem başarılı mı?
   */
  async deleteFeed(feedId, userId) {
    try {
      if (!userId) throw new Error("Kullanıcı ID'si gerekli");
      if (!feedId) throw new Error("Feed ID'si gerekli");

      // Kullanıcının feed'i olup olmadığını kontrol et
      const userFeeds = await this.repository.getFeeds(userId);
      const feedExists = userFeeds.some((feed) => feed.id === feedId);

      if (!feedExists) {
        throw new Error("Bu feed size ait değil veya bulunamadı");
      }

      // İşlemi gerçekleştir
      return await this.repository.deleteFeed(feedId, userId);
    } catch (error) {
      console.error("Feed silme hatası:", error);
      throw error;
    }
  }

  /**
   * Her feed için öğe sayısını sınırlar
   * @param {Array} feeds Feed'ler
   * @param {Array} items Öğeler
   * @param {number} limit Her feed başına maksimum öğe sayısı
   * @returns {Array} Sınırlandırılmış öğeler
   */
  limitItemsPerFeed(feeds, items, limit = 10) {
    if (!feeds || !items) return { feeds: [], items: [] };

    const itemsByFeed = items.reduce((acc, item) => {
      if (!acc[item.feed_id]) {
        acc[item.feed_id] = [];
      }
      acc[item.feed_id].push(item);
      return acc;
    }, {});

    const limitedItems = [];
    Object.entries(itemsByFeed).forEach(([feedId, feedItems]) => {
      limitedItems.push(...feedItems.slice(0, limit));
    });

    return { feeds, items: limitedItems };
  }
}

// Singleton instance - Uygulama boyunca tek bir örnek kullanmak için
export const feedService = new FeedService();

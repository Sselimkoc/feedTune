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

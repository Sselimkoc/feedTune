import { DbClient } from "./index.js";

/**
 * Feed veritabanı işlemleri için repository sınıfı
 * Bu sınıf, feed ile ilgili tüm veritabanı işlemlerini soyutlar
 */
export class FeedRepository {
  constructor() {
    this.db = new DbClient();
  }

  /**
   * Kullanıcının feedlerini getirir
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Array>} - Feed listesi
   */
  async getFeeds(userId) {
    try {
      const result = await this.db.query("feeds", {
        eq: { user_id: userId },
        order: { created_at: "desc" },
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting feeds:", error);
      return [];
    }
  }

  /**
   * Feed öğelerini getirir
   * @param {Array} feedIds - Feed ID'leri
   * @param {number} limit - Limit
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Array>} - Feed öğeleri
   */
  async getFeedItems(feedIds, limit = 10, userId = null) {
    try {
      const result = await this.db.query("feed_items", {
        in: { feed_id: feedIds },
        order: { published_at: "desc" },
        limit: limit,
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting feed items:", error);
      return [];
    }
  }

  /**
   * Kullanıcının favori öğelerini getirir
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Array>} - Favori öğeler
   */
  async getFavoriteItems(userId) {
    try {
      const result = await this.db.query("rss_interactions", {
        eq: { user_id: userId, is_favorite: true },
        order: { created_at: "desc" },
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting favorite items:", error);
      return [];
    }
  }

  /**
   * Kullanıcının daha sonra okuma listesindeki öğeleri getirir
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Array>} - Daha sonra okunacak öğeler
   */
  async getReadLaterItems(userId) {
    try {
      const result = await this.db.query("rss_interactions", {
        eq: { user_id: userId, is_read_later: true },
        order: { created_at: "desc" },
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting read later items:", error);
      return [];
    }
  }

  /**
   * Öğe etkileşimini günceller
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} itemId - Öğe ID'si
   * @param {string} feedType - Feed tipi
   * @param {Object} updates - Güncellenecek alanlar
   * @returns {Promise<Object>} - Güncelleme sonucu
   */
  async updateItemInteraction(userId, itemId, feedType, updates) {
    const table =
      feedType === "youtube" ? "youtube_interactions" : "rss_interactions";
    try {
      const result = await this.db.update(
        table,
        { eq: { user_id: userId, item_id: itemId } },
        updates
      );
      return result.data;
    } catch (error) {
      console.error("Error updating item interaction:", error);
      throw error;
    }
  }

  /**
   * Yeni feed ekler
   * @param {Object} feedData - Feed verisi
   * @returns {Promise<Object>} - Eklenen feed
   */
  async addFeed(feedData) {
    try {
      const result = await this.db.insert("feeds", feedData);
      return result.data;
    } catch (error) {
      console.error("Error adding feed:", error);
      throw error;
    }
  }

  /**
   * Feed siler
   * @param {string} feedId - Feed ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Object>} - Silme sonucu
   */
  async deleteFeed(feedId, userId) {
    try {
      const result = await this.db.delete("feeds", {
        eq: { id: feedId, user_id: userId },
      });
      return result.data;
    } catch (error) {
      console.error("Error deleting feed:", error);
      throw error;
    }
  }

  /**
   * Eski öğeleri temizler
   * @param {string} userId - Kullanıcı ID'si
   * @param {number} olderThanDays - Kaç günden eski
   * @param {boolean} keepFavorites - Favorileri koru
   * @param {boolean} keepReadLater - Daha sonra okunacakları koru
   * @returns {Promise<Object>} - Temizleme sonucu
   */
  async cleanUpOldItems(
    userId,
    olderThanDays = 30,
    keepFavorites = true,
    keepReadLater = true
  ) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.db.delete("feed_items", {
        lt: { published_at: cutoffDate.toISOString() },
      });
      return result.data;
    } catch (error) {
      console.error("Error cleaning up old items:", error);
      throw error;
    }
  }

  /**
   * Sayfalanmış feed öğelerini getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {number} page - Sayfa numarası
   * @param {number} pageSize - Sayfa boyutu
   * @param {Object} filters - Filtreler
   * @returns {Promise<Object>} - Sayfalanmış sonuçlar
   */
  async getPaginatedFeedItems(userId, page = 1, pageSize = 12, filters = {}) {
    try {
      const offset = (page - 1) * pageSize;
      const result = await this.db.query("feed_items", {
        order: { published_at: "desc" },
        limit: pageSize,
        offset: offset,
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting paginated feed items:", error);
      return [];
    }
  }

  /**
   * Kullanıcı etkileşimlerini getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {Array} itemIds - Öğe ID'leri
   * @returns {Promise<Array>} - Etkileşimler
   */
  async getUserInteractions(userId, itemIds, type = "rss") {
    const table =
      type === "youtube" ? "youtube_interactions" : "rss_interactions";
    try {
      const result = await this.db.query(table, {
        eq: { user_id: userId },
        in: { item_id: itemIds },
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting user interactions:", error);
      return [];
    }
  }

  /**
   * Feed öğelerini senkronize eder
   * @param {string} feedId - Feed ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} feedType - Feed tipi
   * @param {Object} options - Seçenekler
   * @returns {Promise<Object>} - Senkronizasyon sonucu
   */
  async syncFeedItems(feedId, userId, feedType, options = {}) {
    try {
      // Bu metod feed senkronizasyonu için kullanılır
      // Şimdilik basit bir implementasyon
      return { success: true, items: [] };
    } catch (error) {
      console.error("Error syncing feed items:", error);
      throw error;
    }
  }

  /**
   * Feed'in son güncelleme zamanını günceller
   * @param {string} feedId - Feed ID'si
   * @returns {Promise<Object>} - Güncelleme sonucu
   */
  async updateFeedLastUpdated(feedId) {
    try {
      const result = await this.db.update(
        "feeds",
        { eq: { id: feedId } },
        { last_updated: new Date().toISOString() }
      );
      return result.data;
    } catch (error) {
      console.error("Error updating feed last updated:", error);
      throw error;
    }
  }

  /**
   * Feed tipini getirir
   * @param {string} feedId - Feed ID'si
   * @returns {Promise<string>} - Feed tipi
   */
  async getFeedType(feedId) {
    try {
      const result = await this.db.query(
        "feeds",
        {
          eq: { id: feedId },
          select: "type",
        },
        true
      );
      return result.data?.type || "rss";
    } catch (error) {
      console.error("Error getting feed type:", error);
      return "rss";
    }
  }

  /**
   * RSS öğesi ekler
   * @param {Object} rssItemData - RSS öğe verisi
   * @returns {Promise<Object>} - Eklenen öğe
   */
  async addRssItem(rssItemData) {
    try {
      const result = await this.db.insert("feed_items", rssItemData);
      return result.data;
    } catch (error) {
      console.error("Error adding RSS item:", error);
      throw error;
    }
  }

  /**
   * YouTube öğesi ekler
   * @param {Object} youtubeItemData - YouTube öğe verisi
   * @returns {Promise<Object>} - Eklenen öğe
   */
  async addYoutubeItem(youtubeItemData) {
    try {
      const result = await this.db.insert("youtube_items", youtubeItemData);
      return result.data;
    } catch (error) {
      console.error("Error adding YouTube item:", error);
      throw error;
    }
  }
}

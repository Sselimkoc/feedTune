"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Feed verilerine erişim sağlayan repository sınıfı.
 * Tüm Supabase sorguları bu sınıf üzerinden yapılır.
 */
export class FeedRepository {
  constructor() {
    this.supabase = createClientComponentClient();
  }

  /**
   * Kullanıcının feedlerini çeker
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Kullanıcının feedleri
   */
  async getFeeds(userId) {
    const { data, error } = await this.supabase
      .from("feeds")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Feed öğelerini çeker
   * @param {Array<string>} feedIds Feed ID'leri
   * @param {number} limit Her feed için maksimum öğe sayısı
   * @returns {Promise<Array>} Feed öğeleri
   */
  async getFeedItems(feedIds, limit = 10) {
    if (!feedIds || feedIds.length === 0) return [];

    // Her feed için ayrı ayrı sorgu yap ve her birinden sadece limit kadar öğe al
    const promises = feedIds.map(async (feedId) => {
      const { data, error } = await this.supabase
        .from("feed_items")
        .select("*")
        .eq("feed_id", feedId)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data;
    });

    // Tüm sorguların sonuçlarını bekle ve birleştir
    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * Kullanıcının favorilerini çeker
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Favori öğeler
   */
  async getFavoriteItems(userId) {
    if (!userId) return [];

    try {
      // Önce kullanıcının favori etkileşimlerini al
      const { data: interactions, error: interactionsError } =
        await this.supabase
          .from("user_item_interactions")
          .select("item_id")
          .eq("user_id", userId)
          .eq("is_favorite", true);

      if (interactionsError) throw interactionsError;

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // Ardından bu öğelerin detaylarını al
      const itemIds = interactions.map((interaction) => interaction.item_id);
      const { data: items, error: itemsError } = await this.supabase
        .from("feed_items")
        .select(
          `
          *,
          feeds:feed_id (
            id,
            title,
            site_favicon,
            type
          )
        `
        )
        .in("id", itemIds)
        .order("published_at", { ascending: false });

      if (itemsError) throw itemsError;

      // Etkileşim bilgilerini öğelere ekle
      const itemsWithInteractions = items.map((item) => ({
        ...item,
        is_favorite: true, // Zaten favorilerde olduğunu biliyoruz
        feed_title: item.feeds?.title || "Bilinmeyen Kaynak",
        feed_type: item.feeds?.type || "rss",
        site_favicon: item.feeds?.site_favicon || null,
      }));

      return itemsWithInteractions;
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  }

  /**
   * Kullanıcının daha sonra okuma listesindeki öğeleri çeker
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Daha sonra okunacak öğeler
   */
  async getReadLaterItems(userId) {
    if (!userId) return [];

    try {
      // Önce kullanıcının okuma listesi etkileşimlerini al
      const { data: interactions, error: interactionsError } =
        await this.supabase
          .from("user_item_interactions")
          .select("item_id")
          .eq("user_id", userId)
          .eq("is_read_later", true);

      if (interactionsError) throw interactionsError;

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // Ardından bu öğelerin detaylarını al
      const itemIds = interactions.map((interaction) => interaction.item_id);
      const { data: items, error: itemsError } = await this.supabase
        .from("feed_items")
        .select(
          `
          *,
          feeds:feed_id (
            id,
            title,
            site_favicon,
            type
          )
        `
        )
        .in("id", itemIds)
        .order("published_at", { ascending: false });

      if (itemsError) throw itemsError;

      // Etkileşim bilgilerini öğelere ekle
      const itemsWithInteractions = items.map((item) => ({
        ...item,
        is_read_later: true, // Zaten okuma listesinde olduğunu biliyoruz
        feed_title: item.feeds?.title || "Bilinmeyen Kaynak",
        feed_type: item.feeds?.type || "rss",
        site_favicon: item.feeds?.site_favicon || null,
      }));

      return itemsWithInteractions;
    } catch (error) {
      console.error("Error fetching read later items:", error);
      throw error;
    }
  }

  /**
   * Kullanıcı ve öğe etkileşimlerini günceller
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {object} updates Güncellenecek alanlar
   * @returns {Promise<object>} Güncellenen veri
   */
  async updateItemInteraction(userId, itemId, updates) {
    try {
      const { error } = await this.supabase
        .from("user_item_interactions")
        .upsert(
          {
            user_id: userId,
            item_id: itemId,
            ...updates,
          },
          {
            onConflict: "user_id,item_id",
          }
        );

      if (error) throw error;
      return { userId, itemId, ...updates };
    } catch (error) {
      console.error("Error updating item interaction:", error);
      throw error;
    }
  }

  /**
   * Kullanıcının etkileşimlerini çeker
   * @param {string} userId Kullanıcı ID'si
   * @param {Array<string>} itemIds Öğe ID'leri
   * @returns {Promise<Array>} Kullanıcı etkileşimleri
   */
  async getUserInteractions(userId, itemIds) {
    if (!userId || !itemIds || itemIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from("user_item_interactions")
      .select("*")
      .eq("user_id", userId)
      .in("item_id", itemIds);

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Yeni bir feed ekler
   * @param {object} feedData Feed verileri
   * @returns {Promise<object>} Eklenen feed
   */
  async addFeed(feedData) {
    try {
      // Feed için gerekli alanları kontrol et
      if (!feedData.url) throw new Error("Feed URL'si gerekli");
      if (!feedData.user_id) throw new Error("Kullanıcı ID'si gerekli");
      if (!feedData.type) throw new Error("Feed türü gerekli");

      // Aynı URL'ye sahip feed var mı kontrol et
      const { data: existingFeed, error: checkError } = await this.supabase
        .from("feeds")
        .select("id")
        .eq("url", feedData.url)
        .eq("user_id", feedData.user_id)
        .eq("is_active", true)
        .maybeSingle();

      if (checkError) throw checkError;

      // Eğer zaten varsa hata fırlat
      if (existingFeed) {
        throw new Error("Bu feed zaten eklenmiş");
      }

      // Yeni feed ekle
      const { data, error } = await this.supabase
        .from("feeds")
        .insert({
          url: feedData.url,
          user_id: feedData.user_id,
          type: feedData.type,
          title: feedData.title || null,
          description: feedData.description || null,
          site_url: feedData.site_url || null,
          site_favicon: feedData.site_favicon || null,
          channel_id: feedData.channel_id || null,
          is_active:
            feedData.is_active !== undefined ? feedData.is_active : true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Feed işleme kuyruğuna ekle (burada bir event gönderebilirsiniz)
      // Bu adım backend tarafında feed içeriklerini okuyacak bir servis için olabilir

      return data;
    } catch (error) {
      console.error("Error adding feed:", error);
      throw error;
    }
  }

  /**
   * Feed siler (soft delete)
   * @param {string} feedId Feed ID'si
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<boolean>} İşlem başarılı mı?
   */
  async deleteFeed(feedId, userId) {
    try {
      // Soft delete (is_active = false olarak işaretle)
      const { error } = await this.supabase
        .from("feeds")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", feedId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting feed:", error);
      throw error;
    }
  }
}

// Singleton instance - Tek bir repository örneği kullanmak için
export const feedRepository = new FeedRepository();

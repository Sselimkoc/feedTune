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
}

// Singleton instance - Uygulama boyunca tek bir örnek kullanmak için
export const feedRepository = new FeedRepository();

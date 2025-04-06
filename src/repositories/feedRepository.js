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
   * @param {string} timestamp Timestamp
   * @returns {Promise<Array>} Kullanıcının feedleri
   */
  async getFeeds(userId, timestamp = null) {
    try {
      if (!userId) return [];

      // Timestamp parametresi ekledik, böylece her çağrı eşsiz olacak
      // ve Supabase önbelleği kullanmayacak (verileri yeniden çekecek)
      const options = timestamp
        ? { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        : undefined;

    const { data, error } = await this.supabase
      .from("feeds")
        .select(
          `
          id,
          url,
          type,
          title,
          description,
          site_url,
          site_favicon,
          channel_id,
          is_active,
          created_at,
          updated_at
        `
        )
      .eq("user_id", userId)
      .eq("is_active", true)
        .order("created_at", { ascending: false })
        .select(undefined, options);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching feeds:", error);
      throw error;
    }
  }

  /**
   * Feed öğelerini çeker
   * @param {Array<string>} feedIds Feed ID'leri
   * @param {number} limit Her feed için maksimum öğe sayısı
   * @param {string} timestamp Timestamp
   * @returns {Promise<Array>} Feed öğeleri
   */
  async getFeedItems(feedIds, limit = 10, timestamp = null) {
    try {
      if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0)
        return [];

      // Zaman damgası parametresi ekledik
      const options = timestamp
        ? { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        : undefined;

      const { data, error } = await this.supabase
        .from("feed_items")
        .select(
          `
          id,
          feed_id,
          title,
          description,
          url,
          link,
          guid,
          published_at,
          thumbnail,
          author,
          categories
        `
        )
        .in("feed_id", feedIds)
        .order("published_at", { ascending: false })
        .select(undefined, options);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching feed items:", error);
      throw error;
    }
  }

  /**
   * Kullanıcının favorilerini çeker
   * @param {string} userId Kullanıcı ID'si
   * @param {string} timestamp Timestamp
   * @returns {Promise<Array>} Favori öğeler
   */
  async getFavoriteItems(userId, timestamp = null) {
    if (!userId) return [];

    try {
      // Zaman damgası parametresi ekledik
      const options = timestamp
        ? { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        : undefined;

      // Önce kullanıcının favori etkileşimlerini al
      const { data: interactions, error: interactionsError } =
        await this.supabase
          .from("user_item_interactions")
          .select("item_id")
          .eq("user_id", userId)
          .eq("is_favorite", true)
          .select(undefined, options);

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
        .order("published_at", { ascending: false })
        .select(undefined, options);

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
      console.error("Error fetching favorite items:", error);
      throw error;
    }
  }

  /**
   * Kullanıcının daha sonra okuma listesindeki öğeleri çeker
   * @param {string} userId Kullanıcı ID'si
   * @param {string} timestamp Timestamp
   * @returns {Promise<Array>} Daha sonra okunacak öğeler
   */
  async getReadLaterItems(userId, timestamp = null) {
    if (!userId) return [];

    try {
      // Zaman damgası parametresi ekledik
      const options = timestamp
        ? { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        : undefined;

      // Önce kullanıcının okuma listesi etkileşimlerini al
      const { data: interactions, error: interactionsError } =
        await this.supabase
          .from("user_item_interactions")
          .select("item_id")
          .eq("user_id", userId)
          .eq("is_read_later", true)
          .select(undefined, options);

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
        .order("published_at", { ascending: false })
        .select(undefined, options);

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

  /**
   * Eski ve etkileşimsiz feed öğelerini temizler
   * @param {string} userId Kullanıcı ID'si
   * @param {number} olderThanDays Belirtilen günden daha eski öğeleri siler (varsayılan: 30 gün)
   * @param {boolean} keepFavorites Favorileri korur (varsayılan: true)
   * @param {boolean} keepReadLater "Sonra Oku" olarak işaretlenmiş öğeleri korur (varsayılan: true)
   * @returns {Promise<{deleted: number, error: any}>} Silinen öğe sayısı ve varsa hata
   */
  async cleanUpOldItems(
    userId,
    olderThanDays = 30,
    keepFavorites = true,
    keepReadLater = true
  ) {
    try {
      if (!userId) throw new Error("Kullanıcı ID'si gerekli");

      // Belirtilen günden önceki tarih
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffDateStr = cutoffDate.toISOString();

      // 1. Önce, etkileşim olmayan feed öğelerini bul
      const { data: interactionItems, error: interactionError } =
        await this.supabase
          .from("user_item_interactions")
          .select("item_id")
          .eq("user_id", userId);

      if (interactionError) throw interactionError;

      // Korunacak öğe ID'leri
      const interactionItemIds =
        interactionItems?.map((item) => item.item_id) || [];

      // 2. Favoriler ve "Sonra Oku" öğelerini listeye ekle (eğer korunacaksa)
      let protectedItems = [];

      if (keepFavorites || keepReadLater) {
        const query = this.supabase
          .from("user_item_interactions")
          .select("item_id")
          .eq("user_id", userId);

        if (keepFavorites && keepReadLater) {
          query.or("is_favorite.eq.true,is_read_later.eq.true");
        } else if (keepFavorites) {
          query.eq("is_favorite", true);
        } else if (keepReadLater) {
          query.eq("is_read_later", true);
        }

        const { data: protectedRecords, error: protectedError } = await query;

        if (protectedError) throw protectedError;
        protectedItems = protectedRecords?.map((item) => item.item_id) || [];
      }

      // 3. Silinecek öğeleri filtrelemek için kullanıcının feed ID'lerini al
      const { data: userFeeds, error: feedsError } = await this.supabase
        .from("feeds")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (feedsError) throw feedsError;

      const userFeedIds = userFeeds?.map((feed) => feed.id) || [];

      if (userFeedIds.length === 0) {
        return { deleted: 0, error: null };
      }

      // 4. Kriterlere göre öğeleri sil:
      // - Belirtilen günden daha eski
      // - Kullanıcının feed'lerine ait
      // - Korunmayacak öğelerde olmayanlar
      let deleteQuery = this.supabase
        .from("feed_items")
        .delete()
        .lt("published_at", cutoffDateStr)
        .in("feed_id", userFeedIds);

      // Korunacak öğe ID'leri varsa, bunları filtrelemeye dahil et
      if (protectedItems.length > 0) {
        deleteQuery = deleteQuery.not(
          "id",
          "in",
          `(${protectedItems.join(",")})`
        );
      }

      const { data, error, count } = await deleteQuery;

      if (error) throw error;

      return {
        deleted: count || 0,
        error: null,
      };
    } catch (error) {
      console.error("Eski öğeleri temizleme hatası:", error);
      return {
        deleted: 0,
        error: error.message || "Bilinmeyen hata",
      };
    }
  }
}

// Singleton instance - Tek bir repository örneği kullanmak için
export const feedRepository = new FeedRepository();

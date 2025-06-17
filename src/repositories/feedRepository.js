"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { formatToPostgresTimestamp } from "@/utils/dateUtils";
import FeedDatabase from "@/lib/db/feed-database";

/**
 * Feed verilerine erişim sağlayan repository sınıfı.
 * Tüm Supabase sorguları bu sınıf üzerinden yapılır.
 */
export class FeedRepository {
  constructor() {
    this.supabase = createClientComponentClient();
    this.db = new FeedDatabase();
  }

  /**
   * Kullanıcının beslemelerini getirir
   * @param {string} userId - Kullanıcı kimliği
   * @param {Date|null} timestamp - Önbellek kontrolü için timestamp
   * @returns {Promise<Array>} - Beslemeler listesi
   */
  async getFeeds(userId) {
    try {
      console.log("[FeedRepository] Fetching feeds for user:", userId);
      if (!userId) {
        console.warn("[FeedRepository] No userId provided");
        return [];
      }

      const { data, error } = await this.supabase
        .from("feeds")
        .select(
          `
          id,
          title,
          url,
          description,
          icon,
          type,
          category_id,
          last_fetched,
          created_at,
          user_id
        `
        )
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      console.log("[FeedRepository] Supabase response:", { data, error });

      if (error) {
        console.error("[FeedRepository] Error fetching feeds:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("[FeedRepository] No feeds found for user");
        return [];
      }

      console.log(`[FeedRepository] Found ${data.length} feeds for user`);
      return data;
    } catch (error) {
      console.error("[FeedRepository] Error in getFeeds:", error);
      throw error;
    }
  }

  /**
   * Verilen feed ID'leri için içerikleri getirir
   * YouTube ve RSS içeriklerini ayrı ayrı getirir ve birleştirir
   * @param {Array} feedIds - Feed ID'lerinin dizisi
   * @param {number} limit - Her feed başına maksimum içerik sayısı
   * @param {string|null} userId - Kullanıcı kimliği (etkileşimler için)
   * @param {Date|null} timestamp - Önbellek kontrolü için timestamp
   * @returns {Promise<Array>} - İçerikler listesi
   */
  async getFeedItems(feedIds, limit = 10, userId = null, timestamp = null) {
    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      console.log("getFeedItems: Boş feed listesi, erken dönüş yapılıyor");
      return [];
    }

    console.log(
      `getFeedItems: ${feedIds.length} feed için içerikler getiriliyor`
    );

    try {
      // Önce feed türlerini belirle
      const { data: feedTypes, error: feedTypeError } = await this.supabase
        .from("feeds")
        .select("id, type")
        .in("id", feedIds);

      if (feedTypeError) {
        console.error("Feed types fetch error:", feedTypeError);
        throw new Error(
          `Feed türleri alınırken hata oluştu: ${feedTypeError.message}`
        );
      }

      // Feed ID'lerini türlerine göre grupla
      const rssFeeds = feedTypes
        .filter((feed) => feed.type === "rss" || feed.type === "atom")
        .map((feed) => feed.id);

      const youtubeFeeds = feedTypes
        .filter((feed) => feed.type === "youtube")
        .map((feed) => feed.id);

      console.log(
        `getFeedItems: ${rssFeeds.length} RSS feed ve ${youtubeFeeds.length} YouTube feed bulundu`
      );
      if (youtubeFeeds.length > 0) {
        console.log("getFeedItems: YouTube feed ID'leri:", youtubeFeeds);
      }

      // RSS ve YouTube içeriklerini ayrı ayrı al
      const [rssItems, youtubeItems] = await Promise.all([
        this.getRssItems(rssFeeds, limit, timestamp),
        this.getYoutubeItems(youtubeFeeds, limit, timestamp),
      ]);

      console.log(
        `getFeedItems: ${rssItems.length} RSS öğesi ve ${youtubeItems.length} YouTube öğesi alındı`
      );

      // İçerikleri birleştir
      let allItems = [
        ...rssItems.map((item) => ({
          ...item,
          itemType: "rss",
        })),
        ...youtubeItems.map((item) => ({
          ...item,
          itemType: "youtube",
        })),
      ];

      console.log(`getFeedItems: Toplam ${allItems.length} öğe birleştirildi`);

      // Yayınlanma tarihine göre sırala (en yeni ilk)
      allItems.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);
        return dateB - dateA;
      });

      // Eğer kullanıcı ID'si verilmişse, kullanıcı etkileşimlerini getir
      if (userId && allItems.length > 0) {
        const itemIds = allItems.map((item) => item.id);
        const interactions = await this.getUserInteractions(userId, itemIds);

        console.log(
          `getFeedItems: ${interactions.length} kullanıcı etkileşimi bulundu`
        );

        // İçeriklere etkileşim bilgilerini ekle
        allItems = allItems.map((item) => {
          const interaction = interactions.find((i) => i.item_id === item.id);
          return {
            ...item,
            is_read: interaction ? interaction.is_read : false,
            is_favorite: interaction ? interaction.is_favorite : false,
            is_read_later: interaction ? interaction.is_read_later : false,
            read_progress: interaction ? interaction.read_progress : 0,
            read_at: interaction ? interaction.read_at : null,
          };
        });
      }

      return allItems;
    } catch (error) {
      console.error("getFeedItems error:", error);
      throw new Error(`İçerikler alınırken bir hata oluştu: ${error.message}`);
    }
  }

  /**
   * RSS içeriklerini getirir
   * @param {Array} feedIds - Feed ID'leri dizisi
   * @param {number} limit - Maksimum öğe sayısı
   * @param {string|null} timestamp - Önbellek kontrolü için timestamp
   * @returns {Promise<Array>} - RSS içerikleri
   */
  async getRssItems(feedIds, limit = 10, timestamp = null) {
    if (!feedIds || feedIds.length === 0) {
      console.log("RSS sorgusu: Feed ID listesi boş, erken dönüş yapılıyor");
      return [];
    }

    console.log(
      `RSS sorgusu: ${feedIds.length} feed için RSS içerikleri getiriliyor:`,
      feedIds
    );

    try {
      let query = this.supabase
        .from("rss_items")
        .select(
          `
          id,
          feed_id,
          title,
          url, 
          description,
          thumbnail, 
          content, 
          author,
          published_at,
          guid,
          created_at
        `
        )
        .in("feed_id", feedIds)
        .order("published_at", { ascending: false })
        .limit(limit * feedIds.length);

      if (timestamp) {
        // timestamp milisaniye cinsinden ise, ISO string formatına dönüştür
        if (typeof timestamp === "number" || /^\d+$/.test(timestamp)) {
          const date = new Date(parseInt(timestamp));
          timestamp = date.toISOString();
        }
        query = query.gt("created_at", timestamp);
      }

      console.log("RSS sorgusu: Sorgu oluşturuldu, çalıştırılıyor...");
      const { data, error } = await query;

      if (error) {
        console.error("RSS items fetch error:", error);
        throw new Error(
          `RSS içerikleri yüklenirken hata oluştu: ${error.message}`
        );
      }

      console.log(`RSS sorgusu: ${data?.length || 0} adet RSS içeriği bulundu`);
      if (data && data.length > 0) {
        console.log("RSS sorgusu: İlk içerik örneği:", {
          id: data[0].id,
          title: data[0].title,
          guid: data[0].guid,
          feed_id: data[0].feed_id,
        });
      } else {
        console.log("RSS sorgusu: İçerik bulunamadı");
      }

      return data || [];
    } catch (error) {
      console.error("getRssItems error:", error);
      throw new Error(
        `RSS içeriklerini getirirken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * YouTube içeriklerini getirir
   * @param {Array} feedIds - YouTube beslemesi ID'leri
   * @param {number} limit - Maksimum içerik sayısı
   * @param {Date|null} timestamp - Önbellek kontrolü için zaman damgası
   * @returns {Promise<Array>} - YouTube içerikleri
   */
  async getYoutubeItems(feedIds, limit = 10, timestamp = null) {
    if (!feedIds || feedIds.length === 0) {
      console.log(
        "YouTube sorgusu: Feed ID listesi boş, erken dönüş yapılıyor"
      );
      return [];
    }

    console.log(
      `YouTube sorgusu: ${feedIds.length} feed için YouTube içerikleri getiriliyor:`,
      feedIds
    );

    try {
      let query = this.supabase
        .from("youtube_items")
        .select(
          `
          id,
          feed_id,
          video_id,
          title,
          url,
          description,
          thumbnail,
          channel_title,
          published_at,
          created_at
        `
        )
        .in("feed_id", feedIds)
        .order("published_at", { ascending: false })
        .limit(limit * feedIds.length);

      if (timestamp) {
        // timestamp milisaniye cinsinden ise, ISO string formatına dönüştür
        if (typeof timestamp === "number" || /^\d+$/.test(timestamp)) {
          const date = new Date(parseInt(timestamp));
          timestamp = date.toISOString();
        }
        query = query.gt("created_at", timestamp);
      }

      console.log("YouTube sorgusu: Sorgu oluşturuldu, çalıştırılıyor...");
      const { data, error } = await query;

      if (error) {
        console.error("YouTube sorgusu: Veri çekme hatası:", error);
        throw new Error(
          `YouTube içerikleri yüklenirken hata oluştu: ${error.message}`
        );
      }

      console.log(
        `YouTube sorgusu: ${data?.length || 0} adet YouTube içeriği bulundu`
      );
      if (data && data.length > 0) {
        console.log("YouTube sorgusu: İlk içerik örneği:", {
          id: data[0].id,
          title: data[0].title,
          video_id: data[0].video_id,
          feed_id: data[0].feed_id,
        });
      } else {
        console.log("YouTube sorgusu: İçerik bulunamadı");
      }

      return data || [];
    } catch (error) {
      console.error("getYoutubeItems error:", error);
      throw new Error(
        `YouTube içeriklerini getirirken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * Favori içerikleri getirir
   * @param {string} userId - Kullanıcı kimliği
   * @param {Date|null} timestamp - Önbellek kontrolü için timestamp
   * @returns {Promise<Array>} - Favori içerikler listesi
   */
  async getFavoriteItems(userId, timestamp = null) {
    if (!userId) {
      throw new Error("Kullanıcı ID'si gerekli");
    }

    try {
      // Favori işaretlenen içerik ID'lerini al
      const { data: interactions, error: interactionError } =
        await this.supabase
          .from("user_interactions")
          .select("item_id, item_type")
          .eq("user_id", userId)
          .eq("is_favorite", true);

      if (interactionError) {
        throw new Error(
          `Favori etkileşimleri alınırken hata: ${interactionError.message}`
        );
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // RSS ve YouTube içerik ID'lerini ayır
      const rssItemIds = interactions
        .filter((int) => int.item_type === "rss")
        .map((int) => int.item_id);

      const youtubeItemIds = interactions
        .filter((int) => int.item_type === "youtube")
        .map((int) => int.item_id);

      // RSS ve YouTube içeriklerini ayrı ayrı al
      const [rssItems, youtubeItems] = await Promise.all([
        this.getRssItemsById(rssItemIds),
        this.getYoutubeItemsById(youtubeItemIds),
      ]);

      // Tüm favori içerikleri birleştir
      let favoriteItems = [
        ...rssItems.map((item) => ({
          ...item,
          itemType: "rss",
          is_favorite: true,
        })),
        ...youtubeItems.map((item) => ({
          ...item,
          itemType: "youtube",
          is_favorite: true,
        })),
      ];

      // Yayınlanma tarihine göre sırala
      favoriteItems.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);
        return dateB - dateA;
      });

      return favoriteItems;
    } catch (error) {
      console.error("getFavoriteItems error:", error);
      throw new Error(
        `Favori içerikleri alırken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * Daha sonra okunacak içerikleri getirir
   * @param {string} userId - Kullanıcı kimliği
   * @param {Date|null} timestamp - Önbellek kontrolü için timestamp
   * @returns {Promise<Array>} - Daha sonra okunacak içerikler listesi
   */
  async getReadLaterItems(userId, timestamp = null) {
    if (!userId) {
      throw new Error("Kullanıcı ID'si gerekli");
    }

    try {
      // Daha sonra oku işaretlenen içerik ID'lerini al
      const { data: interactions, error: interactionError } =
        await this.supabase
          .from("user_interactions")
          .select("item_id, item_type")
          .eq("user_id", userId)
          .eq("is_read_later", true);

      if (interactionError) {
        throw new Error(
          `Daha sonra oku etkileşimleri alınırken hata: ${interactionError.message}`
        );
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // RSS ve YouTube içerik ID'lerini ayır
      const rssItemIds = interactions
        .filter((int) => int.item_type === "rss")
        .map((int) => int.item_id);

      const youtubeItemIds = interactions
        .filter((int) => int.item_type === "youtube")
        .map((int) => int.item_id);

      // RSS ve YouTube içeriklerini ayrı ayrı al
      const [rssItems, youtubeItems] = await Promise.all([
        this.getRssItemsById(rssItemIds),
        this.getYoutubeItemsById(youtubeItemIds),
      ]);

      // Tüm daha sonra oku içeriklerini birleştir
      let readLaterItems = [
        ...rssItems.map((item) => ({
          ...item,
          itemType: "rss",
          is_read_later: true,
        })),
        ...youtubeItems.map((item) => ({
          ...item,
          itemType: "youtube",
          is_read_later: true,
        })),
      ];

      // Yayınlanma tarihine göre sırala
      readLaterItems.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);
        return dateB - dateA;
      });

      return readLaterItems;
    } catch (error) {
      console.error("getReadLaterItems error:", error);
      throw new Error(
        `Daha sonra okunacak içerikleri alırken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * ID'ye göre RSS içeriklerini getirir
   * @param {Array} itemIds - İçerik ID'leri dizisi
   * @returns {Promise<Array>} - RSS içerikleri
   */
  async getRssItemsById(itemIds) {
    if (!itemIds || itemIds.length === 0) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from("rss_items")
        .select(
          `
          id, 
          feed_id, 
            title,
          url, 
          description, 
          thumbnail, 
          content, 
          author,
          published_at,
          guid,
          created_at
        `
        )
        .in("id", itemIds);

      if (error) {
        console.error("RSS items by ID fetch error:", error);
        throw new Error(
          `RSS içerikleri yüklenirken hata oluştu: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error("getRssItemsById error:", error);
      throw new Error(
        `RSS içeriklerini ID'ye göre getirirken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * ID'ye göre YouTube içeriklerini getirir
   * @param {Array} itemIds - İçerik ID'leri dizisi
   * @returns {Promise<Array>} - YouTube içerikleri
   */
  async getYoutubeItemsById(itemIds) {
    if (!itemIds || itemIds.length === 0) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from("youtube_items")
        .select(
          `
          id, 
          feed_id, 
          video_id,
          title, 
          url, 
          description, 
          thumbnail,
          channel_title,
          published_at,
          created_at
        `
        )
        .in("id", itemIds);

      if (error) {
        console.error("YouTube items by ID fetch error:", error);
        throw new Error(
          `YouTube içerikleri yüklenirken hata oluştu: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error("getYoutubeItemsById error:", error);
      throw new Error(
        `YouTube içeriklerini ID'ye göre getirirken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * Kullanıcı-içerik etkileşimlerini günceller
   * @param {string} userId - Kullanıcı kimliği
   * @param {string} itemId - İçerik kimliği
   * @param {string} itemType - İçerik tipi (rss veya youtube)
   * @param {Object} updates - Güncellenecek alanlar
   * @returns {Promise<Object>} - Güncellenmiş etkileşim
   */
  async updateItemInteraction(userId, itemId, itemType, updates) {
    if (!userId || !itemId || !itemType) {
      throw new Error("Kullanıcı ID'si, içerik ID'si ve içerik tipi gerekli");
    }

    try {
      // Önce mevcut etkileşimi kontrol et
      const { data: existing, error: fetchError } = await this.supabase
        .from("user_interactions")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116: Sonuç bulunamadı hatasını kabul ediyoruz (yeni oluşturmak için)
        console.error("Interaction fetch error:", fetchError);
        throw new Error(
          `Etkileşim kontrolü sırasında hata: ${fetchError.message}`
        );
      }

      let result;

      if (!existing) {
        // Etkileşim yoksa yeni oluştur
        const { data, error } = await this.supabase
          .from("user_interactions")
          .insert({
            user_id: userId,
            item_id: itemId,
            item_type: itemType,
            ...updates,
          })
          .select()
          .single();

        if (error) {
          console.error("Interaction insert error:", error);
          throw new Error(`Etkileşim oluşturulurken hata: ${error.message}`);
        }

        result = data;
      } else {
        // Etkileşim varsa güncelle
        const { data, error } = await this.supabase
          .from("user_interactions")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          console.error("Interaction update error:", error);
          throw new Error(`Etkileşim güncellenirken hata: ${error.message}`);
        }

        result = data;
      }

      return result;
    } catch (error) {
      console.error("updateItemInteraction error:", error);
      throw new Error(
        `İçerik etkileşimi güncellenirken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * Kullanıcı etkileşimlerini getirir
   * @param {string} userId - Kullanıcı kimliği
   * @param {Array} itemIds - İçerik ID'leri
   * @returns {Promise<Array>} - Etkileşimler listesi
   */
  async getUserInteractions(userId, itemIds) {
    if (!userId || !itemIds || itemIds.length === 0) {
      console.log(
        "getUserInteractions: Geçersiz parametreler, boş dizi döndürülüyor"
      );
      return [];
    }

    try {
      console.log(
        `getUserInteractions: Kullanıcı ${userId} için ${itemIds.length} öğenin etkileşimleri getiriliyor`
      );

      const { data, error } = await this.supabase
        .from("user_interactions")
        .select("*")
        .eq("user_id", userId)
        .in("item_id", itemIds);

      if (error) {
        console.error("getUserInteractions error:", error);
        return [];
      }

      console.log(
        `getUserInteractions: ${data?.length || 0} etkileşim bulundu`
      );
      return data || [];
    } catch (error) {
      console.error("getUserInteractions error:", error);
      return [];
    }
  }

  /**
   * Yeni feed ekler
   * @param {Object} feedData - Feed verisi
   * @returns {Promise<Object>} - Eklenen feed
   */
  async addFeed(feedData) {
    if (!feedData || !feedData.url || !feedData.type || !feedData.user_id) {
      throw new Error("Feed URL, type ve user_id gerekli");
    }

    try {
      // Feed zaten var mı kontrol et
      const { data: existingFeed, error: checkError } = await this.supabase
        .from("feeds")
        .select("id, title")
        .eq("url", feedData.url)
        .eq("user_id", feedData.user_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (checkError) {
        console.error("Feed check error:", checkError);
        throw new Error(`Feed kontrolü sırasında hata: ${checkError.message}`);
      }

      // Feed zaten varsa, mevcut feed'i döndür
      if (existingFeed) {
        return {
          feed: existingFeed,
          isNew: false,
          message: "Bu feed zaten eklenmiş",
        };
      }

      // Title kontrolü iyileştirildi
      // Başlık yoksa, boşsa veya sadece boşluk karakterlerinden oluşuyorsa URL'yi kullan
      if (!feedData.title || feedData.title.trim() === "") {
        console.log("Feed başlığı bulunamadı, URL kullanılıyor:", feedData.url);
        feedData.title = feedData.url;
      }

      // Feed'i ekle
      const { data: newFeed, error: insertError } = await this.supabase
        .from("feeds")
        .insert({
          title: feedData.title.trim(), // Başlıktaki boşlukları temizle
          url: feedData.url,
          description: feedData.description || "",
          icon: feedData.icon || null,
          type: feedData.type,
          user_id: feedData.user_id,
          category_id: feedData.category_id || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Feed insert error:", insertError);
        // Daha açıklayıcı hata mesajı
        if (insertError.code === "23502") {
          throw new Error(
            `Zorunlu bir alan eksik: ${
              insertError.details || insertError.message
            }`
          );
        } else {
          throw new Error(`Feed eklenirken hata: ${insertError.message}`);
        }
      }

      return {
        feed: newFeed,
        isNew: true,
      };
    } catch (error) {
      console.error("addFeed error:", error);
      throw new Error(`Feed eklenirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Feed'i siler (soft delete)
   * @param {string} feedId - Feed kimliği
   * @param {string} userId - Kullanıcı kimliği
   * @returns {Promise<Object>} - Silme sonucu
   */
  async deleteFeed(feedId, userId) {
    if (!feedId) {
      throw new Error("Feed ID'si gerekli");
    }

    if (!userId) {
      throw new Error("Kullanıcı ID'si gerekli");
    }

    try {
      const { data, error } = await this.supabase
        .from("feeds")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", feedId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Feed delete error:", error);
        throw new Error(`Feed silinirken hata: ${error.message}`);
      }

      return {
        success: true,
        message: "Feed başarıyla silindi",
        feed: data,
      };
    } catch (error) {
      console.error("deleteFeed error:", error);
      throw new Error(`Feed silinirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Eski içerikleri temizler
   * @param {string} userId - Kullanıcı kimliği
   * @param {number} olderThanDays - Gün sayısı
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
    if (!userId) {
      throw new Error("Kullanıcı ID'si gerekli");
    }

    try {
      // Kullanıcının feed'lerini al
      const { data: feeds, error: feedError } = await this.supabase
        .from("feeds")
        .select("id, type")
        .eq("user_id", userId)
        .is("deleted_at", null);

      if (feedError) {
        console.error("Feeds fetch error:", feedError);
        throw new Error(`Feed'ler alınırken hata: ${feedError.message}`);
      }

      if (!feeds || feeds.length === 0) {
        return {
          success: true,
          message: "Temizlenecek feed bulunamadı",
          rssItemsRemoved: 0,
          youtubeItemsRemoved: 0,
        };
      }

      // Feed ID'lerini türlerine göre ayır
      const rssFeeds = feeds
        .filter((feed) => feed.type === "rss" || feed.type === "atom")
        .map((feed) => feed.id);

      const youtubeFeeds = feeds
        .filter((feed) => feed.type === "youtube")
        .map((feed) => feed.id);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffString = cutoffDate.toISOString();

      // Korunacak içerik ID'lerini belirle
      let protectedItemIds = [];

      if (keepFavorites || keepReadLater) {
        let query = this.supabase
          .from("user_interactions")
          .select("item_id")
          .eq("user_id", userId);

        if (keepFavorites && keepReadLater) {
          query = query.or("is_favorite.eq.true,is_read_later.eq.true");
        } else if (keepFavorites) {
          query = query.eq("is_favorite", true);
        } else if (keepReadLater) {
          query = query.eq("is_read_later", true);
        }

        const { data: protectedItems, error: protectedError } = await query;

        if (protectedError) {
          console.error("Protected items error:", protectedError);
          throw new Error(
            `Korunacak içerikler alınırken hata: ${protectedError.message}`
          );
        }

        protectedItemIds = protectedItems
          ? protectedItems.map((item) => item.item_id)
          : [];
      }

      // RSS içeriklerini temizle
      let rssItemsRemoved = 0;
      if (rssFeeds.length > 0) {
        let rssQuery = this.supabase
          .from("rss_items")
          .delete()
          .in("feed_id", rssFeeds)
          .lt("published_at", cutoffString);

        if (protectedItemIds.length > 0) {
          rssQuery = rssQuery.not(
            "id",
            "in",
            `(${protectedItemIds.join(",")})`
          );
        }

        const { data: deletedRssItems, error: rssDeleteError } = await rssQuery;

        if (rssDeleteError) {
          console.error("RSS items cleanup error:", rssDeleteError);
          throw new Error(
            `RSS içerikleri temizlenirken hata: ${rssDeleteError.message}`
          );
        }

        rssItemsRemoved = deletedRssItems ? deletedRssItems.length : 0;
      }

      // YouTube içeriklerini temizle
      let youtubeItemsRemoved = 0;
      if (youtubeFeeds.length > 0) {
        let youtubeQuery = this.supabase
          .from("youtube_items")
          .delete()
          .in("feed_id", youtubeFeeds)
          .lt("published_at", cutoffString);

        if (protectedItemIds.length > 0) {
          youtubeQuery = youtubeQuery.not(
            "id",
            "in",
            `(${protectedItemIds.join(",")})`
          );
        }

        const { data: deletedYoutubeItems, error: youtubeDeleteError } =
          await youtubeQuery;

        if (youtubeDeleteError) {
          console.error("YouTube items cleanup error:", youtubeDeleteError);
          throw new Error(
            `YouTube içerikleri temizlenirken hata: ${youtubeDeleteError.message}`
          );
        }

        youtubeItemsRemoved = deletedYoutubeItems
          ? deletedYoutubeItems.length
          : 0;
      }

      return {
        success: true,
        message: `${olderThanDays} günden eski içerikler temizlendi`,
        rssItemsRemoved,
        youtubeItemsRemoved,
        totalItemsRemoved: rssItemsRemoved + youtubeItemsRemoved,
      };
    } catch (error) {
      console.error("cleanUpOldItems error:", error);
      throw new Error(
        `Eski içerikler temizlenirken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * Sayfalandırılmış feed içeriklerini getirir
   * @param {Array} feedIds - Feed ID'leri
   * @param {number} page - Sayfa numarası
   * @param {number} pageSize - Sayfa başına içerik sayısı
   * @param {Object} filters - Filtreler
   * @param {Date|null} timestamp - Önbellek kontrolü için timestamp
   * @returns {Promise<Object>} - Sayfalandırılmış içerikler ve metadatalar
   */
  async getPaginatedFeedItems(
    feedIds,
    page = 1,
    pageSize = 12,
    filters = {},
    timestamp = null
  ) {
    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      console.log(
        "getPaginatedFeedItems: Boş feed listesi, erken dönüş yapılıyor"
      );
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    console.log(
      `getPaginatedFeedItems: ${feedIds.length} feed için sayfalandırılmış içerikler getiriliyor`,
      feedIds
    );

    try {
      // Önce feed türlerini belirle
      const { data: feedTypes, error: feedTypeError } = await this.supabase
        .from("feeds")
        .select("id, type")
        .in("id", feedIds);

      if (feedTypeError) {
        console.error("Feed types fetch error:", feedTypeError);
        throw new Error(
          `Feed türleri alınırken hata oluştu: ${feedTypeError.message}`
        );
      }

      // Feed ID'lerini türlerine göre grupla
      const rssFeeds = feedTypes
        .filter((feed) => feed.type === "rss" || feed.type === "atom")
        .map((feed) => feed.id);

      const youtubeFeeds = feedTypes
        .filter((feed) => feed.type === "youtube")
        .map((feed) => feed.id);

      console.log(
        `getPaginatedFeedItems: ${rssFeeds.length} RSS feed ve ${youtubeFeeds.length} YouTube feed bulundu`
      );
      if (youtubeFeeds.length > 0) {
        console.log(
          "getPaginatedFeedItems: YouTube feed ID'leri:",
          youtubeFeeds
        );
      }

      const offset = (page - 1) * pageSize;
      const limit = pageSize;

      // RSS ve YouTube sorguları oluştur
      let rssQuery = this.supabase.from("rss_items").select(
        `
          id,
          feed_id,
          title,
          url, 
          description,
          thumbnail, 
          content, 
          author,
          published_at,
          guid,
          created_at
        `,
        { count: "exact" }
      );

      let youtubeQuery = this.supabase.from("youtube_items").select(
        `
          id,
          feed_id,
          video_id,
          title,
          url,
          description,
          thumbnail,
          channel_title,
          published_at,
          created_at
        `,
        { count: "exact" }
      );

      // Feed ID filtresi
      if (rssFeeds.length > 0) {
        rssQuery = rssQuery.in("feed_id", rssFeeds);
      } else {
        // Hiç RSS feed yoksa boş sonuç döndür
        rssQuery = null;
      }

      if (youtubeFeeds.length > 0) {
        youtubeQuery = youtubeQuery.in("feed_id", youtubeFeeds);
      } else {
        // Hiç YouTube feed yoksa boş sonuç döndür
        youtubeQuery = null;
      }

      // Her iki sorgu için filtreleri uygula
      // Bu ornekte filtrelerin kısaca nasıl uygulanabileceğini gösteriyorum
      if (filters.search && (rssQuery || youtubeQuery)) {
        const searchTerm = `%${filters.search}%`;
        if (rssQuery) {
          rssQuery = rssQuery.or(
            `title.ilike.${searchTerm},description.ilike.${searchTerm}`
          );
        }
        if (youtubeQuery) {
          youtubeQuery = youtubeQuery.or(
            `title.ilike.${searchTerm},description.ilike.${searchTerm}`
          );
        }
      }

      console.log(
        "getPaginatedFeedItems: Sorgular hazırlandı, çalıştırılıyor..."
      );

      // Sorguları çalıştır
      const [rssResult, youtubeResult] = await Promise.all([
        rssQuery
          ? rssQuery
              .order("published_at", { ascending: false })
              .range(offset, offset + limit - 1)
          : { data: [], count: 0 },
        youtubeQuery
          ? youtubeQuery
              .order("published_at", { ascending: false })
              .range(offset, offset + limit - 1)
          : { data: [], count: 0 },
      ]);

      // Hata kontrolü
      if (rssResult.error) {
        console.error("RSS items pagination error:", rssResult.error);
        throw new Error(
          `RSS içerikleri alınırken hata oluştu: ${rssResult.error.message}`
        );
      }

      if (youtubeResult.error) {
        console.error("YouTube items pagination error:", youtubeResult.error);
        throw new Error(
          `YouTube içerikleri alınırken hata oluştu: ${youtubeResult.error.message}`
        );
      }

      console.log(
        `getPaginatedFeedItems: ${rssResult.data?.length || 0} RSS öğesi ve ${
          youtubeResult.data?.length || 0
        } YouTube öğesi alındı`
      );

      // Toplam içerik sayısını hesapla
      const totalItems = (rssResult.count || 0) + (youtubeResult.count || 0);

      // Tüm içerikleri birleştir
      let allItems = [
        ...(rssResult.data || []).map((item) => ({
          ...item,
          itemType: "rss",
        })),
        ...(youtubeResult.data || []).map((item) => ({
          ...item,
          itemType: "youtube",
        })),
      ];

      console.log(
        `getPaginatedFeedItems: Toplam ${
          allItems.length
        } öğe birleştirildi. RSS: ${rssResult.data?.length || 0}, YouTube: ${
          youtubeResult.data?.length || 0
        }`
      );

      // Yayınlanma tarihine göre sırala
      allItems.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);
        return dateB - dateA;
      });

      // Sayfalama hesaplamaları
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasMore = page < totalPages;

      return {
        data: allItems,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasMore,
        },
      };
    } catch (error) {
      console.error("getPaginatedFeedItems error:", error);
      throw new Error(
        `Sayfalandırılmış içerikler alınırken hata oluştu: ${error.message}`
      );
    }
  }

  /**
   * Yeni bir RSS öğesi ekler
   * @param {Object} rssItem - Eklenecek RSS öğesi
   * @returns {Promise<Object>} - Eklenen öğe
   */
  async addRssItem(rssItem) {
    try {
      console.log("addRssItem çağrıldı:", {
        feedId: rssItem?.feed_id,
        title: rssItem?.title,
        guid: rssItem?.guid,
      });

      if (!rssItem || !rssItem.feed_id) {
        throw new Error("RSS öğesi ve feed ID'si gerekli");
      }

      // Timestamp'i düzelt
      const pubDate = formatToPostgresTimestamp(rssItem.pub_date);
      console.log("Tarih formatlanıyor:", {
        orijinal: rssItem.pub_date,
        formatlanmış: pubDate,
      });

      if (!pubDate) {
        console.warn(
          "Geçersiz yayın tarihi, şu anki zaman kullanılıyor:",
          rssItem.pub_date
        );
        // Geçersiz tarih durumunda şu anki zamanı kullan
        rssItem.pub_date = formatToPostgresTimestamp(new Date());
      } else {
        rssItem.pub_date = pubDate;
      }

      // published_at alanını pub_date ile doldur
      rssItem.published_at = rssItem.pub_date;

      console.log("Veritabanında öğe var mı kontrol ediliyor:", {
        feed_id: rssItem.feed_id,
        guid: rssItem.guid,
      });

      // Önce öğenin veritabanında olup olmadığını kontrol et
      try {
        const { data, error } = await this.supabase
          .from("rss_items")
          .select("id")
          .eq("feed_id", rssItem.feed_id)
          .eq("guid", rssItem.guid)
          .maybeSingle();

        console.log("Öğe sorgu sonucu:", { data, error });

        // Eğer öğe zaten varsa güncelle
        if (data && data.id) {
          console.log(`Mevcut RSS öğesi güncelleniyor, ID: ${data.id}`);

          const { data: updateData, error: updateError } = await this.supabase
            .from("rss_items")
            .update({
              title: rssItem.title,
              description: rssItem.description,
              content: rssItem.content,
              link: rssItem.link,
              author: rssItem.author,
              thumbnail: rssItem.thumbnail,
              published_at: rssItem.published_at,
              updated_at: formatToPostgresTimestamp(new Date()),
            })
            .eq("id", data.id)
            .select();

          if (updateError) {
            console.error("RSS öğesi güncelleme hatası:", updateError);
            throw updateError;
          }

          console.log("RSS öğesi güncellendi:", updateData);
          return updateData;
        }

        // Yeni öğe ekle
        console.log("Yeni RSS öğesi ekleniyor:", {
          feed_id: rssItem.feed_id,
          title: rssItem.title,
          guid: rssItem.guid,
        });

        const insertData = {
          feed_id: rssItem.feed_id,
          title: rssItem.title || "Başlıksız",
          description: rssItem.description || "",
          content: rssItem.content || "",
          link: rssItem.link || "",
          author: rssItem.author || "",
          thumbnail: rssItem.thumbnail || "",
          published_at: rssItem.published_at,
          guid: rssItem.guid,
          created_at: formatToPostgresTimestamp(new Date()),
          updated_at: formatToPostgresTimestamp(new Date()),
        };

        const { data: inserted, error: insertError } = await this.supabase
          .from("rss_items")
          .insert(insertData)
          .select();

        if (insertError) {
          console.error("RSS öğesi ekleme hatası:", insertError);
          throw insertError;
        }

        console.log("RSS öğesi başarıyla eklendi:", inserted);
        return inserted;
      } catch (dbError) {
        console.error("Veritabanı işlemi sırasında hata:", dbError);
        throw dbError;
      }
    } catch (error) {
      console.error("RSS öğesi eklenirken hata:", error);
      throw error;
    }
  }

  /**
   * YouTube içeriği ekler
   * @param {Object} youtubeItem - YouTube öğesi
   * @returns {Promise<Object>} - Eklenen YouTube öğesi
   */
  async addYoutubeItem(youtubeItem) {
    try {
      if (!youtubeItem) {
        console.error("addYoutubeItem: Geçersiz YouTube öğesi");
        throw new Error("Geçersiz YouTube öğesi");
      }

      if (!youtubeItem.feed_id || !youtubeItem.video_id) {
        console.error(
          "addYoutubeItem: feed_id veya video_id eksik",
          youtubeItem
        );
        throw new Error("YouTube öğesi eklemek için gerekli alanlar eksik");
      }

      // Eğer aynı video_id ve feed_id ile kayıt varsa, ekleme yapma
      let existingItem = null;
      try {
        const { data: existing } = await this.supabase
          .from("youtube_items")
          .select("id")
          .eq("video_id", youtubeItem.video_id)
          .eq("feed_id", youtubeItem.feed_id)
          .maybeSingle();

        existingItem = existing;
      } catch (checkError) {
        console.error(
          "addYoutubeItem: Mevcut öğe kontrolü sırasında hata",
          checkError
        );
        // Kontrol hatasını yok say, eklemeye devam et
      }

      if (existingItem && existingItem.id) {
        console.log(
          `addYoutubeItem: ${youtubeItem.video_id} ID'li video zaten mevcut, atlanıyor`
        );
        return existingItem;
      }

      console.log(`addYoutubeItem: Yeni YouTube öğesi ekleniyor`, {
        video_id: youtubeItem.video_id,
        title: youtubeItem.title?.substring(0, 30),
        feed_id: youtubeItem.feed_id,
      });

      // Eksik alanları kontrol et ve varsayılan değerler ata
      const defaultDate = new Date().toISOString();
      const itemToInsert = {
        feed_id: youtubeItem.feed_id,
        video_id: youtubeItem.video_id,
        title: youtubeItem.title || "Başlık Yok",
        description: youtubeItem.description || "",
        url:
          youtubeItem.url ||
          `https://youtube.com/watch?v=${youtubeItem.video_id}`,
        thumbnail: youtubeItem.thumbnail || null,
        channel_title: youtubeItem.channel_title || null,
        published_at: youtubeItem.published_at || defaultDate,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("youtube_items")
        .insert(itemToInsert)
        .select();

      if (error) {
        console.error("addYoutubeItem: Veri ekleme hatası", error);
        throw new Error(
          `YouTube öğesi eklenirken hata oluştu: ${error.message}`
        );
      }

      console.log(
        `addYoutubeItem: YouTube öğesi başarıyla eklendi, ID: ${data?.[0]?.id}`
      );
      return data?.[0] || null;
    } catch (error) {
      console.error("addYoutubeItem error:", error);
      throw new Error(`YouTube öğesi eklerken hata: ${error.message}`);
    }
  }

  /**
   * Feed'in son güncelleme zamanını kontrol eder ve feed URL bilgisini döndürür
   * @param {string} feedId - Feed kimliği
   * @param {string} userId - Kullanıcı kimliği
   * @param {Object} options - İşlem opsiyonları
   * @param {boolean} options.skipCache - Önbelleği atlayıp doğrudan güncelleme yapılsın mı
   * @returns {Promise<Object>} - Feed bilgileri ve durumu
   */
  async syncFeedItems(feedId, userId, options = {}) {
    const { skipCache = false } = options;

    try {
      if (!feedId) {
        throw new Error("Feed ID is required");
      }

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Feed'in kimlik bilgilerini çek
      const { data: feedData, error: feedError } = await this.supabase
        .from("feeds")
        .select("*")
        .eq("id", feedId)
        .eq("user_id", userId)
        .single();

      if (feedError) {
        console.error("Failed to get feed data:", feedError);
        return {
          success: false,
          error: `Failed to get feed data: ${feedError.message}`,
        };
      }

      if (!feedData) {
        return {
          success: false,
          error: "Feed not found",
        };
      }

      // Eğer son güncelleme kontrolü yapılacaksa ve skipCache false ise
      if (!skipCache && feedData.last_fetched) {
        const lastFetched = new Date(feedData.last_fetched);
        const now = new Date();
        const diffInMinutes = (now - lastFetched) / (1000 * 60);

        // Son 1 dakika içinde güncellenmiş ise tekrar güncelleme yapma
        if (diffInMinutes < 1) {
          return {
            success: true,
            message: `Feed was already updated ${diffInMinutes.toFixed(
              2
            )} minutes ago`,
            feedData,
            feedUrl: feedData.url,
            feedType: feedData.type,
          };
        }
      }

      return {
        success: true,
        feedData,
        feedUrl: feedData.url,
        feedType: feedData.type,
      };
    } catch (error) {
      console.error("Error in syncFeedItems:", error);
      return {
        success: false,
        error: error.message || "Failed to get feed data",
      };
    }
  }

  /**
   * Feed'in son güncelleme zamanını günceller
   * @param {string} feedId - Feed kimliği
   * @returns {Promise<boolean>} - İşlem başarısı
   */
  async updateFeedLastUpdated(feedId) {
    try {
      if (!feedId) {
        throw new Error("Feed ID is required");
      }

      const { error } = await this.supabase
        .from("feeds")
        .update({
          last_fetched: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedId);

      if (error) {
        console.error("Error updating feed:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating feed last updated timestamp:", error);
      return false;
    }
  }

  /**
   * Feed türünü döndürür
   * @param {string} feedId - Feed kimliği
   * @returns {Promise<Object|null>} - Feed türü bilgisi
   */
  async getFeedType(feedId) {
    try {
      if (!feedId) {
        throw new Error("Feed ID is required");
      }

      const { data, error } = await this.supabase
        .from("feeds")
        .select("type")
        .eq("id", feedId)
        .single();

      if (error) {
        console.error("Error getting feed type:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error retrieving feed type:", error);
      return null;
    }
  }
}

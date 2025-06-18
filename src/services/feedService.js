"use client";

import { FeedRepository } from "@/lib/db/feedRepository";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FeedParser } from "@/utils/feedParser";
import { parseURL } from "@/utils/feedParser";
import { toUTCTimestamp } from "@/utils/dateUtils";

/**
 * Feed işlemlerini yöneten servis katmanı.
 * Bu katman repository ile UI arasında aracılık yapar ve iş mantığını içerir.
 */
export class FeedService {
  constructor() {
    this.feedRepository = new FeedRepository();
    this.feedParser = new FeedParser();
    this.supabase = createClientComponentClient();
  }

  /**
   * Kullanıcı oturumunu alır
   * @returns {Promise<Object|null>} Kullanıcı oturumu
   * @private
   */
  async _getSession() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * URL'yi temizler ve normalize eder
   * @param {string} url - Normalize edilecek URL
   * @returns {string} Normalize edilmiş URL
   */
  normalizeUrl(url) {
    try {
      if (!url) return "";

      // URL'yi temizle
      let normalizedUrl = url.trim();

      // URL protokolü yoksa ekle
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      // URL objesine dönüştürerek standartlaştır
      const urlObj = new URL(normalizedUrl);

      // Sondaki eğik çizgi varsa kaldır (isteğe bağlı)
      let finalUrl = urlObj.toString();
      if (finalUrl.endsWith("/") && !urlObj.pathname.endsWith("//")) {
        finalUrl = finalUrl.slice(0, -1);
      }

      return finalUrl;
    } catch (error) {
      console.warn("URL normalleştirme hatası:", error);
      // Hata olursa orjinal URL'yi döndür
      return url;
    }
  }

  /**
   * Kullanıcının feedlerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Kullanıcının feedleri
   */
  async getFeeds(userId) {
    try {
      console.log("[FeedService] Fetching feeds for user:", userId);
      if (!userId) {
        console.warn("[FeedService] No userId provided");
        return [];
      }

      const feeds = await this.feedRepository.getFeeds(userId);
      console.log("[FeedService] Repository response:", feeds);

      if (!feeds || feeds.length === 0) {
        console.log("[FeedService] No feeds found for user");
        return [];
      }

      console.log(`[FeedService] Found ${feeds.length} feeds for user`);
      return feeds;
    } catch (error) {
      console.error("[FeedService] Error in getFeeds:", error);
      throw error;
    }
  }

  /**
   * Feed içeriklerini getirir
   * @param {Array} feedIds Feed ID'leri
   * @param {number} limit Kayıt limiti
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Feed öğeleri
   */
  async getFeedItems(feedIds, limit = 10, userId = null) {
    try {
      if (!feedIds || feedIds.length === 0) return [];

      return await this.feedRepository.getFeedItems(feedIds, limit, userId);
    } catch (error) {
      console.error("Error fetching feed items:", error);
      toast.error("An error occurred while loading feed content.");
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
      if (!userId) {
        console.warn("getFavorites called without userId");
        return [];
      }

      return await this.feedRepository.getFavoriteItems(userId);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("An error occurred while loading favorites.");
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
      if (!userId) {
        console.warn("getReadLaterItems called without userId");
        return [];
      }

      return await this.feedRepository.getReadLaterItems(userId);
    } catch (error) {
      console.error("Error fetching read later list:", error);
      toast.error("An error occurred while loading read later list.");
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
      if (!userId) throw new Error("User ID is required");
      if (!itemId) throw new Error("Item ID is required");

      const updates = {
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      };

      return await this.feedRepository.updateItemInteraction(
        userId,
        itemId,
        "rss",
        updates
      );
    } catch (error) {
      console.error("Error updating read status:", error);
      toast.error("An error occurred while updating read status.");
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
      if (!userId) throw new Error("User ID is required");
      if (!itemId) throw new Error("Item ID is required");

      return await this.feedRepository.updateItemInteraction(
        userId,
        itemId,
        "rss",
        {
          is_favorite: isFavorite,
        }
      );
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("An error occurred while updating favorite status.");
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
      if (!userId) throw new Error("User ID is required");
      if (!itemId) throw new Error("Item ID is required");

      return await this.feedRepository.updateItemInteraction(
        userId,
        itemId,
        "rss",
        {
          is_read_later: isReadLater,
        }
      );
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error("An error occurred while updating read later status.");
      throw error;
    }
  }

  /**
   * Yeni besleme ekler
   * @param {string} url Besleme URL'si
   * @param {string} type Besleme türü ('rss', 'atom' veya 'youtube')
   * @param {string} userId Kullanıcı ID'si
   * @param {Object} extraData Ek veriler
   * @returns {Promise<Object>} Eklenen besleme bilgileri
   */
  async addFeed(url, type = "rss", userId, extraData = {}) {
    try {
      // URL ve kullanıcı ID kontrolü
      if (!url) {
        throw new Error("Feed URL is required");
      }

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Feed türü kontrolü
      if (!type || !["rss", "atom", "youtube"].includes(type)) {
        throw new Error("Valid feed type is required (rss, atom, youtube)");
      }

      // URL normalizasyonu
      const normalizedUrl = this.normalizeUrl(url);

      // YouTube RSS beslemesi kontrolü
      let feedType = type;
      if (normalizedUrl.includes("youtube.com/feeds/videos.xml")) {
        // YouTube RSS'leri için özel durum - URL'de YouTube RSS var ama type olarak "rss" geçilmiş olabilir
        feedType = "youtube";
      }

      // Feed meta verilerini al
      let feedInfo = {};

      if (feedType === "rss" || feedType === "atom") {
        // RSS besleme bilgilerini çek
        try {
          feedInfo = await this.feedParser.parseRssFeed(normalizedUrl);
        } catch (error) {
          console.error("RSS parsing error:", error);
          throw new Error(`Failed to parse RSS feed: ${error.message}`);
        }
      } else if (feedType === "youtube") {
        // YouTube besleme bilgilerini çek
        try {
          feedInfo = await this.feedParser.parseYoutubeFeed(normalizedUrl);
          // YouTube besleme başlığını iyileştir
          if (!extraData.title && feedInfo.title) {
            feedInfo.title = feedInfo.title.replace("YouTube", "").trim();
          }
        } catch (error) {
          console.error("YouTube parsing error:", error);
          throw new Error(`Failed to parse YouTube feed: ${error.message}`);
        }
      } else {
        throw new Error(`Unsupported feed type: ${feedType}`);
      }

      // Feed verisini hazırla
      const feedData = {
        url: normalizedUrl,
        user_id: userId,
        type: feedType,
        title: extraData.title || feedInfo.title || normalizedUrl,
        description: extraData.description || feedInfo.description || "",
        icon: extraData.icon || feedInfo.icon || null,
        category_id: extraData.category_id || null,
      };

      // Feed'i ekle
      const result = await this.feedRepository.addFeed(feedData);

      // Eğer feed yeniyse, içerikleri çek
      if (result && result.feed && result.feed.id) {
        try {
          await this.syncFeedItems(result.feed.id, userId, feedType);
        } catch (syncError) {
          console.error(
            `Error synchronizing feed contents: ${syncError.message}`
          );
          // Bu hata feed ekleme işlemini etkilememeli
        }
      }

      return result;
    } catch (error) {
      console.error("Error adding feed:", error);
      throw new Error(`Error adding feed: ${error.message}`);
    }
  }

  /**
   * Delete a feed (soft delete)
   * @param {string} feedId Feed ID to delete
   * @param {string} userId User ID
   * @returns {Promise<boolean>} Operation result
   */
  async deleteFeed(feedId, userId) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!feedId) throw new Error("Feed ID is required");

      // Soft delete the feed
      const result = await this.feedRepository.deleteFeed(feedId, userId);

      // If successful, perform any additional cleanup if needed
      if (result) {
        // Additional operations can be performed here

        // Log successful deletion
        console.log(`Feed ${feedId} soft deleted successfully`);
      }

      return result;
    } catch (error) {
      console.error("Error deleting feed:", error);
      throw error;
    }
  }

  /**
   * Eski içerikleri temizler
   * @param {string} userId Kullanıcı ID'si
   * @param {number} olderThanDays Belirtilen günden daha eski öğeleri siler (varsayılan: 30 gün)
   * @param {boolean} keepFavorites Favorileri korur (varsayılan: true)
   * @param {boolean} keepReadLater "Sonra Oku" olarak işaretlenmiş öğeleri korur (varsayılan: true)
   * @returns {Promise<{deleted: number, error: any}>} Silinen öğe sayısı ve varsa hata bilgisi
   */
  async cleanUpOldItems(
    userId,
    olderThanDays = 30,
    keepFavorites = true,
    keepReadLater = true
  ) {
    try {
      if (!userId) throw new Error("User ID is required");

      const result = await this.feedRepository.cleanUpOldItems(
        userId,
        olderThanDays,
        keepFavorites,
        keepReadLater
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Error cleaning up old items:", error);
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
  limitItemsPerFeed(feeds, items, limit = 12) {
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

  /**
   * Sayfalı olarak feed öğelerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @param {number} page Sayfa numarası
   * @param {number} pageSize Sayfa başına öğe sayısı
   * @param {Object} filters Filtre parametreleri
   * @returns {Promise<Object>} Sayfalı feed öğeleri
   */
  async getPaginatedFeedItems(userId, page = 1, pageSize = 12, filters = {}) {
    try {
      if (!userId) {
        console.warn("getPaginatedFeedItems called without userId");
        return { data: [], total: 0, hasMore: false };
      }

      // Get the user's feeds first
      const feeds = await this.getFeeds(userId);
      console.log("User feeds:", feeds?.length || 0);

      if (!feeds || feeds.length === 0) {
        console.log("No feeds found for user");
        return { data: [], total: 0, hasMore: false };
      }

      // Extract feed IDs
      let feedIds = feeds.map((feed) => feed.id);

      // Log filtering operations
      console.log("Starting filtering:", {
        selectedFeedId: filters.selectedFeedId,
        feedType: filters.feedType,
      });

      // Filter by selected feed (highest priority)
      if (filters.selectedFeedId) {
        console.log("Selected feed:", filters.selectedFeedId);
        feedIds = [filters.selectedFeedId];
        // If the selected feed is not found, return empty result
        if (!feeds.some((feed) => feed.id === filters.selectedFeedId)) {
          console.log("Selected feed not found");
          return { data: [], total: 0, hasMore: false };
        }
      }
      // If no feed is selected and feed type is specified, filter by type
      else if (filters.feedType && filters.feedType !== "all") {
        console.log("Feed type filter:", filters.feedType);
        const filteredFeeds = feeds.filter(
          (feed) => feed.type === filters.feedType
        );
        if (filteredFeeds.length === 0) {
          console.log("No feeds found for specified type");
          return { data: [], total: 0, hasMore: false };
        }
        feedIds = filteredFeeds.map((feed) => feed.id);
      }

      // Call repository
      console.log("Parameters sent to repository:", {
        feedIds,
        page,
        pageSize,
        filters,
      });

      const result = await this.feedRepository.getPaginatedFeedItems(
        feedIds,
        page,
        pageSize,
        filters
      );

      // Kullanıcı etkileşimlerini ekle
      if (result.data && result.data.length > 0) {
        const itemIds = result.data.map((item) => item.id);
        const interactions = await this.feedRepository.getUserInteractions(
          userId,
          itemIds
        );

        result.data = result.data.map((item) => {
          const interaction =
            interactions.find((i) => i.item_id === item.id) || {};
          return {
            ...item,
            is_read: interaction.is_read || false,
            is_favorite: interaction.is_favorite || false,
            is_read_later: interaction.is_read_later || false,
          };
        });
      }

      console.log("Result from repository:", {
        itemCount: result.data?.length || 0,
        total: result.total,
        hasMore: result.hasMore,
      });

      return result;
    } catch (error) {
      console.error("Error fetching feed items:", error);
      throw error;
    }
  }

  /**
   * Toggles the read status of an item
   * @param {string} itemId Item ID
   * @param {boolean} isRead Read status
   * @returns {Promise<object>} Updated data
   */
  async toggleRead(itemId, isRead) {
    try {
      if (!itemId) throw new Error("Item ID is required");

      // Get the user ID from auth
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await this.toggleItemReadStatus(user.id, itemId, isRead);
    } catch (error) {
      console.error("Error toggling read status:", error);
      throw error;
    }
  }

  /**
   * Toggles the favorite status of an item
   * @param {string} itemId Item ID
   * @param {boolean} isFavorite Favorite status
   * @returns {Promise<object>} Updated data
   */
  async toggleFavorite(itemId, isFavorite) {
    try {
      if (!itemId) throw new Error("Item ID is required");

      // Get the user ID from auth
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await this.toggleItemFavoriteStatus(user.id, itemId, isFavorite);
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      throw error;
    }
  }

  /**
   * Toggles the read later status of an item
   * @param {string} itemId Item ID
   * @param {boolean} isReadLater Read later status
   * @returns {Promise<object>} Updated data
   */
  async toggleReadLater(itemId, isReadLater) {
    try {
      if (!itemId) throw new Error("Item ID is required");

      // Get the user ID from auth
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await this.toggleItemReadLaterStatus(user.id, itemId, isReadLater);
    } catch (error) {
      console.error("Error toggling read later status:", error);
      throw error;
    }
  }

  /**
   * Kategori ekler
   * @param {string} name Kategori adı
   * @param {string} userId Kullanıcı ID'si
   * @param {string} color Renk kodu (opsiyonel)
   * @param {string} icon İkon (opsiyonel)
   * @returns {Promise<object>} Eklenen kategori
   */
  async addCategory(name, userId, color = null, icon = null) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!name) throw new Error("Category name is required");

      // Check if category with same name exists
      const { data: existingCategory, error: checkError } = await this.supabase
        .from("categories")
        .select("id")
        .eq("name", name)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingCategory)
        throw new Error("A category with this name already exists");

      // Add new category
      const { data, error } = await this.supabase
        .from("categories")
        .insert({
          name,
          user_id: userId,
          color,
          icon,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

  /**
   * Kullanıcının kategorilerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Kategoriler
   */
  async getCategories(userId) {
    try {
      if (!userId) {
        console.warn("getCategories called without userId");
        return [];
      }

      const { data, error } = await this.supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Feed içeriklerini senkronize eder
   * @param {string} feedId - Feed kimliği
   * @param {string} userId - Kullanıcı kimliği
   * @param {string} feedType - Feed türü
   * @param {Object} options - Ek seçenekler
   * @param {boolean} options.skipCache - Önbelleği atla (varsayılan: false)
   * @returns {Promise<Object>} - Senkronizasyon sonucu
   */
  async syncFeedItems(feedId, userId, feedType, options = {}) {
    const { skipCache = false } = options;

    try {
      if (!feedId) {
        throw new Error("Feed ID is required");
      }

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Repository üzerinden feed bilgilerini al
      const repositoryResult = await this.feedRepository.syncFeedItems(
        feedId,
        userId,
        { skipCache }
      );

      if (!repositoryResult.success) {
        throw new Error(`Failed to get feed data: ${repositoryResult.error}`);
      }

      // Eğer feed son 1 dakika içinde güncellendiyse, işlemi atla
      if (
        repositoryResult.message &&
        repositoryResult.message.includes("updated") &&
        !skipCache
      ) {
        return repositoryResult;
      }

      const feedInfo = repositoryResult.feedData;
      const feedUrl = repositoryResult.feedUrl;
      const actualFeedType = repositoryResult.feedType || feedType;

      // Feed türüne göre içerikleri çek
      let items = [];
      let feedData = null;
      const MAX_ITEMS = 20; // Her durumda maksimum 20 öğe

      if (actualFeedType === "rss" || actualFeedType === "atom") {
        try {
          // Basitleştirilmiş RSS çekme
          feedData = await this.feedParser.parseRssFeed(feedUrl, { skipCache });
          items = feedData.items || [];

          // Her zaman maksimum 20 öğe ile sınırlandır
          if (items.length > MAX_ITEMS) {
            items = items.slice(0, MAX_ITEMS);
          }
        } catch (error) {
          console.error("RSS parsing error:", error);
          throw new Error(`RSS parsing error: ${error.message}`);
        }
      } else if (actualFeedType === "youtube") {
        try {
          // Basitleştirilmiş YouTube içerik çekme
          feedData = await this.feedParser.parseYoutubeFeed(feedUrl, {
            skipCache,
            maxItems: MAX_ITEMS, // Maksimum 20 öğe ile sınırlandır
          });
          items = feedData.items || [];

          // Ekstra kontrol - yine de 20'den fazla gelirse sınırlandır
          if (items.length > MAX_ITEMS) {
            items = items.slice(0, MAX_ITEMS);
          }
        } catch (error) {
          console.error("YouTube parsing error:", error);
          throw new Error(`YouTube parsing error: ${error.message}`);
        }
      } else {
        console.error("Unsupported feed type:", actualFeedType);
        throw new Error(`Unsupported feed type: ${actualFeedType}`);
      }

      if (items.length === 0) {
        // Feed'i güncelle (son kontrol zamanını)
        await this.feedRepository.updateFeedLastUpdated(feedId);

        return {
          success: true,
          message: "No new content to update",
          feedId,
          updatedItems: 0,
        };
      }

      // İçerikleri veritabanına ekle - feed türüne göre
      let insertedItems = 0;
      if (actualFeedType === "rss" || actualFeedType === "atom") {
        try {
          insertedItems = await this.insertRssItems(feedId, items);
        } catch (error) {
          console.error("Error adding RSS items:", error);
          throw new Error(`Error adding RSS items: ${error.message}`);
        }
      } else if (actualFeedType === "youtube") {
        try {
          insertedItems = await this.insertYoutubeItems(feedId, items);
        } catch (error) {
          console.error("Error adding YouTube items:", error);
          throw new Error(`Error adding YouTube items: ${error.message}`);
        }
      }

      // Feed son güncelleme zamanını güncelle
      await this.feedRepository.updateFeedLastUpdated(feedId);

      return {
        success: true,
        message: "Feed content successfully synchronized",
        feedId,
        updatedItems: insertedItems,
      };
    } catch (error) {
      console.error("Error syncing feed items:", error);
      throw error;
    }
  }

  /**
   * Feed'deki öğeleri yeniler
   * @param {string} feedId Feed ID'si
   * @param {boolean} skipCache Önbelleği atla
   * @returns {Promise<Object>} Yenileme sonucu
   */
  async refreshFeed(feedId, skipCache = false) {
    try {
      if (!feedId) {
        throw new Error("Feed ID'si gerekli");
      }

      // Feed türünü bul
      const feedType = await this.feedRepository.getFeedType(feedId);
      if (!feedType || !feedType.type) {
        throw new Error(`Feed türü bulunamadı: ${feedId}`);
      }

      // Oturum kontrolü
      const { session } = await this._getSession();
      if (!session || !session.user) {
        throw new Error("Oturum bulunamadı");
      }

      const userId = session.user.id;

      console.log(
        `Feed yenileniyor: feedId=${feedId}, type=${feedType.type}, userId=${userId}, skipCache=${skipCache}`
      );

      // Feed öğelerini yenile
      return await this.syncFeedItems(feedId, userId, feedType.type, {
        skipCache,
      });
    } catch (error) {
      console.error(`refreshFeed error for feedId=${feedId}:`, error);
      throw new Error(`Feed yenilenirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * RSS içeriklerini ekler
   * @param {string} feedId - Feed ID
   * @param {Array} items - RSS İçerikleri
   * @returns {Promise<number>} - Eklenen öğe sayısı
   */
  async insertRssItems(feedId, items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }

    try {
      // Maksimum öğe sayısını 100 ile sınırla
      let itemsToInsert = items;
      if (items.length > 100) {
        itemsToInsert = items.slice(0, 100);
      }

      let insertedCount = 0;
      // Her öğeyi ayrı ayrı ekle
      for (const item of itemsToInsert) {
        try {
          const rssItemData = {
            feed_id: feedId,
            title: item.title || "Untitled",
            description: item.description || null,
            content: item.content || null,
            link: item.link || null,
            pub_date: item.pubDate || new Date().toISOString(),
            guid:
              item.guid ||
              item.link ||
              `${feedId}-${Date.now()}-${Math.random()}`,
            thumbnail: item.thumbnail || null,
            author: item.author || null,
          };

          // Repository'nin addRssItem fonksiyonunu kullan
          const result = await this.feedRepository.addRssItem(rssItemData);

          // Başarıyla eklendiyse sayacı artır
          if (result && !result.error) {
            insertedCount++;
          }
        } catch (itemError) {
          console.error(`Error adding RSS item:`, itemError);
          // Tek bir öğe hatası diğerlerini etkilemesin, devam et
        }
      }

      return insertedCount;
    } catch (error) {
      console.error("Error adding RSS items:", error);
      throw error;
    }
  }

  /**
   * YouTube içeriklerini ekler
   * @param {string} feedId - Feed ID
   * @param {Array} items - YouTube İçerikleri
   * @returns {Promise<number>} - Eklenen öğe sayısı
   */
  async insertYoutubeItems(feedId, items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }

    try {
      // Her zaman en fazla 20 öğe işle
      const MAX_ITEMS = 20;
      let itemsToInsert = items.slice(0, MAX_ITEMS);

      let insertedCount = 0;

      // Her öğeyi tek tek ekleyelim
      for (const item of itemsToInsert) {
        try {
          if (!item.videoId) {
            console.warn("Skipping YouTube item without video ID:", item.title);
            continue;
          }

          // Basitleştirilmiş YouTube öğesi verisi
          const youtubeItemData = {
            feed_id: feedId,
            video_id: item.videoId,
            title: item.title || "Untitled Video",
            description: item.description
              ? item.description.substring(0, 500)
              : null, // Açıklamayı sınırlandır
            thumbnail: item.thumbnail || null,
            published_at: item.pubDate || new Date().toISOString(),
            channel_title: item.channelTitle || null,
            url: `https://youtube.com/watch?v=${item.videoId}`,
            is_short: item.isShort || false, // Shorts videosu mu?
            content_type: item.type || "video", // İçerik tipi (shorts/video)
            duration: item.duration || null, // Video süresi (varsa)
          };

          // Veritabanına ekle
          const result = await this.feedRepository.addYoutubeItem(
            youtubeItemData
          );

          // Başarıyla eklendiyse sayacı artır
          if (result) {
            insertedCount++;
          }
        } catch (itemError) {
          // Hata çıksa bile diğer öğeleri eklemeye devam et
          console.error(`Error adding YouTube item:`, itemError);
        }
      }

      return insertedCount;
    } catch (error) {
      console.error("Error adding YouTube items:", error);
      throw error;
    }
  }
}

// Sınıfın bir örneğini oluşturup export ediyoruz
export const feedService = new FeedService();

import { db } from "@/lib/db";

/**
 * EnhancedFeedRepository ve FeedRepository sınıflarında olabilecek sorunları tespit ve onarma sınıfı
 */
export class RepositoryFixer {
  /**
   * Tüm aşamaları çalıştırır
   */
  static async diagnoseAndFix(userId, options = {}) {
    try {
      const results = {
        timestamp: new Date().toISOString(),
        userId,
        steps: {},
      };

      // 1. Veritabanı bağlantısını kontrol et
      results.steps.dbConnection = await this.checkDbConnection();

      // 2. Beslemeleri kontrol et
      results.steps.feeds = await this.checkFeeds(userId);

      // Besleme kayıtları yoksa daha fazla işlem yapma
      if (!results.steps.feeds.success) {
        results.success = false;
        results.message =
          "Feed verileri bulunamadı, ileri seviye kontroller yapılamıyor";
        return results;
      }

      // 3. İçerikleri kontrol et
      const feedIds = results.steps.feeds.data.map((feed) => feed.id);
      results.steps.feedContent = await this.checkFeedContent(feedIds);

      // İçerik yoksa etkileşim kontrolü yapma
      if (!results.steps.feedContent.success) {
        results.success = false;
        results.message =
          "Feed içeriği bulunamadı, etkileşim kontrolleri yapılamıyor";
        return results;
      }

      // 4. Etkileşimleri kontrol et
      results.steps.interactions = await this.checkInteractions(
        userId,
        results.steps.feedContent.data
      );

      // 5. Eksik etkileşimleri onar
      if (results.steps.interactions.missingCount > 0) {
        results.steps.repair = await this.repairMissingInteractions(
          userId,
          results.steps.interactions.missingItems
        );
      }

      // 6. Önbellekleri temizle
      results.steps.cacheCleared = await this.clearCaches();

      // Genel sonuç
      results.success = true;
      results.message = "Tanı ve onarım tamamlandı";
      return results;
    } catch (error) {
      console.error("Hata ayıklama ve onarım hatası:", error);
      return {
        success: false,
        message: "Tanı ve onarım sırasında hata: " + error.message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Veritabanı bağlantısını kontrol eder
   */
  static async checkDbConnection() {
    try {
      const startTime = Date.now();
      await db.query("SELECT 1 as test");
      const endTime = Date.now();

      return {
        success: true,
        message: "Veritabanı bağlantısı başarılı",
        pingTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Veritabanı bağlantısı başarısız",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Beslemeleri kontrol eder
   */
  static async checkFeeds(userId) {
    try {
      const { data: feeds, error } = await db.query(
        `
        SELECT * FROM feeds 
        WHERE user_id = $1 AND deleted_at IS NULL
      `,
        [userId]
      );

      if (error) {
        return {
          success: false,
          message: "Feed sorgusu sırasında hata",
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      if (!feeds || feeds.length === 0) {
        return {
          success: false,
          message: "Kullanıcı için feed bulunamadı",
          userId,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: `${feeds.length} feed bulundu`,
        count: feeds.length,
        data: feeds,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Feed kontrolü sırasında hata",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Feed içeriklerini kontrol eder
   */
  static async checkFeedContent(feedIds) {
    try {
      // RSS öğeleri
      const { data: rssItems, error: rssError } = await db.query(
        `
        SELECT * FROM rss_items 
        WHERE feed_id = ANY($1::uuid[])
        ORDER BY published_at DESC
        LIMIT 100
      `,
        [feedIds]
      );

      // YouTube öğeleri
      const { data: youtubeItems, error: youtubeError } = await db.query(
        `
        SELECT * FROM youtube_items 
        WHERE feed_id = ANY($1::uuid[])
        ORDER BY published_at DESC
        LIMIT 100
      `,
        [feedIds]
      );

      if (rssError || youtubeError) {
        return {
          success: false,
          message: "İçerik sorgusu sırasında hata",
          error: rssError?.message || youtubeError?.message,
          timestamp: new Date().toISOString(),
        };
      }

      const allItems = [
        ...(rssItems || []).map((item) => ({ ...item, type: "rss" })),
        ...(youtubeItems || []).map((item) => ({ ...item, type: "youtube" })),
      ];

      if (allItems.length === 0) {
        return {
          success: false,
          message: "Feed içeriği bulunamadı",
          feedIds,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: `${allItems.length} içerik öğesi bulundu (${
          rssItems?.length || 0
        } RSS, ${youtubeItems?.length || 0} YouTube)`,
        count: allItems.length,
        rssCount: rssItems?.length || 0,
        youtubeCount: youtubeItems?.length || 0,
        data: allItems,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "İçerik kontrolü sırasında hata",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Kullanıcı etkileşimlerini kontrol eder
   */
  static async checkInteractions(userId, contentItems) {
    try {
      // Tüm içerik ID'leri
      const allItemIds = contentItems.map((item) => item.id);

      // Mevcut etkileşimler
      const { data: interactions, error } = await db.query(
        `
        SELECT * FROM user_interaction 
        WHERE user_id = $1 AND item_id = ANY($2::uuid[])
      `,
        [userId, allItemIds]
      );

      if (error) {
        return {
          success: false,
          message: "Etkileşim sorgusu sırasında hata",
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      // Etkileşim olmayan öğeleri bul
      const interactionItemIds = new Set(
        interactions?.map((i) => i.item_id) || []
      );
      const missingItems = contentItems.filter(
        (item) => !interactionItemIds.has(item.id)
      );

      return {
        success: true,
        message: `${interactions?.length || 0} etkileşim bulundu, ${
          missingItems.length
        } öğe için etkileşim eksik`,
        count: interactions?.length || 0,
        missingCount: missingItems.length,
        data: interactions || [],
        missingItems,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Etkileşim kontrolü sırasında hata",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Eksik etkileşimleri onarır
   */
  static async repairMissingInteractions(userId, missingItems) {
    try {
      // Eğer eksik öğe yoksa işlem yapma
      if (!missingItems || missingItems.length === 0) {
        return {
          success: true,
          message: "Onarılacak eksik etkileşim yok",
          count: 0,
          timestamp: new Date().toISOString(),
        };
      }

      // Her eksik öğe için bir etkileşim oluştur
      let successCount = 0;
      let errorCount = 0;
      let errors = [];

      for (const item of missingItems) {
        try {
          await db.query(
            `
            INSERT INTO user_interaction
            (user_id, item_id, item_type, is_read, is_favorite, is_read_later, created_at, updated_at)
            VALUES ($1, $2, $3, false, false, false, NOW(), NOW())
            ON CONFLICT (user_id, item_id) DO NOTHING
          `,
            [userId, item.id, item.type]
          );
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({ itemId: item.id, error: error.message });
        }
      }

      return {
        success: errorCount === 0,
        message: `${successCount} etkileşim oluşturuldu${
          errorCount > 0 ? `, ${errorCount} hata` : ""
        }`,
        count: successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Etkileşim onarımı sırasında hata",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Önbellekleri temizler
   */
  static async clearCaches() {
    try {
      // DbClient önbelleğini temizle
      db.clearCache();

      return {
        success: true,
        message: "Önbellek temizlendi",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Önbellek temizleme sırasında hata",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

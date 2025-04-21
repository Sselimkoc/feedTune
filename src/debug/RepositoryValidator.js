import { db } from "@/lib/db";

/**
 * Repository metotlarını doğrulayan ve hata raporlayan yardımcı sınıf
 */
export class RepositoryValidator {
  /**
   * Bir feed repository metodunu doğrular ve sonuç üretir
   * @param {Function} methodFn - Test edilecek repository metodu
   * @param {Object} options - Test seçenekleri
   * @returns {Promise<Object>} - Doğrulama sonucu
   */
  static async validateMethod(methodFn, options = {}) {
    const startTime = Date.now();
    let result = {
      methodName: options.methodName || "Unknown Method",
      timestamp: new Date().toISOString(),
      duration: 0,
      success: false,
      params: options.params || {},
    };

    try {
      // Metodu çalıştır
      const methodResult = await methodFn();

      // Sonuç ve süre bilgilerini ekle
      const endTime = Date.now();
      result.duration = endTime - startTime;
      result.success = true;
      result.data = methodResult;

      // İçerik var mı kontrol et
      if (Array.isArray(methodResult)) {
        result.count = methodResult.length;
        result.isEmpty = methodResult.length === 0;
      } else if (methodResult && typeof methodResult === "object") {
        // Kompleks sonuçları kontrol et (örn: {rssItems: [], youtubeItems: []})
        if (methodResult.rssItems || methodResult.youtubeItems) {
          const rssCount = Array.isArray(methodResult.rssItems)
            ? methodResult.rssItems.length
            : 0;
          const youtubeCount = Array.isArray(methodResult.youtubeItems)
            ? methodResult.youtubeItems.length
            : 0;

          result.count = {
            rss: rssCount,
            youtube: youtubeCount,
            total: rssCount + youtubeCount,
          };

          result.isEmpty = rssCount === 0 && youtubeCount === 0;
        }

        // İnteraksiyon verilerini kontrol et
        if (methodResult.interactionData) {
          result.interactionCount = Object.keys(
            methodResult.interactionData
          ).length;
        }
      }

      return result;
    } catch (error) {
      // Hata durumunu kaydet
      const endTime = Date.now();
      result.duration = endTime - startTime;
      result.success = false;
      result.error = {
        message: error.message,
        stack: error.stack,
      };

      console.error(
        `Repository method validation error (${options.methodName}):`,
        error
      );
      return result;
    }
  }

  /**
   * getFeedItems metodunu doğrular
   * @param {Function} repository - Repository örneği veya sınıfı
   * @param {Array<string>} feedIds - Feed ID'leri
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Object>} - Doğrulama sonucu
   */
  static async validateGetFeedItems(repository, feedIds, userId) {
    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      return {
        success: false,
        message: "Feed ID'leri belirtilmemiş veya boş",
        methodName: "getFeedItems",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Standart çağrı
      const standardResult = await this.validateMethod(
        () => repository.getFeedItems(feedIds, 10, null, userId),
        {
          methodName: "getFeedItems",
          params: { feedIds, limit: 10, timestamp: null, userId },
        }
      );

      // Parametreleri tersine çevrilmiş çağrı
      const reversedResult = await this.validateMethod(
        () => repository.getFeedItems(feedIds, 10, userId, null),
        {
          methodName: "getFeedItems (reversed params)",
          params: { feedIds, limit: 10, timestamp: userId, userId: null },
        }
      );

      // Kullanıcı olmadan çağrı
      const withoutUserResult = await this.validateMethod(
        () => repository.getFeedItems(feedIds, 10),
        {
          methodName: "getFeedItems (without user)",
          params: { feedIds, limit: 10 },
        }
      );

      // Sonuçları analiz et
      const hasInteractionInStandard =
        standardResult.success &&
        standardResult.data &&
        standardResult.interactionCount > 0;

      const hasInteractionInReversed =
        reversedResult.success &&
        reversedResult.data &&
        reversedResult.interactionCount > 0;

      // Parametre sıralaması sorunu olup olmadığını belirle
      const hasParameterOrderIssue =
        !hasInteractionInStandard && hasInteractionInReversed;

      return {
        success: standardResult.success || reversedResult.success,
        methodName: "getFeedItems",
        timestamp: new Date().toISOString(),
        standardResult,
        reversedResult,
        withoutUserResult,
        analysis: {
          hasParameterOrderIssue,
          recommendedFix: hasParameterOrderIssue
            ? "userId ve timestamp parametrelerinin sırası tersine çevrilmeli"
            : null,
          hasContent:
            (standardResult.count && standardResult.count.total > 0) ||
            (reversedResult.count && reversedResult.count.total > 0),
          hasInteractions: hasInteractionInStandard || hasInteractionInReversed,
        },
      };
    } catch (error) {
      console.error("getFeedItems validation error:", error);
      return {
        success: false,
        methodName: "getFeedItems",
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  /**
   * getUserInteractions metodunu doğrular
   * @param {Function} repository - Repository örneği veya sınıfı
   * @param {string} userId - Kullanıcı ID'si
   * @param {Array<string>} itemIds - İçerik öğesi ID'leri
   * @returns {Promise<Object>} - Doğrulama sonucu
   */
  static async validateGetUserInteractions(repository, userId, itemIds) {
    if (!userId) {
      return {
        success: false,
        message: "Kullanıcı ID'si belirtilmemiş",
        methodName: "getUserInteractions",
        timestamp: new Date().toISOString(),
      };
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return {
        success: false,
        message: "İçerik öğesi ID'leri belirtilmemiş veya boş",
        methodName: "getUserInteractions",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Direkt veritabanı sorgusu (doğrulama için)
      const { data: directQueryInteractions } = await db.query(
        `
        SELECT * FROM user_interaction 
        WHERE user_id = $1 AND item_id = ANY($2::uuid[])
        ORDER BY updated_at DESC
      `,
        [userId, itemIds]
      );

      // Repository metodu çağrısı
      const validationResult = await this.validateMethod(
        () => repository.getUserInteractions(userId, itemIds),
        {
          methodName: "getUserInteractions",
          params: { userId, itemIds },
        }
      );

      // Etkileşimler benzer mi kontrol et
      const directQueryCount = directQueryInteractions?.length || 0;
      const repoResultCount = Array.isArray(validationResult.data)
        ? validationResult.data.length
        : 0;

      const matchesDirectQuery = directQueryCount === repoResultCount;

      return {
        ...validationResult,
        analysis: {
          directQueryCount,
          repoResultCount,
          matchesDirectQuery,
          discrepancy: matchesDirectQuery
            ? null
            : `Direkt DB sorgusu ${directQueryCount} etkileşim döndürürken, repository metodu ${repoResultCount} etkileşim döndürdü`,
        },
      };
    } catch (error) {
      console.error("getUserInteractions validation error:", error);
      return {
        success: false,
        methodName: "getUserInteractions",
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  /**
   * Repository sınıfındaki sorunlu etkileşim onarma fiksini uygular
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Object>} - Onarım sonucu
   */
  static async applyInteractionFix(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          message: "Kullanıcı ID'si belirtilmemiş",
          timestamp: new Date().toISOString(),
        };
      }

      // 1. Kullanıcı feed'lerini al
      const { data: feeds } = await db.query(
        `
        SELECT id FROM feeds WHERE user_id = $1 AND deleted_at IS NULL
      `,
        [userId]
      );

      if (!feeds || feeds.length === 0) {
        return {
          success: false,
          message: "Kullanıcı için feed bulunamadı",
          timestamp: new Date().toISOString(),
        };
      }

      const feedIds = feeds.map((feed) => feed.id);

      // 2. Tüm içerik öğelerini al
      const { data: rssItems } = await db.query(
        `
        SELECT id FROM rss_items WHERE feed_id = ANY($1::uuid[])
      `,
        [feedIds]
      );

      const { data: youtubeItems } = await db.query(
        `
        SELECT id FROM youtube_items WHERE feed_id = ANY($1::uuid[])
      `,
        [feedIds]
      );

      const allItemIds = [
        ...(rssItems || []).map((item) => item.id),
        ...(youtubeItems || []).map((item) => item.id),
      ];

      if (allItemIds.length === 0) {
        return {
          success: false,
          message: "İçerik öğeleri bulunamadı",
          timestamp: new Date().toISOString(),
        };
      }

      // 3. Mevcut etkileşimleri al
      const { data: existingInteractions } = await db.query(
        `
        SELECT item_id FROM user_interaction WHERE user_id = $1
      `,
        [userId]
      );

      const existingItemIds = new Set(
        existingInteractions?.map((i) => i.item_id) || []
      );
      const missingItems = allItemIds.filter(
        (itemId) => !existingItemIds.has(itemId)
      );

      // 4. Eksik etkileşimleri oluştur
      let created = 0;
      for (const itemId of missingItems) {
        const itemType = rssItems.some((item) => item.id === itemId)
          ? "rss"
          : "youtube";

        await db.query(
          `
          INSERT INTO user_interaction
          (user_id, item_id, item_type, is_read, is_favorite, is_read_later, created_at, updated_at)
          VALUES ($1, $2, $3, false, false, false, NOW(), NOW())
          ON CONFLICT (user_id, item_id) DO NOTHING
        `,
          [userId, itemId, itemType]
        );

        created++;
      }

      // 5. Önbellekleri temizle
      db.clearCache();

      return {
        success: true,
        message: `Etkileşim durumu düzeltildi: ${created} yeni etkileşim oluşturuldu`,
        created,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Interaction fix error:", error);
      return {
        success: false,
        message: "Etkileşim düzeltme hatası: " + error.message,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

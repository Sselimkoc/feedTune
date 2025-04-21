import { db } from "../lib/db";
import { getCurrentUserId } from "./authState";

/**
 * Kullanıcının feed aboneliklerini kontrol eder
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} Feed abonelikleri hakkında bilgi
 */
export async function checkUserFeeds(userId = null) {
  try {
    const userIdToUse = userId || (await getCurrentUserId());

    if (!userIdToUse) {
      return {
        success: false,
        message: "Kullanıcı ID'si bulunamadı",
        timestamp: new Date().toISOString(),
      };
    }

    // Kullanıcı feed'lerini sorgula
    const feeds = await db.query(
      `
      SELECT * FROM feeds WHERE user_id = $1 AND deleted_at IS NULL
    `,
      [userIdToUse]
    );

    if (!feeds || feeds.length === 0) {
      return {
        success: false,
        message: "Kullanıcı için feed bulunamadı",
        userId: userIdToUse,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: `${feeds.length} feed bulundu`,
      userId: userIdToUse,
      feedCount: feeds.length,
      feeds: feeds.map((feed) => ({
        id: feed.id,
        title: feed.title,
        url: feed.url,
        type: feed.type,
        createdAt: feed.created_at,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: "Feed'ler kontrol edilirken hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * RSS öğelerini kontrol eder
 * @param {Array<string>} feedIds - Feed ID'leri
 * @param {number} limit - Maksimum öğe sayısı
 * @returns {Promise<Object>} RSS öğeleri hakkında bilgi
 */
export async function checkRssItems(feedIds, limit = 20) {
  try {
    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      const userId = await getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          message: "Feed ID'leri belirtilmedi ve kullanıcı ID'si bulunamadı",
          timestamp: new Date().toISOString(),
        };
      }

      // Kullanıcının feed'lerini al
      const feeds = await db.query(
        `
        SELECT id FROM feeds WHERE user_id = $1 AND deleted_at IS NULL
      `,
        [userId]
      );

      if (!feeds || feeds.length === 0) {
        return {
          success: false,
          message: "Kullanıcı için feed bulunamadı",
          userId,
          timestamp: new Date().toISOString(),
        };
      }

      feedIds = feeds.map((feed) => feed.id);
    }

    // RSS öğelerini sorgula
    const rssItems = await db.query(
      `
      SELECT * FROM rss_items 
      WHERE feed_id = ANY($1::uuid[])
      ORDER BY published_at DESC
      LIMIT $2
    `,
      [feedIds, limit]
    );

    if (!rssItems || rssItems.length === 0) {
      return {
        success: false,
        message: "RSS öğeleri bulunamadı",
        feedIds,
        timestamp: new Date().toISOString(),
      };
    }

    // Toplam sayıyı kontrol et
    const totalCount = await db.query(
      `
      SELECT COUNT(*) as total FROM rss_items 
      WHERE feed_id = ANY($1::uuid[])
    `,
      [feedIds]
    );

    return {
      success: true,
      message: `${rssItems.length} RSS öğesi bulundu (toplam: ${totalCount[0].total})`,
      feedIds,
      itemCount: rssItems.length,
      totalCount: totalCount[0].total,
      items: rssItems.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        feedId: item.feed_id,
        publishedAt: item.published_at,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: "RSS öğeleri kontrol edilirken hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * YouTube öğelerini kontrol eder
 * @param {Array<string>} feedIds - Feed ID'leri
 * @param {number} limit - Maksimum öğe sayısı
 * @returns {Promise<Object>} YouTube öğeleri hakkında bilgi
 */
export async function checkYoutubeItems(feedIds, limit = 20) {
  try {
    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      const userId = await getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          message: "Feed ID'leri belirtilmedi ve kullanıcı ID'si bulunamadı",
          timestamp: new Date().toISOString(),
        };
      }

      // Kullanıcının YouTube feed'lerini al
      const feeds = await db.query(
        `
        SELECT id FROM feeds 
        WHERE user_id = $1 AND type = 'youtube' AND deleted_at IS NULL
      `,
        [userId]
      );

      if (!feeds || feeds.length === 0) {
        return {
          success: false,
          message: "Kullanıcı için YouTube feed bulunamadı",
          userId,
          timestamp: new Date().toISOString(),
        };
      }

      feedIds = feeds.map((feed) => feed.id);
    }

    // YouTube öğelerini sorgula
    const youtubeItems = await db.query(
      `
      SELECT * FROM youtube_items 
      WHERE feed_id = ANY($1::uuid[])
      ORDER BY published_at DESC
      LIMIT $2
    `,
      [feedIds, limit]
    );

    if (!youtubeItems || youtubeItems.length === 0) {
      return {
        success: false,
        message: "YouTube öğeleri bulunamadı",
        feedIds,
        timestamp: new Date().toISOString(),
      };
    }

    // Toplam sayıyı kontrol et
    const totalCount = await db.query(
      `
      SELECT COUNT(*) as total FROM youtube_items 
      WHERE feed_id = ANY($1::uuid[])
    `,
      [feedIds]
    );

    return {
      success: true,
      message: `${youtubeItems.length} YouTube öğesi bulundu (toplam: ${totalCount[0].total})`,
      feedIds,
      itemCount: youtubeItems.length,
      totalCount: totalCount[0].total,
      items: youtubeItems.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        feedId: item.feed_id,
        publishedAt: item.published_at,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: "YouTube öğeleri kontrol edilirken hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Kullanıcı etkileşimlerini kontrol eder
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} Kullanıcı etkileşimleri hakkında bilgi
 */
export async function checkUserInteractions(userId = null) {
  try {
    const userIdToUse = userId || (await getCurrentUserId());

    if (!userIdToUse) {
      return {
        success: false,
        message: "Kullanıcı ID'si bulunamadı",
        timestamp: new Date().toISOString(),
      };
    }

    // Kullanıcı etkileşimlerini sorgula
    const interactions = await db.query(
      `
      SELECT * FROM user_interaction 
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 20
    `,
      [userIdToUse]
    );

    if (!interactions || interactions.length === 0) {
      return {
        success: false,
        message: "Kullanıcı etkileşimleri bulunamadı",
        userId: userIdToUse,
        timestamp: new Date().toISOString(),
      };
    }

    // Etkileşim istatistiklerini al
    const stats = await db.query(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_favorite = true THEN 1 ELSE 0 END) as favorite_count,
        SUM(CASE WHEN is_read_later = true THEN 1 ELSE 0 END) as read_later_count
      FROM user_interaction 
      WHERE user_id = $1
    `,
      [userIdToUse]
    );

    return {
      success: true,
      message: `${interactions.length} kullanıcı etkileşimi bulundu`,
      userId: userIdToUse,
      interactionCount: interactions.length,
      stats: stats[0],
      interactions: interactions.slice(0, 5).map((item) => ({
        id: item.id,
        itemId: item.item_id,
        itemType: item.item_type,
        isRead: item.is_read,
        isFavorite: item.is_favorite,
        isReadLater: item.is_read_later,
        updatedAt: item.updated_at,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: "Kullanıcı etkileşimleri kontrol edilirken hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Veritabanı bağlantısını test eder
 * @returns {Promise<Object>} Veritabanı bağlantısı hakkında bilgi
 */
export async function checkDbConnection() {
  try {
    const startTime = Date.now();
    const result = await db.query("SELECT NOW() as current_time");
    const endTime = Date.now();

    return {
      success: true,
      message: "Veritabanı bağlantısı başarılı",
      pingTime: `${endTime - startTime}ms`,
      serverTime: result[0].current_time,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: "Veritabanı bağlantısı test edilirken hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Sistem tanılama
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} Sistem durumu hakkında bilgi
 */
export async function diagnoseSystem(userId = null) {
  try {
    const userIdToUse = userId || (await getCurrentUserId());

    if (!userIdToUse) {
      return {
        success: false,
        message: "Kullanıcı ID'si bulunamadı",
        dbConnection: await checkDbConnection(),
        timestamp: new Date().toISOString(),
      };
    }

    // Tüm kontrolleri paralel olarak çalıştır
    const [
      dbConnectionResult,
      authStateResult,
      userFeedsResult,
      userInteractionsResult,
    ] = await Promise.all([
      checkDbConnection(),
      checkAuthState(),
      checkUserFeeds(userIdToUse),
      checkUserInteractions(userIdToUse),
    ]);

    // Feed'ler varsa, RSS ve YouTube öğelerini kontrol et
    let rssItemsResult = null;
    let youtubeItemsResult = null;

    if (
      userFeedsResult.success &&
      userFeedsResult.feeds &&
      userFeedsResult.feeds.length > 0
    ) {
      const feedIds = userFeedsResult.feeds.map((feed) => feed.id);
      [rssItemsResult, youtubeItemsResult] = await Promise.all([
        checkRssItems(feedIds),
        checkYoutubeItems(feedIds),
      ]);
    }

    return {
      success: true,
      message: "Sistem tanılama tamamlandı",
      timestamp: new Date().toISOString(),
      userId: userIdToUse,
      dbConnection: dbConnectionResult,
      authState: authStateResult,
      userFeeds: userFeedsResult,
      rssItems: rssItemsResult,
      youtubeItems: youtubeItemsResult,
      userInteractions: userInteractionsResult,
    };
  } catch (error) {
    return {
      success: false,
      message: "Sistem tanılama sırasında hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Tarayıcı konsolunda kullanılabilecek debug nesnesi
 */
export const feedDebug = {
  checkFeeds: checkUserFeeds,
  checkRssItems,
  checkYoutubeItems,
  checkUserInteractions,
  checkDbConnection,
  diagnoseSystem,
};

// Global nesneye ekleme (sadece tarayıcı ortamında)
if (typeof window !== "undefined") {
  window.feedDebug = feedDebug;
}

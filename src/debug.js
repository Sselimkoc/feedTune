// debug.js - FeedTune debugging yardımcısı

/**
 * Feed ve YouTube içerik verilerini direkt veritabanından kontrol etmek için
 * Bu fonksiyonları tarayıcı konsolunda çağırarak verilerin durumunu görebilirsiniz
 *
 * Kullanım:
 * 1. Bu dosyayı bir bileşen içine import edin veya doğrudan konsolda kopyalayın
 * 2. Konsolu açıp fonksiyonları çağırın
 */

import { dbClient } from "./db/dbClient";

/**
 * Kullanıcı feedlerini kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<object>} - Feed sonuçları
 */
async function checkFeeds(userId) {
  if (!userId) {
    console.error("Kullanıcı ID'si belirtilmedi");
    return { error: "Kullanıcı ID'si belirtilmedi", feeds: [] };
  }

  try {
    const query = `
      SELECT * FROM feeds 
      WHERE user_id = ? 
      AND deleted_at IS NULL
    `;

    const feeds = await dbClient.query(query, [userId]);

    console.log(`Feedler bulundu: ${feeds.length}`, feeds);

    return {
      success: true,
      count: feeds.length,
      feeds,
      feedIds: feeds.map((feed) => feed.id),
    };
  } catch (error) {
    console.error("Feed kontrolü sırasında hata:", error);
    return {
      success: false,
      error: error.message,
      feeds: [],
    };
  }
}

/**
 * RSS öğelerini kontrol eder
 * @param {Array<string>} feedIds - Feed ID'leri
 * @returns {Promise<object>} - RSS öğe sonuçları
 */
async function checkRssItems(feedIds) {
  if (!feedIds || !feedIds.length) {
    console.error("Feed ID'leri belirtilmedi");
    return { error: "Feed ID'leri belirtilmedi", items: [] };
  }

  try {
    const placeholders = feedIds.map(() => "?").join(",");
    const query = `
      SELECT * FROM rss_items 
      WHERE feed_id IN (${placeholders})
      ORDER BY pub_date DESC
      LIMIT 30
    `;

    const items = await dbClient.query(query, feedIds);

    console.log(`RSS öğeleri bulundu: ${items.length}`, items);

    return {
      success: true,
      count: items.length,
      items,
    };
  } catch (error) {
    console.error("RSS öğe kontrolü sırasında hata:", error);
    return {
      success: false,
      error: error.message,
      items: [],
    };
  }
}

/**
 * YouTube öğelerini kontrol eder
 * @param {Array<string>} feedIds - Feed ID'leri
 * @returns {Promise<object>} - YouTube öğe sonuçları
 */
async function checkYoutubeItems(feedIds) {
  if (!feedIds || !feedIds.length) {
    console.error("Feed ID'leri belirtilmedi");
    return { error: "Feed ID'leri belirtilmedi", items: [] };
  }

  try {
    const placeholders = feedIds.map(() => "?").join(",");
    const query = `
      SELECT * FROM youtube_items 
      WHERE feed_id IN (${placeholders})
      ORDER BY published_at DESC
      LIMIT 30
    `;

    const items = await dbClient.query(query, feedIds);

    console.log(`YouTube öğeleri bulundu: ${items.length}`, items);

    return {
      success: true,
      count: items.length,
      items,
    };
  } catch (error) {
    console.error("YouTube öğe kontrolü sırasında hata:", error);
    return {
      success: false,
      error: error.message,
      items: [],
    };
  }
}

/**
 * Kullanıcı etkileşimlerini kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<object>} - Etkileşim sonuçları
 */
async function checkUserInteractions(userId) {
  if (!userId) {
    console.error("Kullanıcı ID'si belirtilmedi");
    return { error: "Kullanıcı ID'si belirtilmedi", interactions: [] };
  }

  try {
    const query = `
      SELECT * FROM user_interaction 
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 30
    `;

    const interactions = await dbClient.query(query, [userId]);

    console.log(
      `Kullanıcı etkileşimleri bulundu: ${interactions.length}`,
      interactions
    );

    // Etkileşim tiplerini sayalım
    const stats = {
      readCount: 0,
      favoriteCount: 0,
      readLaterCount: 0,
    };

    interactions.forEach((interaction) => {
      if (interaction.is_read) stats.readCount++;
      if (interaction.is_favorite) stats.favoriteCount++;
      if (interaction.is_read_later) stats.readLaterCount++;
    });

    return {
      success: true,
      count: interactions.length,
      interactions,
      stats,
    };
  } catch (error) {
    console.error("Kullanıcı etkileşimleri kontrolü sırasında hata:", error);
    return {
      success: false,
      error: error.message,
      interactions: [],
    };
  }
}

/**
 * Veritabanı bağlantısını kontrol eder
 * @returns {Promise<object>} - Bağlantı durumu
 */
async function checkDbConnection() {
  try {
    const startTime = Date.now();
    const result = await dbClient.query("SELECT 1 as connection_test");
    const endTime = Date.now();

    return {
      success: true,
      connectionTime: endTime - startTime,
      details: result,
    };
  } catch (error) {
    console.error("Veritabanı bağlantı kontrolü sırasında hata:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cache'leri temizler
 * @returns {Promise<object>} - Temizleme sonucu
 */
async function clearCaches() {
  try {
    await dbClient.clearAllCaches();
    console.log("Tüm cache'ler temizlendi");
    return {
      success: true,
      message: "Tüm cache'ler başarıyla temizlendi",
    };
  } catch (error) {
    console.error("Cache temizleme sırasında hata:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Repository'lerin çalışma durumunu kontrol eder
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<object>} - Kontrol sonuçları
 */
async function checkRepositories(userId) {
  if (!userId) {
    return { error: "Kullanıcı ID'si belirtilmedi" };
  }

  try {
    // Çalışma zamanını ölçmek için başlangıç zamanı
    const startTime = Date.now();

    // EnhancedFeedRepository ve FeedRepository'yi dinamik olarak import et
    const enhancedRepository = (
      await import("./repositories/enhancedFeedRepository")
    ).default;
    const legacyRepository = (await import("./repositories/feedRepository"))
      .default;

    // Her iki repository ile de feedleri al
    const enhancedFeeds = await enhancedRepository.getFeeds(userId);
    const legacyFeeds = await legacyRepository.getFeeds(userId);

    // Sonuçlar
    const results = {
      success: true,
      enhancedRepository: {
        feedCount: enhancedFeeds.length,
        feeds: enhancedFeeds,
      },
      legacyRepository: {
        feedCount: legacyFeeds.length,
        feeds: legacyFeeds,
      },
      executionTime: Date.now() - startTime,
    };

    console.log("Repository kontrolü tamamlandı:", results);
    return results;
  } catch (error) {
    console.error("Repository kontrolü sırasında hata:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sistem teşhisi yapar
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<object>} - Teşhis sonuçları
 */
async function diagnoseSystem(userId) {
  if (!userId) {
    console.error("Kullanıcı ID'si belirtilmedi");
    return { error: "Kullanıcı ID'si belirtilmedi" };
  }

  console.log(`${userId} kullanıcısı için sistem teşhisi başlatılıyor...`);

  const results = {
    timestamp: new Date().toISOString(),
    userId,
    database: null,
    feeds: null,
    rssItems: null,
    youtubeItems: null,
    userInteractions: null,
    repositories: null,
  };

  try {
    // Paralel olarak tüm kontrolleri çalıştıralım
    const [dbConnection, feedsResult, repoResults] = await Promise.all([
      checkDbConnection(),
      checkFeeds(userId),
      checkRepositories(userId),
    ]);

    results.database = dbConnection;
    results.feeds = feedsResult;
    results.repositories = repoResults;

    // Feed'ler varsa, RSS ve YouTube öğelerini kontrol edelim
    if (
      feedsResult.success &&
      feedsResult.feedIds &&
      feedsResult.feedIds.length > 0
    ) {
      const [rssResults, youtubeResults, interactionsResults] =
        await Promise.all([
          checkRssItems(feedsResult.feedIds),
          checkYoutubeItems(feedsResult.feedIds),
          checkUserInteractions(userId),
        ]);

      results.rssItems = rssResults;
      results.youtubeItems = youtubeResults;
      results.userInteractions = interactionsResults;
    }

    console.log("Sistem teşhisi tamamlandı:", results);
    return results;
  } catch (error) {
    console.error("Sistem teşhisi sırasında hata:", error);
    return {
      success: false,
      error: error.message,
      results,
    };
  }
}

/**
 * YouTube feed'lerini test eder
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} - Test sonuçları
 */
export async function testYoutubeFeeds(userId) {
  try {
    console.log("🔍 YouTube feed'leri test ediliyor...");
    console.log("👤 Kullanıcı ID:", userId);

    const results = {
      timestamp: new Date().toISOString(),
      userId,
      feeds: { success: false },
      youtubeFeedCount: 0,
      youtubeItems: { success: false },
      apiConnection: { success: false },
    };

    // 1. Veritabanı bağlantısı kontrolü
    try {
      const { data } = await dbClient.query("SELECT 1 as test");
      results.dbConnection = {
        success: true,
        message: "Veritabanı bağlantısı başarılı",
      };
    } catch (error) {
      results.dbConnection = { success: false, error: error.message };
      return results;
    }

    // 2. YouTube feed'lerini bul
    try {
      const { data: feeds } = await dbClient.query("feeds", {
        select: "*",
        eq: {
          user_id: userId,
          type: "youtube",
        },
        is: {
          deleted_at: null,
        },
      });

      results.feeds.success = true;
      results.feeds.count = feeds?.length || 0;
      results.feeds.data = feeds?.slice(0, 3) || [];
      results.youtubeFeedCount = feeds?.length || 0;

      if (feeds?.length > 0) {
        console.log(`✅ ${feeds.length} YouTube feed'i bulundu`);

        // 3. Feed'lerin içeriklerini kontrol et
        const feedIds = feeds.map((feed) => feed.id);
        const { data: youtubeItems } = await dbClient.query("youtube_items", {
          select: "*",
          in: {
            feed_id: feedIds,
          },
          limit: 20,
        });

        results.youtubeItems.success = true;
        results.youtubeItems.count = youtubeItems?.length || 0;
        results.youtubeItems.sample = youtubeItems?.slice(0, 3) || [];

        console.log(`✅ ${youtubeItems?.length || 0} YouTube içeriği bulundu`);

        // 4. Her feed için API testi yap
        if (feeds.length > 0) {
          try {
            // İlk feed'i API ile test et
            const testFeed = feeds[0];
            const response = await fetch("/api/youtube-to-rss", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url: testFeed.url }),
            });

            const apiResult = await response.json();
            results.apiConnection.success = true;
            results.apiConnection.data = apiResult;
            console.log("✅ YouTube API bağlantısı başarılı");
          } catch (error) {
            results.apiConnection.success = false;
            results.apiConnection.error = error.message;
            console.error("❌ YouTube API bağlantısı başarısız:", error);
          }
        }
      } else {
        console.log("⚠️ Hiç YouTube feed'i bulunamadı");
      }
    } catch (error) {
      results.feeds.error = error.message;
      console.error("❌ YouTube feed'leri sorgulanırken hata:", error);
    }

    console.log("🏁 YouTube feed testi tamamlandı!");
    return results;
  } catch (error) {
    console.error("❌ YouTube feed testi sırasında hata:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * YouTube feed sorunları için özel tanılama
 * @param {string} feedId - YouTube feed ID
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<Object>} - Tanılama sonuçları
 */
export async function diagnoseYoutubeFeed(feedId, userId) {
  console.log("🔎 YouTube feed tanılama başlatılıyor...");
  console.log(`Feed ID: ${feedId}, User ID: ${userId}`);

  const results = {
    timestamp: new Date().toISOString(),
    feedId,
    userId,
    feed: null,
    rssUrl: null,
    feedParser: null,
    items: null,
    database: null,
    manualSync: null,
  };

  try {
    // 1. Feed bilgilerini kontrol et
    try {
      const { data: feed, error } = await dbClient.query("feeds", {
        select: "*",
        eq: {
          id: feedId,
          user_id: userId,
        },
        single: true,
      });

      if (error) throw error;

      results.feed = {
        success: !!feed,
        data: feed || null,
        error: !feed ? "Feed bulunamadı" : null,
      };

      console.log("✅ Feed bulundu:", feed?.title);

      // Feed türünü kontrol et
      if (feed?.type !== "youtube") {
        results.feed.error = `Feed türü YouTube değil: ${feed?.type}`;
        console.error(`❌ Feed türü YouTube değil: ${feed?.type}`);
      }
    } catch (error) {
      console.error("❌ Feed bilgilerini alırken hata:", error);
      results.feed = {
        success: false,
        error: error.message,
      };
    }

    // Feed bilgileri başarıyla alındıysa devam et
    if (results.feed?.success) {
      const feed = results.feed.data;

      // 2. RSS URL'sini oluştur
      try {
        let rssUrl = feed.url;

        // URL'nin RSS formatında olup olmadığını kontrol et
        if (!rssUrl.includes("feeds/videos.xml")) {
          // Kanal ID'sini al
          let channelId = null;

          if (rssUrl.includes("/channel/")) {
            channelId = rssUrl.split("/channel/")[1]?.split(/[/?#]/)[0];
          } else if (rssUrl.includes("/@")) {
            channelId = rssUrl.split("/@")[1]?.split(/[/?#]/)[0];
          } else if (rssUrl.includes("/user/")) {
            channelId = rssUrl.split("/user/")[1]?.split(/[/?#]/)[0];
          }

          if (channelId) {
            rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          }
        }

        results.rssUrl = {
          success: true,
          url: rssUrl,
        };

        console.log("✅ RSS URL oluşturuldu:", rssUrl);

        // 3. RSS beslemeyi ayrıştırmayı dene
        try {
          const response = await fetch("/api/youtube-to-rss", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: feed.url }),
          });

          const parseResult = await response.json();

          results.feedParser = {
            success: !parseResult.error,
            data: parseResult,
            error: parseResult.error || null,
          };

          if (!parseResult.error) {
            console.log("✅ RSS besleme ayrıştırma başarılı:", parseResult);
          } else {
            console.error(
              "❌ RSS besleme ayrıştırma hatası:",
              parseResult.error
            );
          }
        } catch (error) {
          console.error("❌ RSS besleme ayrıştırma hatası:", error);
          results.feedParser = {
            success: false,
            error: error.message,
          };
        }
      } catch (error) {
        console.error("❌ RSS URL oluşturma hatası:", error);
        results.rssUrl = {
          success: false,
          error: error.message,
        };
      }

      // 4. Veritabanında mevcut öğeleri kontrol et
      try {
        const { data: items, error } = await dbClient.query("youtube_items", {
          select: "id, video_id, title, published_at, created_at",
          eq: {
            feed_id: feedId,
          },
          order: {
            published_at: "desc",
          },
          limit: 10,
        });

        if (error) throw error;

        results.items = {
          success: true,
          count: items?.length || 0,
          items: items || [],
          error: null,
        };

        console.log(
          `✅ Veritabanında ${items?.length || 0} YouTube öğesi bulundu`
        );
      } catch (error) {
        console.error("❌ Veritabanı YouTube öğeleri sorgulama hatası:", error);
        results.items = {
          success: false,
          error: error.message,
        };
      }

      // 5. Manuel bir senkronizasyon dene
      try {
        const response = await fetch("/api/youtube/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedId,
            userId,
          }),
        });

        const syncResult = await response.json();

        results.manualSync = {
          success: syncResult.success,
          data: syncResult,
          error: syncResult.error || null,
        };

        if (syncResult.success) {
          console.log("✅ Manuel senkronizasyon başarılı:", syncResult);
        } else {
          console.error("❌ Manuel senkronizasyon hatası:", syncResult.error);
        }
      } catch (error) {
        console.error("❌ Manuel senkronizasyon hatası:", error);
        results.manualSync = {
          success: false,
          error: error.message,
        };
      }
    }

    console.log("🏁 YouTube feed tanılama tamamlandı!");
    return results;
  } catch (error) {
    console.error("❌ Genel hata:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Debug fonksiyonlarını global olarak erişilebilir yap
// Tarayıcı konsolundan bu fonksiyonlara erişilebilir:
// window.feedDebug.diagnoseSystem('user_id')
if (typeof window !== "undefined") {
  window.feedDebug = {
    checkFeeds,
    checkRssItems,
    checkYoutubeItems,
    checkUserInteractions,
    checkDbConnection,
    checkRepositories,
    clearCaches,
    diagnoseSystem,
    testYoutubeFeeds,
    diagnoseYoutubeFeed,
  };

  console.log(
    "FeedTune Debug Araçları yüklendi. window.feedDebug kullanılabilir."
  );
}

export {
  checkFeeds,
  checkRssItems,
  checkYoutubeItems,
  checkUserInteractions,
  checkDbConnection,
  checkRepositories,
  clearCaches,
  diagnoseSystem,
  testYoutubeFeeds,
  diagnoseYoutubeFeed,
};

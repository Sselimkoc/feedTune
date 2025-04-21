// @ts-check
"use client";

import { enhancedFeedRepository } from "@/repositories/enhancedFeedRepository";
import dbClient from "@/lib/db/index";
import { toast } from "sonner";

/**
 * Veritabanı bağlantısı ve veri erişimini test etmek için yardımcı fonksiyonlar
 */

/**
 * Belirli bir süre bekler
 * @param {number} ms Milisaniye cinsinden bekleme süresi
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hata mesajını güvenli bir şekilde ayıklar
 * @param {any} error Hata nesnesi
 * @returns {string} Hata mesajı
 */
const safeErrorMessage = (error) => {
  if (!error) return "Bilinmeyen hata";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message && typeof error.message === "string") return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Serileştirilemeyen hata nesnesi";
  }
};

/**
 * Veritabanı bağlantısını test eder
 * @param {Object} options Test seçenekleri
 * @param {boolean} [options.useCache=true] Önbellek kullanılsın mı
 * @param {number} [options.timeout=5000] Zaman aşımı süresi (ms)
 * @returns {Promise<Object>} Bağlantı durumu
 */
export async function testDbConnection(options = {}) {
  const { useCache = true, timeout = 5000 } = options;
  const startTime = Date.now();

  try {
    console.log("Veritabanı bağlantısı test ediliyor...");

    // Zamanaşımı kontrolü için yarış durumu oluştur
    const timeoutPromise = wait(timeout).then(() => {
      throw new Error(`Veritabanı sorgusu ${timeout}ms içinde tamamlanamadı`);
    });

    // Basit bir sorgu çalıştırarak veritabanı bağlantısını kontrol et
    const queryPromise = dbClient.query(
      "feeds",
      {},
      useCache // Önbellek kullan
    );

    // Hangisi önce tamamlanırsa onu al
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise.then(() => ({})),
    ]);

    if (error) {
      throw new Error(`Veritabanı sorgu hatası: ${safeErrorMessage(error)}`);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      success: true,
      message: "Veritabanı bağlantısı başarılı!",
      timestamp: new Date().toISOString(),
      responseTime,
      cacheUsed: useCache,
      recordCount: Array.isArray(data) ? data.length : 0,
    };
  } catch (error) {
    console.error("Veritabanı bağlantı hatası:", error);
    const endTime = Date.now();

    return {
      success: false,
      message: `Veritabanı bağlantı hatası: ${safeErrorMessage(error)}`,
      error: safeErrorMessage(error),
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
    };
  }
}

/**
 * Kullanıcının besleme aboneliklerini test eder
 * @param {string} userId Kullanıcı ID'si
 * @param {Object} options Test seçenekleri
 * @param {boolean} [options.useCache=true] Önbellek kullanılsın mı
 * @param {number} [options.limit=100] Maksimum feed sayısı
 * @returns {Promise<Object>} Feed testi sonuçları
 */
export async function testUserFeeds(userId, options = {}) {
  const { useCache = true, limit = 100 } = options;
  const startTime = Date.now();

  if (!userId) {
    return {
      success: false,
      message: "Kullanıcı ID'si gerekli",
      error: "Kullanıcı ID'si bulunamadı",
      timestamp: new Date().toISOString(),
      responseTime: 0,
      cacheUsed: useCache,
    };
  }

  try {
    console.log(`${userId} kullanıcısının beslemeleri test ediliyor...`);

    // Beslemeleri getir
    const { data, error } = await dbClient.query(
      "feeds",
      {
        eq: {
          user_id: userId,
        },
        is: {
          deleted_at: null,
        },
      },
      useCache,
      { limit }
    );

    if (error) {
      throw new Error(`Feed sorgusu hatası: ${safeErrorMessage(error)}`);
    }

    // Sorgu sonucunu kontrol et ve güvenle işle
    const feeds = Array.isArray(data) ? data : [];
    const endTime = Date.now();

    // Feed tiplerini say
    const feedTypes = feeds.reduce((acc, feed) => {
      if (!feed || !feed.type) return acc;
      acc[feed.type] = (acc[feed.type] || 0) + 1;
      return acc;
    }, {});

    // Feed sayısını ve temel bilgileri döndür
    return {
      success: true,
      message: `${feeds.length} besleme bulundu`,
      count: feeds.length,
      types: feedTypes,
      data: feeds,
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
      limitApplied: limit,
    };
  } catch (error) {
    console.error("Feed testi hatası:", error);
    const endTime = Date.now();

    return {
      success: false,
      message: `Feed testi hatası: ${safeErrorMessage(error)}`,
      error: safeErrorMessage(error),
      count: 0,
      types: {},
      data: [], // Boş dizi döndür ki tüketici kodlar güvenle çalışabilsin
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
    };
  }
}

/**
 * Feed içeriklerini test eder (RSS ve YouTube)
 * @param {Array<string>} feedIds Feed ID'leri
 * @param {Object} options Test seçenekleri
 * @param {boolean} [options.useCache=true] Önbellek kullanılsın mı
 * @param {number} [options.limit=100] Maksimum öğe sayısı
 * @returns {Promise<Object>} İçerik testi sonuçları
 */
export async function testFeedItems(feedIds, options = {}) {
  const { useCache = true, limit = 100 } = options;
  const startTime = Date.now();

  if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
    return {
      success: false,
      message: "Geçerli feed ID'leri gerekli",
      error: "Feed ID'leri bulunamadı veya boş dizi",
      timestamp: new Date().toISOString(),
      responseTime: 0,
      cacheUsed: useCache,
    };
  }

  try {
    console.log(`${feedIds.length} feed için içerikler test ediliyor...`);

    // RSS ve YouTube feed'lerini ayır
    const { data: feedsData, error: feedsError } = await dbClient.query(
      "feeds",
      {
        in: {
          id: feedIds,
        },
        is: {
          deleted_at: null,
        },
      },
      useCache
    );

    if (feedsError) {
      throw new Error(`Feed sorgusu hatası: ${safeErrorMessage(feedsError)}`);
    }

    // Veriyi güvenli şekilde kontrol et
    const feeds = Array.isArray(feedsData) ? feedsData : [];

    const rssFeeds = feeds
      .filter((feed) => feed && (feed.type === "rss" || feed.type === "atom"))
      .map((feed) => feed.id);

    const youtubeFeeds = feeds
      .filter((feed) => feed && feed.type === "youtube")
      .map((feed) => feed.id);

    // RSS öğelerini getir
    let rssItems = [];
    let rssError = null;
    if (rssFeeds.length > 0) {
      const { data: rssData, error: rssQueryError } = await dbClient.query(
        "rss_items",
        {
          feed_id: { in: rssFeeds },
        },
        useCache,
        { limit }
      );

      if (rssQueryError) {
        console.error("RSS sorgu hatası:", rssQueryError);
        rssError = safeErrorMessage(rssQueryError);
      } else {
        rssItems = Array.isArray(rssData) ? rssData : [];
      }
    }

    // YouTube öğelerini getir
    let youtubeItems = [];
    let youtubeError = null;
    if (youtubeFeeds.length > 0) {
      const { data: ytData, error: ytQueryError } = await dbClient.query(
        "youtube_items",
        {
          feed_id: { in: youtubeFeeds },
        },
        useCache,
        { limit }
      );

      if (ytQueryError) {
        console.error("YouTube sorgu hatası:", ytQueryError);
        youtubeError = safeErrorMessage(ytQueryError);
      } else {
        youtubeItems = Array.isArray(ytData) ? ytData : [];
      }
    }

    const endTime = Date.now();

    // Zaman bilgisi analizi
    const rssDateDistribution = analyzeTimestamps(rssItems, "published_at");
    const ytDateDistribution = analyzeTimestamps(youtubeItems, "published_at");

    // Sonuçları döndür
    return {
      success: true,
      message: `${rssItems.length} RSS ve ${youtubeItems.length} YouTube öğesi bulundu`,
      data: {
        rss: rssItems,
        youtube: youtubeItems,
      },
      stats: {
        rssCount: rssItems.length,
        youtubeCount: youtubeItems.length,
        rssFeeds: rssFeeds.length,
        youtubeFeeds: youtubeFeeds.length,
        rssDateDistribution,
        ytDateDistribution,
      },
      errors: {
        rss: rssError,
        youtube: youtubeError,
      },
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
      limitApplied: limit,
    };
  } catch (error) {
    console.error("İçerik testi hatası:", error);
    const endTime = Date.now();

    return {
      success: false,
      message: `İçerik testi hatası: ${safeErrorMessage(error)}`,
      error: safeErrorMessage(error),
      data: { rss: [], youtube: [] },
      stats: {
        rssCount: 0,
        youtubeCount: 0,
        rssFeeds: 0,
        youtubeFeeds: 0,
        rssDateDistribution: {},
        ytDateDistribution: {},
      },
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
    };
  }
}

/**
 * Kullanıcı etkileşimlerini test eder
 * @param {string} userId Kullanıcı ID'si
 * @param {Object} options Test seçenekleri
 * @param {boolean} [options.useCache=true] Önbellek kullanılsın mı
 * @param {number} [options.limit=200] Maksimum etkileşim sayısı
 * @returns {Promise<Object>} Etkileşim testi sonuçları
 */
export async function testUserInteractions(userId, options = {}) {
  const { useCache = true, limit = 200 } = options;
  const startTime = Date.now();

  if (!userId) {
    return {
      success: false,
      message: "Kullanıcı ID'si gerekli",
      error: "Kullanıcı ID'si bulunamadı",
      timestamp: new Date().toISOString(),
      responseTime: 0,
      cacheUsed: useCache,
    };
  }

  try {
    console.log(`${userId} kullanıcısının etkileşimleri test ediliyor...`);

    // Kullanıcının tüm etkileşimlerini getir
    const { data, error } = await dbClient.query(
      "user_interaction",
      { user_id: userId },
      useCache,
      { limit }
    );

    if (error) {
      throw new Error(`Etkileşim sorgusu hatası: ${safeErrorMessage(error)}`);
    }

    // Veriyi güvenle işle
    const interactions = Array.isArray(data) ? data : [];
    const endTime = Date.now();

    // Farklı etkileşim türlerini say
    const favorites = interactions.filter((i) => i && i.is_favorite).length;
    const readLater = interactions.filter((i) => i && i.is_read_later).length;
    const read = interactions.filter((i) => i && i.is_read).length;

    // Etkileşim zaman analizi
    const updatedAtDistribution = analyzeTimestamps(interactions, "updated_at");
    const createdAtDistribution = analyzeTimestamps(interactions, "created_at");

    // Sonuçları döndür
    return {
      success: true,
      message: `${interactions.length} etkileşim bulundu (${favorites} favori, ${readLater} sonra oku, ${read} okundu)`,
      data: {
        total: interactions.length,
        favorites,
        readLater,
        read,
        interactions,
        updatedAtDistribution,
        createdAtDistribution,
      },
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
      limitApplied: limit,
    };
  } catch (error) {
    console.error("Etkileşim testi hatası:", error);
    const endTime = Date.now();

    return {
      success: false,
      message: `Etkileşim testi hatası: ${safeErrorMessage(error)}`,
      error: safeErrorMessage(error),
      data: {
        total: 0,
        favorites: 0,
        readLater: 0,
        read: 0,
        interactions: [],
        updatedAtDistribution: {},
        createdAtDistribution: {},
      },
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      cacheUsed: useCache,
    };
  }
}

/**
 * DbClient önbelleğini kontrol eder
 * @returns {Promise<Object>} Önbellek durumu
 */
export async function testDbCache() {
  try {
    const startTime = Date.now();
    console.log("DbClient önbelleği test ediliyor...");

    // DbClient'in önbellek bilgisini al
    const cacheStats = dbClient.getCacheStats ? dbClient.getCacheStats() : null;

    // Önbellekli ve önbelleksiz sorgu karşılaştırması
    const withCachePromise = testDbConnection({ useCache: true });
    const noCachePromise = testDbConnection({ useCache: false });

    const [withCache, noCache] = await Promise.all([
      withCachePromise,
      noCachePromise,
    ]);

    const endTime = Date.now();

    return {
      success: true,
      message: "Önbellek testi tamamlandı",
      cacheStats: cacheStats || {
        warning: "getCacheStats metodu mevcut değil",
      },
      comparison: {
        withCache,
        noCache,
        timeDifference: withCache.responseTime - noCache.responseTime,
      },
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
    };
  } catch (error) {
    console.error("Önbellek testi hatası:", error);
    return {
      success: false,
      message: `Önbellek testi hatası: ${safeErrorMessage(error)}`,
      error: safeErrorMessage(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Zaman damgalarını analiz eder ve dağılımını çıkarır
 * @param {Array<Object>} items Öğe listesi
 * @param {string} timestampField Zaman damgası alanı
 * @returns {Object} Zaman dağılımı
 */
function analyzeTimestamps(items, timestampField) {
  if (!Array.isArray(items) || items.length === 0) return { empty: true };

  try {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const result = {
      lastDay: 0,
      lastWeek: 0,
      lastMonth: 0,
      older: 0,
      future: 0,
      invalid: 0,
      newest: null,
      oldest: null,
    };

    items.forEach((item) => {
      if (!item || !item[timestampField]) {
        result.invalid++;
        return;
      }

      try {
        const timestamp = new Date(item[timestampField]);
        const timeDiff = now - timestamp;

        // En yeni ve en eski kayıtları belirle
        if (!result.newest || timestamp > new Date(result.newest)) {
          result.newest = timestamp.toISOString();
        }

        if (!result.oldest || timestamp < new Date(result.oldest)) {
          result.oldest = timestamp.toISOString();
        }

        // Zaman aralıklarına göre sınıflandır
        if (isNaN(timeDiff)) {
          result.invalid++;
        } else if (timeDiff < 0) {
          result.future++;
        } else if (timeDiff < oneDay) {
          result.lastDay++;
        } else if (timeDiff < oneWeek) {
          result.lastWeek++;
        } else if (timeDiff < oneMonth) {
          result.lastMonth++;
        } else {
          result.older++;
        }
      } catch (e) {
        result.invalid++;
      }
    });

    return result;
  } catch (error) {
    console.error("Zaman damgası analiz hatası:", error);
    return { error: safeErrorMessage(error) };
  }
}

/**
 * Tüm testleri sırayla çalıştırır
 * @param {string} userId Kullanıcı ID'si
 * @param {Object} options Test seçenekleri
 * @param {boolean} [options.useCache=true] Önbellek kullanılsın mı
 * @param {boolean} [options.showToast=true] Toast bildirimleri gösterilsin mi
 * @returns {Promise<Object>} Tüm test sonuçları
 */
export async function runAllTests(userId, options = {}) {
  const { useCache = true, showToast = true } = options;
  const startTime = Date.now();

  try {
    console.log("Tüm testler çalıştırılıyor...");

    const testResults = {
      timestamp: new Date().toISOString(),
      testStartTime: startTime,
    };

    // 1. Veritabanı bağlantısını test et
    testResults.connection = await testDbConnection({ useCache });
    if (!testResults.connection.success) {
      if (showToast) toast.error("Veritabanı bağlantı hatası!");
      testResults.error =
        "Veritabanı bağlantısı kurulamadı, diğer testler atlandı.";
      testResults.testEndTime = Date.now();
      testResults.totalDuration = testResults.testEndTime - startTime;
      return testResults;
    }

    // 2. Önbellek durumunu kontrol et
    testResults.cache = await testDbCache();
    if (!testResults.cache.success && showToast) {
      toast.warning("Önbellek testi tamamlanamadı");
    }

    // 3. Besleme testleri
    if (userId) {
      testResults.feeds = await testUserFeeds(userId, { useCache });
      if (!testResults.feeds.success && showToast) {
        toast.error("Feed testi başarısız!");
      }
    }

    // 4. Feed içerik testleri
    if (
      testResults.feeds &&
      testResults.feeds.success &&
      testResults.feeds.data &&
      testResults.feeds.data.length > 0
    ) {
      const feedIds = testResults.feeds.data.map((feed) => feed.id);
      testResults.items = await testFeedItems(feedIds, { useCache });
      if (!testResults.items.success && showToast) {
        toast.error("İçerik testi başarısız!");
      }
    }

    // 5. Kullanıcı etkileşim testleri
    if (userId) {
      testResults.interactions = await testUserInteractions(userId, {
        useCache,
      });
      if (!testResults.interactions.success && showToast) {
        toast.error("Etkileşim testi başarısız!");
      }
    }

    // Test süresini ölç
    testResults.testEndTime = Date.now();
    testResults.totalDuration = testResults.testEndTime - startTime;

    // Özet sonuç ekle
    const isAllSuccess = Object.values(testResults)
      .filter((v) => v && typeof v === "object" && "success" in v)
      .every((v) => v.success);

    testResults.summary = {
      success: isAllSuccess,
      message: isAllSuccess
        ? "Tüm testler başarıyla tamamlandı"
        : "Bazı testler başarısız oldu",
      totalTests: Object.values(testResults).filter(
        (v) => v && typeof v === "object" && "success" in v
      ).length,
      failedTests: Object.values(testResults).filter(
        (v) => v && typeof v === "object" && "success" in v && !v.success
      ).length,
    };

    if (showToast) {
      if (isAllSuccess) {
        toast.success("Tüm sistem testleri başarılı!");
      } else {
        toast.warning("Bazı testler başarısız oldu, sonuçları kontrol edin.");
      }
    }

    return testResults;
  } catch (error) {
    console.error("Test hatası:", error);
    if (showToast) toast.error("Testler çalıştırılırken hata oluştu!");

    const endTime = Date.now();
    return {
      error: safeErrorMessage(error),
      timestamp: new Date().toISOString(),
      testStartTime: startTime,
      testEndTime: endTime,
      totalDuration: endTime - startTime,
    };
  }
}

/**
 * Önbelleği temizler
 * @returns {Promise<Object>} Temizleme sonucu
 */
export async function clearCache() {
  try {
    console.log("Önbellek temizleniyor...");

    // DbClient'in önbellek temizleme metodunu çağır (varsa)
    if (dbClient.clearCache) {
      await dbClient.clearCache();
      toast.success("Önbellek başarıyla temizlendi");
      return {
        success: true,
        message: "Önbellek başarıyla temizlendi",
        timestamp: new Date().toISOString(),
      };
    } else {
      toast.warning("Önbellek temizleme metodu bulunamadı");
      return {
        success: false,
        message: "DbClient'da clearCache metodu bulunamadı",
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("Önbellek temizleme hatası:", error);
    toast.error("Önbellek temizlenirken hata oluştu");
    return {
      success: false,
      message: `Önbellek temizleme hatası: ${safeErrorMessage(error)}`,
      error: safeErrorMessage(error),
      timestamp: new Date().toISOString(),
    };
  }
}

// Global erişim için window nesnesine ekle (geliştirme ortamında kullanım için)
if (typeof window !== "undefined") {
  window.dbTests = {
    testDbConnection,
    testUserFeeds,
    testFeedItems,
    testUserInteractions,
    testDbCache,
    runAllTests,
    clearCache,
    _utils: {
      safeErrorMessage,
      analyzeTimestamps,
      wait,
    },
  };
}

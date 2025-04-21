/**
 * FeedTune Debug ve Tanılama Yardımcıları
 *
 * Bu dosya, veri akışı sorunlarını teşhis etmek için kullanılabilecek
 * yardımcı fonksiyonlar içerir. Yalnızca geliştirme ortamında kullanılmak
 * içindir ve production ortamında devre dışı kalır.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Singleton bir sınıf oluştur
class DebugHelper {
  constructor() {
    // Geliştirme ortamında değilse, tüm metodlar boş işlev döndürsün
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "development"
    ) {
      return {
        initialize: () => {},
        checkDbConnection: () => {},
        getCurrentUserInfo: () => {},
        checkFeeds: () => {},
        checkFeedItems: () => {},
        diagnoseAll: () => {},
        clearAllCache: () => {},
      };
    }

    this.supabase = createClientComponentClient();
    this.initialized = false;
    this.initResults = {};
    this.user = null;
  }

  /**
   * Yardımcı sınıfı başlat ve temel durumu kontrol et
   */
  async initialize() {
    try {
      console.log("🔍 FeedTune Debug Helper başlatılıyor...");

      // Kullanıcı oturumunu kontrol et
      const { data } = await this.supabase.auth.getUser();
      this.user = data?.user || null;

      this.initResults = {
        timestamp: new Date().toISOString(),
        user: this.user
          ? {
              id: this.user.id,
              email: this.user.email,
              lastSignIn: this.user.last_sign_in_at,
            }
          : null,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          localStorage: !!window.localStorage,
          indexedDB: !!window.indexedDB,
        },
      };

      this.initialized = true;
      console.log("✅ Debug Helper başlatıldı:", this.initResults);
      return this.initResults;
    } catch (error) {
      console.error("❌ Debug Helper başlatma hatası:", error);
      return { error: error.message };
    }
  }

  /**
   * Veritabanı bağlantısını test et
   */
  async checkDbConnection() {
    try {
      console.log("🔍 Veritabanı bağlantısı test ediliyor...");

      // Basit bir sorgu çalıştır
      const { data, error } = await this.supabase
        .from("feeds")
        .select("count(*)", { count: "exact", head: true });

      if (error) throw error;

      return {
        success: true,
        message: "Veritabanı bağlantısı başarılı",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Veritabanı bağlantı hatası:", error);
      return {
        success: false,
        message: `Veritabanı bağlantı hatası: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Mevcut kullanıcı bilgilerini al
   */
  async getCurrentUserInfo() {
    if (!this.initialized) await this.initialize();

    if (!this.user) {
      return {
        success: false,
        message: "Oturum açılmamış",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      user: {
        id: this.user.id,
        email: this.user.email,
        lastSignIn: this.user.last_sign_in_at,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Kullanıcının besleme aboneliklerini kontrol et
   */
  async checkFeeds(userId = null) {
    try {
      if (!this.initialized) await this.initialize();
      const userToCheck = userId || this.user?.id;

      if (!userToCheck) {
        return {
          success: false,
          message: "Kontrol edilecek kullanıcı ID'si yok",
          timestamp: new Date().toISOString(),
        };
      }

      console.log(`🔍 ${userToCheck} için beslemeler kontrol ediliyor...`);

      const { data, error } = await this.supabase
        .from("feeds")
        .select("id, title, url, type, created_at")
        .eq("user_id", userToCheck)
        .is("deleted_at", null);

      if (error) throw error;

      // Veri boş veya undefined ise güvenli bir şekilde işle
      const feeds = Array.isArray(data) ? data : [];

      // Feed türlerini ayır
      const rssFeeds = feeds.filter(
        (f) => f && (f.type === "rss" || f.type === "atom")
      );
      const youtubeFeeds = feeds.filter((f) => f && f.type === "youtube");

      return {
        success: true,
        message: `${feeds.length} besleme bulundu (${rssFeeds.length} RSS, ${youtubeFeeds.length} YouTube)`,
        feeds: {
          total: feeds.length,
          rss: rssFeeds.length,
          youtube: youtubeFeeds.length,
          items: feeds.slice(0, 5), // İlk 5 beslemeyi göster
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Feed kontrol hatası:", error);
      return {
        success: false,
        message: `Feed kontrol hatası: ${error.message}`,
        error: error.message,
        feeds: { total: 0, rss: 0, youtube: 0, items: [] }, // Boş veri yapıları döndür
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Besleme içeriklerini kontrol et
   */
  async checkFeedItems(feedIds = []) {
    try {
      if (!this.initialized) await this.initialize();

      // feedIds verilmediyse, kullanıcının tüm beslemelerini kontrol et
      if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
        const userFeeds = await this.checkFeeds();
        if (
          !userFeeds.success ||
          !userFeeds.feeds ||
          !userFeeds.feeds.items ||
          !userFeeds.feeds.items.length
        ) {
          return {
            success: false,
            message: "Kontrol edilecek besleme yok",
            items: {
              rssCount: 0,
              youtubeCount: 0,
              rssItems: [],
              youtubeItems: [],
            },
            timestamp: new Date().toISOString(),
          };
        }

        feedIds = userFeeds.feeds.items.map((feed) => feed.id).filter(Boolean);

        if (feedIds.length === 0) {
          return {
            success: false,
            message: "Geçerli feed ID'si bulunamadı",
            items: {
              rssCount: 0,
              youtubeCount: 0,
              rssItems: [],
              youtubeItems: [],
            },
            timestamp: new Date().toISOString(),
          };
        }
      }

      console.log(
        `🔍 ${feedIds.length} besleme için içerikler kontrol ediliyor...`
      );

      // Beslemeleri tipine göre ayır
      const { data, error } = await this.supabase
        .from("feeds")
        .select("id, type")
        .in("id", feedIds);

      if (error) throw error;

      const feeds = Array.isArray(data) ? data : [];

      const rssIds = feeds
        .filter((feed) => feed && (feed.type === "rss" || feed.type === "atom"))
        .map((feed) => feed.id)
        .filter(Boolean);

      const youtubeIds = feeds
        .filter((feed) => feed && feed.type === "youtube")
        .map((feed) => feed.id)
        .filter(Boolean);

      // RSS içeriklerini kontrol et
      let rssItems = [];
      if (rssIds.length > 0) {
        const { data: rssData, error: rssError } = await this.supabase
          .from("rss_items")
          .select("id, title, feed_id, published_at")
          .in("feed_id", rssIds)
          .order("published_at", { ascending: false })
          .limit(20);

        if (rssError) {
          console.error("RSS sorgu hatası:", rssError);
        } else {
          rssItems = Array.isArray(rssData) ? rssData : [];
        }
      }

      // YouTube içeriklerini kontrol et
      let youtubeItems = [];
      if (youtubeIds.length > 0) {
        const { data: ytData, error: ytError } = await this.supabase
          .from("youtube_items")
          .select("id, title, feed_id, published_at")
          .in("feed_id", youtubeIds)
          .order("published_at", { ascending: false })
          .limit(20);

        if (ytError) {
          console.error("YouTube sorgu hatası:", ytError);
        } else {
          youtubeItems = Array.isArray(ytData) ? ytData : [];
        }
      }

      return {
        success: true,
        message: `${rssItems.length} RSS öğesi ve ${youtubeItems.length} YouTube öğesi bulundu`,
        items: {
          rssCount: rssItems.length,
          youtubeCount: youtubeItems.length,
          rssItems: rssItems.slice(0, 5), // İlk 5 RSS öğesini göster
          youtubeItems: youtubeItems.slice(0, 5), // İlk 5 YouTube öğesini göster
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ İçerik kontrol hatası:", error);
      return {
        success: false,
        message: `İçerik kontrol hatası: ${error.message}`,
        error: error.message,
        items: { rssCount: 0, youtubeCount: 0, rssItems: [], youtubeItems: [] },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Tüm tanılama işlemlerini çalıştır
   */
  async diagnoseAll() {
    try {
      console.log("🔍 Tam tanılama başlatılıyor...");

      // Tüm tanılama adımlarını sırayla çalıştır
      const results = {
        timestamp: new Date().toISOString(),
        initialization: await this.initialize(),
        dbConnection: await this.checkDbConnection(),
      };

      // Kullanıcı varsa, feed ve içerik testleri yap
      if (this.user) {
        results.userInfo = await this.getCurrentUserInfo();
        results.feeds = await this.checkFeeds();

        if (
          results.feeds &&
          results.feeds.success &&
          results.feeds.feeds &&
          results.feeds.feeds.total > 0
        ) {
          results.feedItems = await this.checkFeedItems();
        } else {
          results.feedItems = {
            success: false,
            message: "Feed'ler bulunamadığı için içerik testi atlandı",
            items: {
              rssCount: 0,
              youtubeCount: 0,
              rssItems: [],
              youtubeItems: [],
            },
          };
        }
      } else {
        results.userInfo = {
          success: false,
          message: "Oturum açılmamış, kullanıcı testleri atlandı",
        };
      }

      // Yerel depo durumunu kontrol et
      try {
        const feedCache = this.getLocalCacheInfo();
        if (feedCache) {
          results.localCache = feedCache;
        }
      } catch (err) {
        results.localCache = {
          success: false,
          message: "Yerel önbellek kontrolü başarısız: " + err.message,
        };
      }

      console.log("✅ Tanılama tamamlandı:", results);
      return results;
    } catch (error) {
      console.error("❌ Tanılama hatası:", error);
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Tüm önbellekleri temizle
   */
  clearAllCache() {
    try {
      console.log("🧹 Tüm önbellekler temizleniyor...");

      // Yerel depolama önbelleğini temizle
      try {
        localStorage.removeItem("feed-cache");
      } catch (err) {
        console.error("Yerel önbellek temizleme hatası:", err);
      }

      // Diğer önbellekleri temizle
      if (this.user) {
        // Kullanıcı oturumunu yenile
        try {
          this.supabase.auth.refreshSession();
        } catch (err) {
          console.error("Oturum yenileme hatası:", err);
        }
      }

      console.log("✅ Önbellekler temizlendi");
      return {
        success: true,
        message: "Tüm önbellekler temizlendi",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Önbellek temizleme hatası:", error);
      return {
        success: false,
        message: `Önbellek temizleme hatası: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Yerel önbellek bilgilerini al
   */
  getLocalCacheInfo() {
    try {
      let feedCache = null;
      try {
        feedCache = localStorage.getItem("feed-cache");
      } catch (err) {
        console.error("Yerel depolama erişim hatası:", err);
        return {
          success: false,
          message: "Yerel depolama erişim hatası: " + err.message,
        };
      }

      if (!feedCache) return null;

      let cacheData;
      try {
        cacheData = JSON.parse(feedCache);
      } catch (e) {
        return {
          success: false,
          message: "Önbellek JSON ayrıştırma hatası",
          size: `${Math.round(feedCache.length / 1024)} KB`,
        };
      }

      return {
        success: true,
        size: `${Math.round(feedCache.length / 1024)} KB`,
        feeds: Array.isArray(cacheData.feeds) ? cacheData.feeds.length : 0,
        items: Array.isArray(cacheData.items) ? cacheData.items.length : 0,
        timestamp: cacheData.timestamp || "bilinmiyor",
      };
    } catch (error) {
      console.error("❌ Önbellek bilgisi hatası:", error);
      return {
        success: false,
        message: "Önbellek bilgisi alınamadı: " + error.message,
      };
    }
  }
}

// Singleton örneği oluştur
const debugHelper = new DebugHelper();

// Tarayıcı ortamında global nesne olarak ekle
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.debugHelper = debugHelper;

  // Otomatik başlat
  debugHelper
    .initialize()
    .catch((err) =>
      console.error("Debug helper otomatik başlatma hatası:", err)
    );

  console.log(
    "🛠️ FeedTune Debug Helper yüklendi! Konsolda 'window.debugHelper' olarak kullanılabilir."
  );
}

export default debugHelper;

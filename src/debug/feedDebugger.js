"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FeedRepository } from "@/repositories/feedRepository";
import { feedService } from "@/services/feedService";

/**
 * Feed sistemini debugging için yardımcı fonksiyonlar
 * Bu fonksiyonlar sadece geliştirme amaçlıdır ve tarayıcı konsolundan çağrılabilir
 */
class FeedDebugger {
  constructor() {
    this.supabase = createClientComponentClient();
    this.repository = new FeedRepository();
    this.service = feedService;
  }

  /**
   * Mevcut oturum açmış kullanıcının ID'sini alır
   */
  async getCurrentUserId() {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return data?.session?.user?.id || null;
    } catch (error) {
      console.error("Kullanıcı ID'si alınamadı:", error);
      return null;
    }
  }

  /**
   * Veritabanı bağlantısını test eder
   */
  async testDbConnection() {
    try {
      const { data, error } = await this.supabase
        .from("feeds")
        .select("id")
        .limit(1);
      if (error) throw error;
      console.log("Veritabanı bağlantısı başarılı:", data);
      return true;
    } catch (error) {
      console.error("Veritabanı bağlantı hatası:", error);
      return false;
    }
  }

  /**
   * Veritabanından doğrudan besleme kayıtlarını getirir
   */
  async getDirectFeeds(userId) {
    if (!userId) {
      userId = await this.getCurrentUserId();
      if (!userId) {
        console.error("Kullanıcı ID'si bulunamadı, lütfen oturum açın");
        return null;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from("feeds")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (error) throw error;
      console.log(
        `Kullanıcı (${userId}) için ${data.length} besleme bulundu:`,
        data
      );
      return data;
    } catch (error) {
      console.error("Besleme verilerini alma hatası:", error);
      return null;
    }
  }

  /**
   * RSS içerik öğelerini doğrudan veritabanından getirir
   */
  async getDirectRssItems(feedIds) {
    try {
      if (!feedIds || !feedIds.length) {
        console.error("Feed ID'leri gereklidir");
        return null;
      }

      const { data, error } = await this.supabase
        .from("rss_items")
        .select("*")
        .in("feed_id", feedIds)
        .limit(100);

      if (error) throw error;
      console.log(`${data.length} RSS öğesi bulundu:`, data);
      return data;
    } catch (error) {
      console.error("RSS öğelerini alma hatası:", error);
      return null;
    }
  }

  /**
   * YouTube içerik öğelerini doğrudan veritabanından getirir
   */
  async getDirectYoutubeItems(feedIds) {
    try {
      if (!feedIds || !feedIds.length) {
        console.error("Feed ID'leri gereklidir");
        return null;
      }

      const { data, error } = await this.supabase
        .from("youtube_items")
        .select("*")
        .in("feed_id", feedIds)
        .limit(100);

      if (error) throw error;
      console.log(`${data.length} YouTube öğesi bulundu:`, data);
      return data;
    } catch (error) {
      console.error("YouTube öğelerini alma hatası:", error);
      return null;
    }
  }

  /**
   * Kullanıcı etkileşimlerini doğrudan veritabanından getirir
   */
  async getDirectUserInteractions(userId) {
    if (!userId) {
      userId = await this.getCurrentUserId();
      if (!userId) {
        console.error("Kullanıcı ID'si bulunamadı, lütfen oturum açın");
        return null;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from("user_interaction")
        .select("*")
        .eq("user_id", userId)
        .limit(100);

      if (error) throw error;
      console.log(
        `Kullanıcı (${userId}) için ${data.length} etkileşim bulundu:`,
        data
      );
      return data;
    } catch (error) {
      console.error("Kullanıcı etkileşimlerini alma hatası:", error);
      return null;
    }
  }

  /**
   * Repository katmanını kullanarak beslemeleri getirir
   */
  async getRepositoryFeeds(userId) {
    if (!userId) {
      userId = await this.getCurrentUserId();
      if (!userId) {
        console.error("Kullanıcı ID'si bulunamadı, lütfen oturum açın");
        return null;
      }
    }

    try {
      console.log(
        `Repository ile ${userId} kullanıcısının beslemelerini getiriyorum...`
      );
      const feeds = await this.repository.getFeeds(userId);
      console.log(`Repository: ${feeds.length} besleme bulundu:`, feeds);
      return feeds;
    } catch (error) {
      console.error("Repository ile beslemeleri alma hatası:", error);
      return null;
    }
  }

  /**
   * Repository katmanını kullanarak besleme öğelerini getirir
   */
  async getRepositoryFeedItems(feedIds, userId) {
    if (!feedIds || !feedIds.length) {
      console.error("Feed ID'leri gereklidir");
      return null;
    }

    if (!userId) {
      userId = await this.getCurrentUserId();
    }

    try {
      console.log(`Repository ile besleme öğelerini getiriyorum...`);
      const items = await this.repository.getFeedItems(feedIds, 100, userId);
      console.log(`Repository: ${items.length} öğe bulundu:`, items);
      return items;
    } catch (error) {
      console.error("Repository ile besleme öğelerini alma hatası:", error);
      return null;
    }
  }

  /**
   * Service katmanını kullanarak beslemeleri getirir
   */
  async getServiceFeeds(userId) {
    if (!userId) {
      userId = await this.getCurrentUserId();
      if (!userId) {
        console.error("Kullanıcı ID'si bulunamadı, lütfen oturum açın");
        return null;
      }
    }

    try {
      console.log(
        `Service ile ${userId} kullanıcısının beslemelerini getiriyorum...`
      );
      const feeds = await this.service.getFeeds(userId);
      console.log(`Service: ${feeds.length} besleme bulundu:`, feeds);
      return feeds;
    } catch (error) {
      console.error("Service ile beslemeleri alma hatası:", error);
      return null;
    }
  }

  /**
   * Service katmanını kullanarak besleme öğelerini getirir
   */
  async getServiceFeedItems(feedIds, userId) {
    if (!userId) {
      userId = await this.getCurrentUserId();
      if (!userId) {
        console.error("Kullanıcı ID'si bulunamadı, lütfen oturum açın");
        return null;
      }
    }

    try {
      console.log(`Service ile besleme öğelerini getiriyorum...`);
      const items = await this.service.getFeedItems(feedIds, 100, userId);
      console.log(`Service: ${items.length} öğe bulundu:`, items);
      return items;
    } catch (error) {
      console.error("Service ile besleme öğelerini alma hatası:", error);
      return null;
    }
  }

  /**
   * Tüm katmanlarda test yaparak sorunlu katmanı bulur
   */
  async diagnoseFullSystem() {
    console.group("🔍 Feed Sistemi Tanılama Başlıyor");
    console.log("Tanılama tarihi:", new Date().toISOString());

    // 1. Veritabanı bağlantısını kontrol et
    console.log("1. Veritabanı bağlantısı kontrol ediliyor...");
    const dbConnected = await this.testDbConnection();
    console.log(
      `Veritabanı bağlantısı: ${dbConnected ? "✅ Başarılı" : "❌ Başarısız"}`
    );

    if (!dbConnected) {
      console.error(
        "❌ Veritabanı bağlantısı kurulamadı, diğer testler atlanıyor"
      );
      console.groupEnd();
      return;
    }

    // 2. Kullanıcı bilgisini kontrol et
    console.log("2. Kullanıcı bilgisi kontrol ediliyor...");
    const userId = await this.getCurrentUserId();
    console.log(
      `Kullanıcı ID: ${userId ? `✅ Bulundu (${userId})` : "❌ Bulunamadı"}`
    );

    if (!userId) {
      console.error("❌ Kullanıcı ID'si bulunamadı, diğer testler atlanıyor");
      console.groupEnd();
      return;
    }

    // 3. Doğrudan veritabanından beslemeleri getir
    console.log("3. Veritabanından besleme kayıtları kontrol ediliyor...");
    const directFeeds = await this.getDirectFeeds(userId);
    console.log(
      `Doğrudan veritabanından besleme kayıtları: ${
        directFeeds?.length
          ? `✅ Bulundu (${directFeeds.length})`
          : "❌ Bulunamadı"
      }`
    );

    if (!directFeeds?.length) {
      console.error("❌ Besleme kaydı bulunamadı, lütfen önce besleme ekleyin");
      console.groupEnd();
      return;
    }

    const feedIds = directFeeds.map((feed) => feed.id);

    // 4. Doğrudan veritabanından RSS öğelerini getir
    console.log("4. Veritabanından RSS öğeleri kontrol ediliyor...");
    const directRssItems = await this.getDirectRssItems(feedIds);
    console.log(
      `Doğrudan veritabanından RSS öğeleri: ${
        directRssItems?.length
          ? `✅ Bulundu (${directRssItems.length})`
          : "❌ Bulunamadı"
      }`
    );

    // 5. Doğrudan veritabanından YouTube öğelerini getir
    console.log("5. Veritabanından YouTube öğeleri kontrol ediliyor...");
    const directYoutubeItems = await this.getDirectYoutubeItems(feedIds);
    console.log(
      `Doğrudan veritabanından YouTube öğeleri: ${
        directYoutubeItems?.length
          ? `✅ Bulundu (${directYoutubeItems.length})`
          : "❌ Bulunamadı"
      }`
    );

    // 6. Doğrudan veritabanından kullanıcı etkileşimlerini getir
    console.log(
      "6. Veritabanından kullanıcı etkileşimleri kontrol ediliyor..."
    );
    const directUserInteractions = await this.getDirectUserInteractions(userId);
    console.log(
      `Doğrudan veritabanından kullanıcı etkileşimleri: ${
        directUserInteractions?.length
          ? `✅ Bulundu (${directUserInteractions.length})`
          : "❌ Bulunamadı"
      }`
    );

    // 7. Repository katmanından beslemeleri getir
    console.log("7. Repository katmanından beslemeler kontrol ediliyor...");
    const repoFeeds = await this.getRepositoryFeeds(userId);
    console.log(
      `Repository katmanından beslemeler: ${
        repoFeeds?.length ? `✅ Bulundu (${repoFeeds.length})` : "❌ Bulunamadı"
      }`
    );

    if (repoFeeds?.length) {
      // 8. Repository katmanından besleme öğelerini getir
      console.log(
        "8. Repository katmanından besleme öğeleri kontrol ediliyor..."
      );
      const repoItems = await this.getRepositoryFeedItems(feedIds, userId);
      console.log(
        `Repository katmanından besleme öğeleri: ${
          repoItems?.length
            ? `✅ Bulundu (${repoItems.length})`
            : "❌ Bulunamadı"
        }`
      );
    }

    // 9. Service katmanından beslemeleri getir
    console.log("9. Service katmanından beslemeler kontrol ediliyor...");
    const serviceFeeds = await this.getServiceFeeds(userId);
    console.log(
      `Service katmanından beslemeler: ${
        serviceFeeds?.length
          ? `✅ Bulundu (${serviceFeeds.length})`
          : "❌ Bulunamadı"
      }`
    );

    if (serviceFeeds?.length) {
      // 10. Service katmanından besleme öğelerini getir
      console.log(
        "10. Service katmanından besleme öğeleri kontrol ediliyor..."
      );
      const serviceItems = await this.getServiceFeedItems(
        serviceFeeds.map((f) => f.id),
        userId
      );
      console.log(
        `Service katmanından besleme öğeleri: ${
          serviceItems?.length
            ? `✅ Bulundu (${serviceItems.length})`
            : "❌ Bulunamadı"
        }`
      );
    }

    // Özetle
    console.group("📊 Tanılama Özeti");
    console.log(`Veritabanı Bağlantısı: ${dbConnected ? "✅" : "❌"}`);
    console.log(`Kullanıcı Bilgisi: ${userId ? "✅" : "❌"}`);
    console.log(`DB Beslemeler: ${directFeeds?.length || 0} adet`);
    console.log(`DB RSS Öğeleri: ${directRssItems?.length || 0} adet`);
    console.log(`DB YouTube Öğeleri: ${directYoutubeItems?.length || 0} adet`);
    console.log(
      `DB Kullanıcı Etkileşimleri: ${directUserInteractions?.length || 0} adet`
    );
    console.log(`Repository Beslemeler: ${repoFeeds?.length || 0} adet`);
    console.log(`Service Beslemeler: ${serviceFeeds?.length || 0} adet`);
    console.groupEnd();

    console.groupEnd();
  }
}

// Singleton örneği oluştur
const feedDebugger = new FeedDebugger();

// Tarayıcı ortamında çalıştığında, global scope'a ekle
if (typeof window !== "undefined") {
  window.feedDebugger = feedDebugger;
  console.info(
    "Feed Debugger yüklendi. Konsoldan window.feedDebugger ile erişilebilir."
  );
  console.info("Örneğin: window.feedDebugger.diagnoseFullSystem()");
}

export default feedDebugger;

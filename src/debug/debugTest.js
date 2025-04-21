"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import dbClient from "@/lib/db/index";
import { FeedRepository } from "@/repositories/feedRepository";
import { feedService } from "@/services/feedService";

/**
 * Adım adım debug testi yapar
 * @param {string} userId - Kullanıcı ID'si
 */
export async function runDebugTest(userId) {
  console.log("🔍 Debug testi başlatılıyor...");
  console.log("👤 Kullanıcı ID:", userId);

  const feedRepository = new FeedRepository();

  const results = {
    timestamp: new Date().toISOString(),
    userId: userId,
    db: { success: false, data: null },
    repository: { success: false, data: null },
    service: { success: false, data: null },
    content: { success: false, data: null },
  };

  try {
    // 1. Veritabanı bağlantısı testi
    console.log("1️⃣ Veritabanı bağlantısı test ediliyor...");
    const supabase = createClientComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      results.db.success = true;
      results.db.data = {
        message: "Veritabanı bağlantısı başarılı",
        userLoggedIn: true,
        userId: session.user.id,
      };
      console.log("✅ Veritabanı bağlantısı başarılı!");
    } else {
      results.db.data = {
        message: "Veritabanı bağlantısı başarılı fakat oturum bulunamadı",
        userLoggedIn: false,
      };
      console.log(
        "⚠️ Veritabanı bağlantısı başarılı, fakat oturum bulunamadı!"
      );
    }

    // 2. Doğrudan sorgu testi (dbClient üzerinden)
    console.log("2️⃣ dbClient ile feeds tablosu sorgulanıyor...");
    try {
      const { data: directFeeds } = await dbClient.query("feeds", {
        select: "id, title, url, type",
        eq: {
          user_id: userId,
        },
        is: {
          deleted_at: null,
        },
      });

      results.db.feeds = {
        count: directFeeds?.length || 0,
        data: directFeeds?.slice(0, 2) || [],
      };

      console.log(`✅ dbClient ile ${directFeeds?.length || 0} feed bulundu`);

      // Feed varsa, içerikleri kontrol et
      if (directFeeds && directFeeds.length > 0) {
        const feedIds = directFeeds.map((feed) => feed.id);

        // RSS içerikleri
        const { data: rssItems } = await dbClient.query("rss_items", {
          select: "id, title, feed_id",
          in: {
            feed_id: feedIds,
          },
          limit: 5,
        });

        // YouTube içerikleri
        const { data: youtubeItems } = await dbClient.query("youtube_items", {
          select: "id, title, feed_id",
          in: {
            feed_id: feedIds,
          },
          limit: 5,
        });

        results.db.content = {
          rssCount: rssItems?.length || 0,
          youtubeCount: youtubeItems?.length || 0,
          rssSample: rssItems?.slice(0, 2) || [],
          youtubeSample: youtubeItems?.slice(0, 2) || [],
        };

        console.log(
          `✅ dbClient ile içerikler bulundu - RSS: ${
            rssItems?.length || 0
          }, YouTube: ${youtubeItems?.length || 0}`
        );
      }
    } catch (error) {
      results.db.error = error.message;
      console.error("❌ dbClient sorgu hatası:", error);
    }

    // 3. Repository testi
    console.log("3️⃣ feedRepository ile feeds sorgulanıyor...");
    try {
      const repoFeeds = await feedRepository.getFeeds(userId);

      results.repository.success = true;
      results.repository.data = {
        feedCount: repoFeeds?.length || 0,
        feeds: repoFeeds?.slice(0, 2) || [],
      };

      console.log(`✅ Repository ile ${repoFeeds?.length || 0} feed bulundu`);

      // Feed varsa, içerikleri kontrol et
      if (repoFeeds && repoFeeds.length > 0) {
        const feedIds = repoFeeds.map((feed) => feed.id);

        const repoItems = await feedRepository.getFeedItems(
          feedIds,
          10,
          null,
          userId
        );

        results.repository.content = {
          rssCount: repoItems?.rssItems?.length || 0,
          youtubeCount: repoItems?.youtubeItems?.length || 0,
          hasInteractions:
            Object.keys(repoItems?.interactionData || {}).length > 0,
        };

        console.log(
          `✅ Repository ile içerikler bulundu - RSS: ${
            repoItems?.rssItems?.length || 0
          }, YouTube: ${repoItems?.youtubeItems?.length || 0}`
        );
      }
    } catch (error) {
      results.repository.error = error.message;
      console.error("❌ Repository sorgu hatası:", error);
    }

    // 4. Service testi
    console.log("4️⃣ feedService ile feeds sorgulanıyor...");
    try {
      const serviceFeeds = await feedService.getFeeds(userId);

      results.service.success = true;
      results.service.data = {
        feedCount: serviceFeeds?.length || 0,
        feeds: serviceFeeds?.slice(0, 2) || [],
      };

      console.log(`✅ Service ile ${serviceFeeds?.length || 0} feed bulundu`);

      // Feed varsa, içerikleri kontrol et
      if (serviceFeeds && serviceFeeds.length > 0) {
        const feedIds = serviceFeeds.map((feed) => feed.id);

        const serviceItems = await feedService.getFeedItems(
          feedIds,
          10,
          userId
        );

        results.service.content = {
          itemCount: Array.isArray(serviceItems)
            ? serviceItems.length
            : (serviceItems?.rssItems?.length || 0) +
              (serviceItems?.youtubeItems?.length || 0),
        };

        console.log(
          `✅ Service ile içerikler bulundu - Toplam: ${results.service.content.itemCount}`
        );
      }
    } catch (error) {
      results.service.error = error.message;
      console.error("❌ Service sorgu hatası:", error);
    }

    console.log("🏁 Debug testi tamamlandı!");
    console.log("📊 Sonuçlar:", results);

    return results;
  } catch (error) {
    console.error("❌ Debug testi sırasında hata:", error);
    results.error = error.message;
    return results;
  }
}

// Browser konsolunda kullanım için global fonksiyon
if (typeof window !== "undefined") {
  window.runDebugTest = runDebugTest;
}

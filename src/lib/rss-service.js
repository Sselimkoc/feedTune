/**
 * RSS Servisi
 *
 * RSS beslemelerinin yönetimi, ayrıştırılması ve veritabanına kaydedilmesi için
 * merkezi bir hizmet sağlar.
 */

import Parser from "rss-parser";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// RSS Parser konfigürasyonu
export const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media", { keepArray: true }],
      ["media:thumbnail", "thumbnail"],
      ["content:encoded", "contentEncoded"],
      ["description", "description"],
      ["enclosure", "enclosure"],
    ],
  },
  timeout: 10000, // 10 saniyelik timeout (daha önce 60 saniyeydi)
  maxRedirects: 3, // Maksimum 3 yönlendirme
});

/**
 * RSS beslemesini ayrıştır
 * @param {string} url - RSS beslemesinin URL'si
 * @returns {Promise<Object>} - Ayrıştırılmış RSS beslemesi
 */
export async function parseRssFeed(url) {
  try {
    // RSS beslemesini getir
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 saniye içinde yanıt alınmazsa iptal et

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FeedTune/1.0 RSS Reader", // User agent header ekle - bazı siteler bunu kontrol eder
      },
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`RSS getirme başarısız: ${response.status}`);
    }

    // Çok büyük yanıtları kontrol et
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      // 5MB
      throw new Error("RSS beslemesi çok büyük, en fazla 5MB kabul edilir");
    }

    const text = await response.text();

    // İçerik boyutunu kontrol et (content-length header'ı olmayan yanıtlar için)
    if (text.length > 5 * 1024 * 1024) {
      // 5MB
      throw new Error("RSS beslemesi çok büyük, en fazla 5MB kabul edilir");
    }

    // RSS beslemesini ayrıştır
    const feed = await parser.parseString(text);

    // Feed öğelerinin sayısını sınırla
    const maxItems = 50; // Maksimum 50 öğe işle
    const items = (feed.items || []).slice(0, maxItems);

    // Besleme verisini temizle ve dönüştür
    const transformedFeed = {
      title: feed.title || "",
      description: feed.description || "",
      link: feed.link || url,
      language: feed.language || null,
      lastBuildDate: feed.lastBuildDate || null,
      items: items.map((item) => transformFeedItem(item)),
      feedUrl: url,
    };

    return transformedFeed;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("RSS beslemesi zaman aşımına uğradı");
    }
    console.error("RSS ayrıştırma hatası:", error);
    throw new Error(`RSS ayrıştırma hatası: ${error.message}`);
  }
}

/**
 * RSS besleme öğesini dönüştür
 * @param {Object} item - RSS besleme öğesi
 * @returns {Object} - Dönüştürülmüş besleme öğesi
 */
function transformFeedItem(item) {
  // Thumbnail bilgisini belirle
  let thumbnail = null;

  // Media içeriği varsa
  if (item.media) {
    if (Array.isArray(item.media)) {
      // En büyük görseli bul
      let maxWidth = 0;
      item.media.forEach((media) => {
        const width = parseInt(media.$.width || 0);
        if (width > maxWidth) {
          maxWidth = width;
          thumbnail = media.$.url;
        }
      });

      // Hala thumbnail yoksa, ilk media öğesini kullan
      if (!thumbnail && item.media.length > 0) {
        thumbnail = item.media[0].$.url;
      }
    } else if (item.media.$ && item.media.$.url) {
      thumbnail = item.media.$.url;
    }
  }

  // Thumbnail özelliği varsa
  if (!thumbnail && item.thumbnail && item.thumbnail.url) {
    thumbnail = item.thumbnail.url;
  }

  // Enclosure özelliği varsa ve resim ise
  if (
    !thumbnail &&
    item.enclosure &&
    item.enclosure.type &&
    item.enclosure.type.startsWith("image/") &&
    item.enclosure.url
  ) {
    thumbnail = item.enclosure.url;
  }

  return {
    title: item.title || "",
    link: item.link || "",
    description: item.contentEncoded || item.description || "",
    content: item.contentEncoded || item.content || item.description || "",
    pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
    author: item.creator || item.author || item.dc?.creator || "",
    guid: item.guid || item.id || item.link || "",
    thumbnail: thumbnail,
    categories: Array.isArray(item.categories) ? item.categories : [],
  };
}

/**
 * RSS beslemesini ekle
 * @param {string} url - RSS beslemesinin URL'si
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} - Eklenen besleme bilgisi
 */
export async function addRssFeed(url, userId) {
  const supabase = createClientComponentClient();

  try {
    // Önce RSS beslemesini ayrıştır
    const feedData = await parseRssFeed(url);

    // Favicon URL'si al (future enhancement: ayrı bir fonksiyon olarak)
    let favicon = null;

    if (feedData.link) {
      try {
        // Favicon için origin'i al
        const siteUrl = new URL(feedData.link).origin;
        favicon = `${siteUrl}/favicon.ico`;
      } catch (error) {
        console.error("Favicon URL oluşturma hatası:", error);
      }
    }

    // Feeds tablosuna ekle
    const { data: newFeed, error: feedError } = await supabase
      .from("feeds")
      .insert([
        {
          user_id: userId,
          type: "rss",
          title: feedData.title || "İsimsiz Besleme",
          link: feedData.link || url,
          description: feedData.description || "",
          site_favicon: favicon,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (feedError) throw feedError;

    // RSS feeds tablosuna ekle
    const { error: rssFeedError } = await supabase.from("rss_feeds").insert([
      {
        id: newFeed.id,
        feed_url: url,
        last_build_date: feedData.lastBuildDate
          ? new Date(feedData.lastBuildDate).toISOString()
          : null,
        language: feedData.language || null,
        categories: feedData.categories || [],
      },
    ]);

    if (rssFeedError) throw rssFeedError;

    // Feed öğelerini ekle
    if (feedData.items && feedData.items.length > 0) {
      const feedItems = feedData.items.map((item) => ({
        feed_id: newFeed.id,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        author: item.author,
        published_at: new Date(item.pubDate).toISOString(),
        guid: item.guid,
        thumbnail: item.thumbnail,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from("feed_items")
        .insert(feedItems);

      if (itemsError) console.error("Feed öğeleri ekleme hatası:", itemsError);
    }

    return newFeed;
  } catch (error) {
    console.error("RSS besleme ekleme hatası:", error);
    throw new Error(`RSS besleme eklenirken hata oluştu: ${error.message}`);
  }
}

/**
 * RSS beslemesini güncelle
 * @param {string} feedId - Besleme ID'si
 * @returns {Promise<Object>} - Güncellenen besleme bilgisi
 */
export async function updateRssFeed(feedId) {
  const supabase = createClientComponentClient();

  try {
    // RSS feed bilgilerini al
    const { data: rssFeed, error: rssFeedError } = await supabase
      .from("rss_feeds")
      .select("feed_url")
      .eq("id", feedId)
      .single();

    if (rssFeedError) throw rssFeedError;

    if (!rssFeed || !rssFeed.feed_url) {
      throw new Error("RSS besleme URL'si bulunamadı");
    }

    // RSS beslemesini ayrıştır
    const feedData = await parseRssFeed(rssFeed.feed_url);

    // Feeds tablosunu güncelle
    const { error: feedError } = await supabase
      .from("feeds")
      .update({
        title: feedData.title || "İsimsiz Besleme",
        link: feedData.link || rssFeed.feed_url,
        description: feedData.description || "",
        last_fetched_at: new Date().toISOString(),
      })
      .eq("id", feedId);

    if (feedError) throw feedError;

    // RSS feeds tablosunu güncelle
    const { error: rssFeedUpdateError } = await supabase
      .from("rss_feeds")
      .update({
        last_build_date: feedData.lastBuildDate
          ? new Date(feedData.lastBuildDate).toISOString()
          : null,
        language: feedData.language || null,
      })
      .eq("id", feedId);

    if (rssFeedUpdateError) throw rssFeedUpdateError;

    // Feed öğelerini ekle/güncelle
    if (feedData.items && feedData.items.length > 0) {
      const feedItems = feedData.items.map((item) => ({
        feed_id: feedId,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        author: item.author,
        published_at: new Date(item.pubDate).toISOString(),
        guid: item.guid,
        thumbnail: item.thumbnail,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from("feed_items")
        .upsert(feedItems, {
          onConflict: "feed_id,guid",
          ignoreDuplicates: false,
        });

      if (itemsError)
        console.error("Feed öğeleri güncelleme hatası:", itemsError);
    }

    return { success: true, message: "RSS besleme başarıyla güncellendi" };
  } catch (error) {
    console.error("RSS besleme güncelleme hatası:", error);
    throw new Error(`RSS besleme güncellenirken hata oluştu: ${error.message}`);
  }
}

/**
 * RSS beslemesini sil
 * @param {string} feedId - Besleme ID'si
 * @returns {Promise<Object>} - Silme sonucu
 */
export async function deleteRssFeed(feedId) {
  const supabase = createClientComponentClient();

  try {
    // Feeds tablosunda is_active'i false yap (soft delete)
    const { error: feedError } = await supabase
      .from("feeds")
      .update({ is_active: false })
      .eq("id", feedId);

    if (feedError) throw feedError;

    return { success: true, message: "RSS besleme başarıyla silindi" };
  } catch (error) {
    console.error("RSS besleme silme hatası:", error);
    throw new Error(`RSS besleme silinirken hata oluştu: ${error.message}`);
  }
}

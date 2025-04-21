import { supabase } from "@/lib/supabase";
import axios from "axios";
import { addYoutubeItems } from "@/lib/api/youtube-insert";
import Parser from "rss-parser";

class YouTubeService {
  /**
   * YouTube kanalı bilgilerini önbellekten alır veya yeni bir istek yapar
   * @param {string} youtubeId - YouTube kanal ID'si
   * @returns {Promise<object>} - Kanal bilgileri
   */
  async getChannelInfo(youtubeId) {
    try {
      // Belirli aralıklarla önbelleği temizle (örneğin %5 olasılıkla)
      if (Math.random() < 0.05) {
        await this.cleanCache();
      }

      // Önbellekten bilgileri kontrol et
      const { data: cachedData, error: cacheError } = await supabase
        .from("youtube_cache")
        .select("*")
        .eq("youtube_id", youtubeId)
        .single();

      // Önbellekte varsa ve 7 günden daha yeni ise, önbellekten döndür
      if (
        cachedData &&
        !cacheError &&
        this.isCacheValid(cachedData.updated_at)
      ) {
        console.log("YouTube bilgileri önbellekten alındı:", youtubeId);
        return cachedData;
      }

      // Önbellekte yoksa veya güncel değilse, API'den al
      const channelInfo = await this.fetchChannelInfo(youtubeId);

      // Alınan bilgileri önbelleğe kaydet
      await this.cacheChannelInfo(youtubeId, channelInfo);

      return channelInfo;
    } catch (error) {
      console.error("YouTube kanal bilgileri alınırken hata:", error);
      throw error;
    }
  }

  /**
   * Önbellek süresinin geçerli olup olmadığını kontrol eder
   * @param {string} updatedAt - Son güncelleme tarihi
   * @returns {boolean} - Önbelleğin geçerli olup olmadığı
   */
  isCacheValid(updatedAt) {
    const cacheDate = new Date(updatedAt);
    const now = new Date();
    // 7 günden daha yeni ise geçerli kabul et
    const cacheDurationDays = 7;
    const diffTime = Math.abs(now - cacheDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= cacheDurationDays;
  }

  /**
   * YouTube API veya proxy üzerinden kanal bilgilerini alır
   * @param {string} youtubeId - YouTube kanal ID'si
   * @returns {Promise<object>} - Kanal bilgileri
   */
  async fetchChannelInfo(youtubeId) {
    try {
      // YouTube API kullanılabilir ya da proxy üzerinden veri alınabilir
      // Burada özel bir API kullanabilir veya web scraping yapabilirsiniz

      // Örnek proxy kullanımı:
      const response = await axios.post("/api/proxy", {
        url: `https://www.youtube.com/channel/${youtubeId}`,
        method: "GET",
      });

      // HTML'den gerekli bilgileri çıkarma (basit örnek)
      const html = response.data;

      // Gerçek uygulamada daha sağlam bir parser kullanmak gerekir
      const title = this.extractFromHtml(
        html,
        /"title":"([^"]+)"/,
        "Bilinmeyen Kanal"
      );
      const thumbnail = this.extractFromHtml(
        html,
        /"avatar":{"thumbnails":\[{"url":"([^"]+)"/,
        ""
      );
      const description = this.extractFromHtml(
        html,
        /"description":"([^"]+)"/,
        ""
      );

      // RSS URL'i oluştur
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeId}`;

      return {
        youtube_id: youtubeId,
        title,
        thumbnail,
        description,
        channel_title: title,
        rss_url: rssUrl,
      };
    } catch (error) {
      console.error("YouTube bilgileri alınırken hata:", error);
      // Hata durumunda basit bir nesne döndür
      return {
        youtube_id: youtubeId,
        title: "Bilinmeyen Kanal",
        thumbnail: "",
        description: "",
        channel_title: "Bilinmeyen Kanal",
        rss_url: `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeId}`,
      };
    }
  }

  /**
   * HTML içeriğinden regex ile veri çıkarır
   * @param {string} html - HTML içeriği
   * @param {RegExp} regex - Regex pattern
   * @param {string} defaultValue - Bulunamazsa kullanılacak değer
   * @returns {string} - Bulunan değer veya varsayılan değer
   */
  extractFromHtml(html, regex, defaultValue) {
    const match = html.match(regex);
    return match && match[1]
      ? match[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"')
      : defaultValue;
  }

  /**
   * Kanal bilgilerini önbelleğe kaydeder
   * @param {string} youtubeId - YouTube kanal ID'si
   * @param {object} channelInfo - Kanal bilgileri
   */
  async cacheChannelInfo(youtubeId, channelInfo) {
    try {
      // Önce kaydın var olup olmadığını kontrol et
      const { data: existingData } = await supabase
        .from("youtube_cache")
        .select("youtube_id")
        .eq("youtube_id", youtubeId)
        .single();

      if (existingData) {
        // Kayıt zaten varsa güncelle
        const { error: updateError } = await supabase
          .from("youtube_cache")
          .update({
            title: channelInfo.title,
            thumbnail: channelInfo.thumbnail,
            description: channelInfo.description,
            channel_title: channelInfo.channel_title,
            rss_url: channelInfo.rss_url,
            updated_at: new Date().toISOString(),
          })
          .eq("youtube_id", youtubeId);

        if (updateError) {
          console.error("YouTube bilgileri güncellenirken hata:", updateError);
        } else {
          console.log("YouTube bilgileri güncellendi:", youtubeId);
        }
      } else {
        // Kayıt yoksa yeni ekle
        const { error: insertError } = await supabase
          .from("youtube_cache")
          .insert({
            youtube_id: youtubeId,
            title: channelInfo.title,
            thumbnail: channelInfo.thumbnail,
            description: channelInfo.description,
            channel_title: channelInfo.channel_title,
            rss_url: channelInfo.rss_url,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("YouTube bilgileri eklenirken hata:", insertError);
        } else {
          console.log("YouTube bilgileri önbelleğe eklendi:", youtubeId);
        }
      }
    } catch (error) {
      // Hata durumunda uygulama çalışmaya devam etsin
      console.error("Önbellekleme işlemi sırasında hata:", error);
    }
  }

  /**
   * Önbellek veritabanından eski kayıtları temizler
   * @returns {Promise<void>}
   */
  async cleanCache() {
    try {
      // clean_youtube_cache fonksiyonunu çağır
      const { error } = await supabase.rpc("clean_youtube_cache");

      if (error) {
        console.error("YouTube önbellek temizleme hatası:", error);
        throw error;
      }

      console.log("YouTube önbelleği temizlendi");
    } catch (error) {
      console.error("Önbellek temizleme hatası:", error);
      throw error;
    }
  }

  /**
   * YouTube URL'inden RSS beslemesi URL'i oluşturur
   * @param {string} youtubeUrl - YouTube URL'i (kanal, kullanıcı veya video)
   * @returns {Promise<string>} - RSS beslemesi URL'i
   */
  async getYoutubeRssUrl(youtubeUrl) {
    try {
      if (!youtubeUrl) {
        throw new Error("YouTube URL'si gerekli");
      }

      // URL'yi normalize et
      let normalizedUrl = youtubeUrl.trim();

      // Zaten bir RSS URL'i ise direkt döndür
      if (normalizedUrl.includes("youtube.com/feeds/videos.xml")) {
        return normalizedUrl;
      }

      // URL'den YouTube ID'sini çıkarmayı dene
      let channelId = await this.extractYoutubeChannelId(normalizedUrl);

      // Eğer kanal ID'si bulunduysa
      if (channelId) {
        console.log("Channel ID extracted:", channelId);
        return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      }

      console.log("Making API call to youtube-to-rss with URL:", normalizedUrl);

      // API'yi kullan
      const response = await axios.post("/api/youtube-to-rss", {
        url: normalizedUrl,
      });

      if (!response.data || !response.data.rssUrl) {
        throw new Error("YouTube RSS URL'si bulunamadı");
      }

      console.log("Received RSS URL from API:", response.data.rssUrl);
      return response.data.rssUrl;
    } catch (error) {
      console.error("YouTube RSS URL oluşturulurken hata:", error);

      // API hatası durumunda, channel ID çıkartılabiliyorsa doğrudan RSS URL'sini oluştur
      try {
        const channelId = await this.extractYoutubeChannelId(youtubeUrl);
        if (channelId) {
          console.log(
            "Fallback: Creating direct RSS URL for channel ID:",
            channelId
          );
          return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        }
      } catch (fallbackError) {
        console.error("Fallback URL creation failed:", fallbackError);
      }

      throw new Error(`YouTube RSS URL'si oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * YouTube URL'sinden kanal ID'sini çıkarır
   * @param {string} youtubeUrl - YouTube URL'i (kanal, kullanıcı veya video)
   * @returns {Promise<string|null>} - Kanal ID'si veya null
   */
  async extractYoutubeChannelId(youtubeUrl) {
    if (!youtubeUrl) return null;

    try {
      // URL'yi normalize et
      const normalizedUrl = youtubeUrl.trim();

      // URL nesnesini oluştur
      let url;
      try {
        url = new URL(normalizedUrl);
      } catch (e) {
        // Geçerli bir URL değilse ve http(s) içermiyorsa, https:// ekleyip tekrar dene
        if (!normalizedUrl.startsWith("http")) {
          try {
            url = new URL(`https://${normalizedUrl}`);
          } catch (e2) {
            console.error("Geçersiz URL formatı:", normalizedUrl);
            return null;
          }
        } else {
          console.error("Geçersiz URL formatı:", normalizedUrl);
          return null;
        }
      }

      // /channel/ formatını kontrol et
      if (url.pathname.includes("/channel/")) {
        const channelId = url.pathname.split("/channel/")[1]?.split(/[/?#]/)[0];
        if (channelId) return channelId;
      }

      // c/ formatını kontrol et
      if (url.pathname.includes("/c/") || url.pathname.startsWith("/c/")) {
        const customName = url.pathname.split("/c/")[1]?.split(/[/?#]/)[0];
        if (customName) {
          // Özel ad için kanal ID'sini getirmek için API çağrısı yapmak gerekir
          // Önbellekte varsa kontrol et
          const { data } = await supabase
            .from("youtube_cache")
            .select("youtube_id")
            .ilike("title", `%${customName}%`)
            .limit(1)
            .single();

          if (data?.youtube_id) return data.youtube_id;
        }
      }

      // /@username formatını kontrol et
      if (url.pathname.includes("/@")) {
        const username = url.pathname.split("/@")[1]?.split(/[/?#]/)[0];
        if (username) {
          // Önbellekte varsa kontrol et
          const { data } = await supabase
            .from("youtube_cache")
            .select("youtube_id")
            .ilike("title", `%${username}%`)
            .limit(1)
            .single();

          if (data?.youtube_id) return data.youtube_id;
        }
      }

      // /user/ formatını kontrol et
      if (url.pathname.includes("/user/")) {
        const username = url.pathname.split("/user/")[1]?.split(/[/?#]/)[0];
        if (username) {
          // Önbellekte varsa kontrol et
          const { data } = await supabase
            .from("youtube_cache")
            .select("youtube_id")
            .ilike("title", `%${username}%`)
            .limit(1)
            .single();

          if (data?.youtube_id) return data.youtube_id;
        }
      }

      return null;
    } catch (error) {
      console.error("Kanal ID çıkarılırken hata:", error);
      return null;
    }
  }

  /**
   * Feed ID'si ve kanal ID'si verilen bir YouTube besleme için videoları senkronize eder
   * @param {string} feedId - Besleme ID'si
   * @param {string} channelId - YouTube kanal ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<{success: boolean, count: number, error?: string}>}
   */
  async syncVideos(feedId, channelId, userId) {
    if (!feedId || !channelId) {
      console.error("Geçersiz feedId veya channelId:", { feedId, channelId });
      return { success: false, error: "Geçersiz feedId veya channelId" };
    }

    try {
      console.log(
        `YouTube videoları senkronize ediliyor. FeedId: ${feedId}, ChannelId: ${channelId}`
      );

      // RSS URL'sini oluştur
      const rssUrl = this.createRssUrl(channelId);
      if (!rssUrl) {
        return { success: false, error: "RSS URL oluşturulamadı" };
      }

      // Feed içeriğini getir
      console.log("RSS feed getiriliyor:", rssUrl);
      const parser = new Parser();

      try {
        const feed = await parser.parseURL(rssUrl);

        if (!feed || !feed.items || feed.items.length === 0) {
          console.log("Feed boş veya öğe yok");
          return {
            success: true,
            count: 0,
            message: "YouTube kanalında video bulunamadı",
          };
        }

        // Öğeleri işle ve formatla
        console.log(`${feed.items.length} video bulundu, formatlanıyor...`);
        const formattedItems = feed.items.map((item) => {
          const videoId = this.extractVideoId(item.link);
          const publishedDate = new Date(item.pubDate);

          return {
            feed_id: feedId,
            title: item.title,
            description: item.contentSnippet || "",
            link: item.link,
            video_id: videoId,
            thumbnail_url:
              item.itunes?.image ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            published_at: publishedDate.toISOString(),
            created_at: new Date().toISOString(),
            guid: item.guid || item.id || videoId,
            channel_id: channelId,
            user_id: userId,
          };
        });

        // Veritabanına ekle
        console.log(`${formattedItems.length} video eklenecek`);
        const result = await addYoutubeItems(feedId, formattedItems);

        console.log("YouTube videoları senkronizasyon sonucu:", result);
        return result;
      } catch (parseError) {
        console.error("Feed ayrıştırma hatası:", parseError);
        return {
          success: false,
          error: `Feed ayrıştırma hatası: ${parseError.message}`,
        };
      }
    } catch (error) {
      console.error("YouTube videoları senkronize edilirken hata:", error);
      return {
        success: false,
        error: error.message || "Video senkronizasyonunda beklenmeyen hata",
      };
    }
  }

  /**
   * YouTube üzerinde kanal arar
   * @param {string} query - Arama sorgusu
   * @returns {Promise<Array>} - Bulunan kanalların listesi
   */
  async searchChannel(query) {
    try {
      console.log(`YouTube kanal araması başlatılıyor: ${query}`);

      // Önce cache'e bakalım
      const cachedResults = await this.searchChannelInCache(query);
      if (cachedResults && cachedResults.length > 0) {
        console.log("YouTube kanal araması: Cache'den sonuçlar bulundu");
        return cachedResults;
      }

      // İstemci/sunucu tarafı kontrolü
      const isBrowser = typeof window !== "undefined";
      let baseUrl = "";

      if (isBrowser) {
        // Tarayıcı ortamında göreceli URL kullanabiliriz
        baseUrl = "";
      } else {
        // Sunucu tarafında tam URL gerekli
        const vercelUrl = process.env.VERCEL_URL;
        baseUrl = vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
      }

      console.log(
        `YouTube araması için API endpoint: ${baseUrl}/api/youtube-search`
      );

      // Fetch API ile istek yap - hem istemci hem sunucu tarafında çalışır
      const response = await fetch(`${baseUrl}/api/youtube-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: query }),
      });

      if (!response.ok) {
        throw new Error(`YouTube API isteği başarısız: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.channel) {
        console.log("YouTube kanal araması: Sonuç bulunamadı");
        return [];
      }

      const channel = data.channel;
      console.log(`YouTube kanal bulundu: ${channel.title}`);

      // Sonuçları cache'e ekle
      this.cacheSearchResults(query, [channel]);

      return [channel];
    } catch (error) {
      console.error("YouTube kanal arama hatası:", error);
      return [];
    }
  }

  /**
   * Cache'de kanal araması yapar
   * @param {string} query - Arama sorgusu
   * @returns {Promise<Array|null>} - Bulunan kanalların listesi veya null
   */
  async searchChannelInCache(query) {
    try {
      const { data, error } = await this.supabase
        .from("youtube_search_cache")
        .select("results")
        .ilike("query", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("YouTube arama cache hatası:", error);
        return null;
      }

      if (data && data.length > 0) {
        const age = new Date() - new Date(data[0].created_at);
        if (age < 7 * 24 * 60 * 60 * 1000) {
          // 7 gün
          return data[0].results;
        }
      }

      return null;
    } catch (error) {
      console.error("YouTube arama cache hatası:", error);
      return null;
    }
  }

  /**
   * Arama sonuçlarını cache'e ekler
   * @param {string} query - Arama sorgusu
   * @param {Array} results - Arama sonuçları
   */
  async cacheSearchResults(query, results) {
    try {
      const { data, error } = await this.supabase
        .from("youtube_search_cache")
        .upsert({
          query,
          results,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("YouTube arama cache kaydetme hatası:", error);
      } else {
        console.log("YouTube arama sonuçları cache'e kaydedildi");
      }
    } catch (error) {
      console.error("YouTube arama cache kaydetme hatası:", error);
    }
  }

  /**
   * Video URL'sinden video ID çıkarır
   * @param {string} url - Video URL'si
   * @returns {string|null} - Video ID'si
   */
  extractVideoId(url) {
    if (!url) return null;

    try {
      const urlObj = new URL(url);

      // youtube.com/watch?v=ID formatı
      if (urlObj.searchParams.has("v")) {
        return urlObj.searchParams.get("v");
      }

      // youtu.be/ID formatı
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.substring(1);
      }

      // URL'den video ID'si çıkarılamadı
      return null;
    } catch (error) {
      console.error("Video ID çıkarılırken hata:", error);
      return null;
    }
  }

  /**
   * YouTube kanal ID'si için RSS URL'si oluşturur
   * @param {string} channelId - YouTube kanal ID'si
   * @returns {string} - RSS feed URL'si
   */
  createRssUrl(channelId) {
    if (!channelId) return null;
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }
}

export const youtubeService = new YouTubeService();

"use client";

import axios from "axios";
import Parser from "rss-parser";

/**
 * RSS ve diğer feed türlerini ayrıştırmak için kullanılan sınıf
 */
export class FeedParser {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ["media:content", "media"],
          ["media:thumbnail", "mediaThumbnail"],
          ["enclosure", "enclosure"],
          ["content:encoded", "contentEncoded"],
          ["dc:creator", "creator"],
          ["dc:date", "dcDate"],
          ["pubDate", "pubDate"],
          ["published", "published"],
          ["updated", "updated"],
          ["yt:duration", "ytDuration"],
        ],
        feed: [
          "image",
          "language",
          "updated",
          "published",
          ["atom:updated", "atomUpdated"],
        ],
      },
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*",
      },
    });

    this.parser.parseURL = this.parseURL.bind(this);
  }

  /**
   * RSS beslemesini ayrıştırır
   * @param {string} url - RSS besleme URL'si
   * @param {Object} options - Seçenekler
   * @param {boolean} options.skipCache - Önbelleği atla
   * @returns {Promise<Object>} - Ayrıştırılmış besleme
   */
  async parseRssFeed(url, options = {}) {
    const { skipCache = false } = options;

    try {
      console.log(
        `RSS beslemesi ayrıştırılıyor: ${url}, skipCache: ${skipCache}`
      );

      // Feed'i çek
      const feedData = await this.fetchWithProxy(url, skipCache);

      // Feed'i işle
      const processedFeed = this.processFeedData(feedData, "rss");

      return processedFeed;
    } catch (error) {
      console.error("RSS parsing error:", error);
      throw new Error(`RSS beslemesi ayrıştırılamadı: ${error.message}`);
    }
  }

  /**
   * YouTube beslemesini ayrıştırır
   * @param {string} url - YouTube beslemesi URL'si
   * @param {Object} options - Seçenekler
   * @param {boolean} options.skipCache - Önbelleği atla
   * @returns {Promise<Object>} - Ayrıştırılmış besleme
   */
  async parseYoutubeFeed(url, options = {}) {
    const { skipCache = false } = options;

    try {
      console.log(
        `YouTube beslemesi ayrıştırılıyor: ${url}, skipCache: ${skipCache}`
      );

      // Feed'i çek
      const feed = await this.fetchWithProxy(url, skipCache);

      console.log("YouTube beslemesi alındı:", feed.title);

      // YouTube feed'e özel işlemler
      const processedFeed = this.processFeedData(feed, "youtube");

      // YouTube için özel alan düzenlemeleri
      if (processedFeed.items && processedFeed.items.length > 0) {
        processedFeed.items = processedFeed.items.map((item) => {
          // Video ID'sini çıkar
          const videoId = this.extractYoutubeVideoId(item);

          // Thumbnail yoksa ekle
          if (!item.thumbnail && videoId) {
            item.thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }

          // YouTube video ID'sini ekle
          item.videoId = videoId;

          return item;
        });
      }

      return processedFeed;
    } catch (error) {
      console.error("YouTube parsing error:", error);
      throw new Error(`YouTube beslemesi ayrıştırılamadı: ${error.message}`);
    }
  }

  /**
   * Feed URL'sini ayrıştırır
   * @param {string} feedUrl - Feed URL'si
   * @returns {Promise<Object>} - Ayrıştırılmış feed
   */
  async parseURL(feedUrl) {
    try {
      // Her zaman proxy üzerinden iste
      return await this.fetchWithProxy(feedUrl);
    } catch (error) {
      console.error("Feed ayrıştırma hatası:", error);
      throw new Error(`Feed alınamadı: ${error.message}`);
    }
  }

  /**
   * Verilen URL'yi doğrudan veya proxy üzerinden çeker
   * @param {string} feedUrl - Çekilecek URL
   * @param {boolean} skipCache - Önbelleği atla
   * @returns {Promise<Object>} - Çekilen veri
   */
  async fetchWithProxy(feedUrl, skipCache = false) {
    try {
      console.log(`Feed çekiliyor: ${feedUrl}, skipCache: ${skipCache}`);

      // localStorage kontrolü (client-side çalıştığından emin ol)
      let hasLocalStorage = false;
      try {
        hasLocalStorage =
          typeof window !== "undefined" && window.localStorage !== undefined;
      } catch (e) {
        console.warn("localStorage erişilemez olabilir:", e);
      }

      // Önbellek anahtarı
      const cacheKey = `feed_cache_${feedUrl}`;
      const cacheTime = 5 * 60 * 1000; // 5 dakika

      // Önbellekten veri kontrolü - sadece client-side ve localStorage mevcutsa
      if (!skipCache && hasLocalStorage) {
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const cache = JSON.parse(cachedData);
            const now = new Date().getTime();

            // Önbellekteki veri süresi geçerli mi?
            if (cache.timestamp && now - cache.timestamp < cacheTime) {
              console.log("✅ Önbellekten feed verileri alındı");
              return cache.data;
            } else {
              console.log("Önbellek süresi dolmuş, yeni veri çekiliyor");
            }
          }
        } catch (cacheError) {
          console.warn("Önbellek erişimi hatası:", cacheError);
        }
      } else {
        console.log(
          hasLocalStorage
            ? "Önbellek atlanıyor, yeni veri çekiliyor"
            : "localStorage kullanılamaz, direkt veri çekiliyor"
        );
      }

      // Doğrudan bağlantıyı dene
      try {
        console.log("Doğrudan bağlantı deneniyor:", feedUrl);
        const feed = await this.parser.parseURL(feedUrl);

        // Başarılıysa önbelleğe kaydet - sadece client-side ve localStorage mevcutsa
        if (!skipCache && hasLocalStorage && feed) {
          try {
            // Öğe sayısını kontrol et ve sınırla
            if (feed.items && Array.isArray(feed.items) && feed.items.length > 50) {
              console.log(`Öğe sayısı sınırlandırılıyor: ${feed.items.length} -> 50`);
              feed.items = feed.items.slice(0, 50); // Sadece ilk 50 öğeyi al
            }
            
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                timestamp: new Date().getTime(),
                data: feed,
              })
            );
            console.log(`✅ Feed verileri önbelleğe kaydedildi (${feed.items?.length || 0} öğe)`);
          } catch (storageError) {
            console.warn("Önbelleğe kaydetme hatası:", storageError);
          }
        }

        return feed;
      } catch (directError) {
        console.warn("Doğrudan bağlantı hatası:", directError);

        // Doğrudan bağlantı başarısız, proxy dene
        console.log("Proxy üzerinden bağlantı deneniyor");
        const response = await fetch("/api/feed-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: feedUrl }),
        });

        if (!response.ok) {
          throw new Error(
            `Proxy hatası: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(`Proxy error: ${result.error}`);
        }

        if (!result.feed) {
          throw new Error("Proxy yanıtında feed verisi eksik");
        }

        // Proxy üzerinden başarılı, önbelleğe kaydet - sadece client-side ve localStorage mevcutsa
        if (!skipCache && hasLocalStorage) {
          try {
            // Öğe sayısını kontrol et ve sınırla
            if (result.feed.items && Array.isArray(result.feed.items) && result.feed.items.length > 50) {
              console.log(`Proxy öğe sayısı sınırlandırılıyor: ${result.feed.items.length} -> 50`);
              result.feed.items = result.feed.items.slice(0, 50); // Sadece ilk 50 öğeyi al
            }
            
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                timestamp: new Date().getTime(),
                data: result.feed,
              })
            );
            console.log(`✅ Proxy feed verileri önbelleğe kaydedildi (${result.feed.items?.length || 0} öğe)`);
          } catch (storageError) {
            console.warn("Önbelleğe kaydetme hatası:", storageError);
          }
        }

        return result.feed;
      }
    } catch (error) {
      console.error("Feed çekme hatası:", error);
      throw new Error(`Feed çekilemedi: ${error.message}`);
    }
  }

  /**
   * HTML içeriğinden feed linkini çıkarır
   * @param {string} content - HTML içeriği
   * @returns {string|null} - Feed linki
   */
  extractFeedLink(content) {
    const patterns = [
      /<link[^>]*rel=["']alternate["'][^>]*type=["']application\/(?:rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["'][^>]*type=["']application\/(?:rss|atom)\+xml["']/i,
      /<link[^>]*type=["']application\/(?:rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * İçeriğin geçerli bir feed olup olmadığını kontrol eder
   * @param {string} content - İçerik
   * @returns {boolean} - Geçerli feed mi?
   */
  isValidFeedContent(content) {
    const validMarkers = [
      "<rss",
      "<feed",
      "<?xml",
      "<channel",
      'xmlns="http://www.w3.org/2005/Atom"',
    ];
    return validMarkers.some((marker) => content.includes(marker));
  }

  /**
   * Göreceli URL'yi mutlak URL'ye çevirir
   * @param {string} relativeUrl - Göreceli URL
   * @param {string} baseUrl - Temel URL
   * @returns {string} - Mutlak URL
   */
  resolveUrl(relativeUrl, baseUrl) {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Feed verilerini işler
   * @param {Object} feed - Feed verisi
   * @param {string} type - Feed türü
   * @returns {Object} - İşlenmiş feed
   */
  processFeedData(feed, type) {
    return {
      title: feed.title || "Başlıksız Feed",
      description: feed.description || "",
      link: feed.link || "",
      icon: this.extractFeedIcon(feed),
      language: feed.language || "tr",
      lastUpdated: this.extractLastUpdated(feed),
      items: Array.isArray(feed.items)
        ? feed.items.map((item) => this.processItem(item, type))
        : [],
    };
  }

  /**
   * Feed öğesini işler
   * @param {Object} item - Feed öğesi
   * @param {string} type - Feed türü
   * @returns {Object} - İşlenmiş öğe
   */
  processItem(item, type) {
    const pubDate = this.extractItemDate(item);
    const duration =
      type === "youtube" ? this.extractYoutubeVideoDuration(item) : null;

    return {
      title: item.title || "",
      link: item.link || "",
      description: item.description || item.summary || "",
      content: item.contentEncoded || item.content || item.description || "",
      pubDate: pubDate || new Date().toISOString(),
      guid: item.guid || item.id || item.link || "",
      thumbnail: this.extractThumbnail(item, type),
      author: item.author || item.creator || "",
      categories: Array.isArray(item.categories) ? item.categories : [],
      type: type || "rss",
      duration: duration,
      videoId: type === "youtube" ? this.extractYoutubeVideoId(item) : null,
    };
  }

  /**
   * Feed'in son güncellenme tarihini çıkarır
   * @param {Object} feed - Feed verisi
   * @returns {string} - ISO 8601 formatında tarih
   */
  extractLastUpdated(feed) {
    const possibleDates = [
      feed.lastBuildDate,
      feed.updated,
      feed.atomUpdated,
      feed.published,
      feed.pubDate,
    ].filter(Boolean);

    return possibleDates.length > 0
      ? this.normalizeDate(possibleDates[0])
      : new Date().toISOString();
  }

  /**
   * Öğenin yayın tarihini çıkarır
   * @param {Object} item - Feed öğesi
   * @returns {string} - ISO 8601 formatında tarih
   */
  extractItemDate(item) {
    const possibleDates = [
      item.pubDate,
      item.published,
      item.updated,
      item.dcDate,
      item.isoDate,
    ].filter(Boolean);

    return possibleDates.length > 0
      ? this.normalizeDate(possibleDates[0])
      : new Date().toISOString();
  }

  /**
   * Tarihi normalize eder
   * @param {string} dateStr - Tarih string'i
   * @returns {string} - ISO 8601 formatında tarih
   */
  normalizeDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return !isNaN(date.getTime())
        ? date.toISOString()
        : new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Feed ikonunu çıkarır
   * @param {Object} feed - Feed nesnesi
   * @returns {string|null} - İkon URL'si
   */
  extractFeedIcon(feed) {
    if (feed.image && feed.image.url) {
      return feed.image.url;
    }

    if (feed.link) {
      try {
        const url = new URL(feed.link);
        return `${url.protocol}//${url.hostname}/favicon.ico`;
      } catch (e) {
        return null;
      }
    }

    return null;
  }

  /**
   * Öğeden küçük resmi çıkarır
   * @param {Object} item - Feed öğesi
   * @param {string} type - Feed türü
   * @returns {string|null} - Küçük resim URL'si
   */
  extractThumbnail(item, type) {
    let thumbnailUrl = null;

    // Media içeriğinden thumbnail
    if (item.media) {
      if (typeof item.media === "string") {
        thumbnailUrl = item.media;
      } else if (item.media.url) {
        thumbnailUrl = item.media.url;
      } else if (Array.isArray(item.media) && item.media.length > 0) {
        // İlk öğeyi al
        const firstMedia = item.media[0];
        thumbnailUrl =
          typeof firstMedia === "string"
            ? firstMedia
            : firstMedia && firstMedia.url
            ? firstMedia.url
            : null;
      }
    }

    // Media thumbnail
    if (!thumbnailUrl && item.mediaThumbnail) {
      if (typeof item.mediaThumbnail === "string") {
        thumbnailUrl = item.mediaThumbnail;
      } else if (item.mediaThumbnail.url) {
        thumbnailUrl = item.mediaThumbnail.url;
      } else if (
        Array.isArray(item.mediaThumbnail) &&
        item.mediaThumbnail.length > 0
      ) {
        const firstThumbnail = item.mediaThumbnail[0];
        thumbnailUrl =
          typeof firstThumbnail === "string"
            ? firstThumbnail
            : firstThumbnail && firstThumbnail.url
            ? firstThumbnail.url
            : null;
      }
    }

    // Enclosure içeriğinden thumbnail
    if (
      !thumbnailUrl &&
      item.enclosure &&
      item.enclosure.url &&
      item.enclosure.type &&
      item.enclosure.type.startsWith("image/")
    ) {
      thumbnailUrl = item.enclosure.url;
    }

    // YouTube için özel durumlar
    if (!thumbnailUrl && type === "youtube") {
      const videoId = this.extractYoutubeVideoId(item);
      if (videoId) {
        thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    // İçerikten ilk resmi bulmayı dene
    if (!thumbnailUrl) {
      const imgMatch = (
        item.content ||
        item.contentEncoded ||
        item.description ||
        ""
      ).match(/<img[^>]+src="([^">]+)"/);

      if (imgMatch && imgMatch[1]) {
        thumbnailUrl = imgMatch[1];
      }
    }

    // URL geçerliliğini kontrol et
    if (thumbnailUrl) {
      try {
        // URL'yi test et
        new URL(thumbnailUrl);
        return thumbnailUrl;
      } catch (e) {
        console.warn(`Geçersiz thumbnail URL: ${thumbnailUrl}`);

        // Göreceli URL olabilir, öğenin link değeri varsa onunla birleştirmeyi dene
        if (item.link) {
          try {
            return this.resolveUrl(thumbnailUrl, item.link);
          } catch (err) {
            console.error("URL çözme hatası:", err);
            return null;
          }
        }

        return null;
      }
    }

    return null;
  }

  /**
   * YouTube video ID'sini çıkarır
   * @param {Object} item - Feed öğesi
   * @returns {string|null} - Video ID
   */
  extractYoutubeVideoId(item) {
    // Temel bilgileri loglama
    console.log(
      `YouTube ID ayrıştırılıyor: "${
        item.title?.substring(0, 30) || "Başlıksız"
      }..."`
    );

    try {
      // ID, link ve guid için temizlenmiş değerler oluştur
      const itemId = typeof item.id === "string" ? item.id.trim() : "";
      const itemLink = typeof item.link === "string" ? item.link.trim() : "";
      const itemGuid = typeof item.guid === "string" ? item.guid.trim() : "";

      // Format 1: yt:video:VIDEO_ID veya video:VIDEO_ID formatı (standart YouTube RSS)
      if (itemId) {
        // yt:video: formatı
        if (itemId.includes("yt:video:")) {
          const videoId = itemId
            .split("yt:video:")
            .pop()
            .split(/[/?#&]/)[0];
          if (this.isValidYouTubeId(videoId)) {
            console.log(`✓ "yt:video:" formatından ID bulundu: ${videoId}`);
            return videoId;
          }
        }

        // video: formatı
        if (itemId.includes("video:")) {
          const videoId = itemId
            .split("video:")
            .pop()
            .split(/[/?#&]/)[0];
          if (this.isValidYouTubeId(videoId)) {
            console.log(`✓ "video:" formatından ID bulundu: ${videoId}`);
            return videoId;
          }
        }

        // ID doğrudan video ID ise
        if (this.isValidYouTubeId(itemId)) {
          console.log(`✓ ID doğrudan YouTube video ID: ${itemId}`);
          return itemId;
        }
      }

      // Format 2: YouTube URL'lerinden ID çıkarma
      if (itemLink) {
        try {
          const url = new URL(itemLink);

          // youtube.com/watch?v=VIDEO_ID formatı
          if (
            url.hostname.includes("youtube.com") &&
            url.pathname.includes("/watch")
          ) {
            const videoId = url.searchParams.get("v");
            if (this.isValidYouTubeId(videoId)) {
              console.log(
                `✓ youtube.com/watch?v= formatından ID bulundu: ${videoId}`
              );
              return videoId;
            }
          }

          // youtu.be/VIDEO_ID formatı (kısa URL)
          if (url.hostname.includes("youtu.be")) {
            const videoId = url.pathname.substring(1).split(/[/?#&]/)[0];
            if (this.isValidYouTubeId(videoId)) {
              console.log(`✓ youtu.be/ formatından ID bulundu: ${videoId}`);
              return videoId;
            }
          }

          // youtube.com/embed/VIDEO_ID formatı (gömülü video)
          if (
            url.hostname.includes("youtube.com") &&
            url.pathname.includes("/embed/")
          ) {
            const videoId = url.pathname
              .split("/embed/")[1]
              ?.split(/[/?#&]/)[0];
            if (this.isValidYouTubeId(videoId)) {
              console.log(
                `✓ youtube.com/embed/ formatından ID bulundu: ${videoId}`
              );
              return videoId;
            }
          }

          // youtube.com/shorts/VIDEO_ID formatı (YouTube Shorts)
          if (
            url.hostname.includes("youtube.com") &&
            url.pathname.includes("/shorts/")
          ) {
            const videoId = url.pathname
              .split("/shorts/")[1]
              ?.split(/[/?#&]/)[0];
            if (this.isValidYouTubeId(videoId)) {
              console.log(
                `✓ youtube.com/shorts/ formatından ID bulundu: ${videoId}`
              );
              return videoId;
            }
          }
        } catch (urlError) {
          console.warn(
            `⚠️ URL ayrıştırma hatası (${itemLink.substring(0, 30)}...): ${
              urlError.message
            }`
          );

          // URL ayrıştırılamasa bile regex ile ID çıkarmayı dene
          const patterns = [
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&|$)/,
            /youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
          ];

          for (const pattern of patterns) {
            const match = itemLink.match(pattern);
            if (match && match[1] && this.isValidYouTubeId(match[1])) {
              console.log(`✓ Regex ile URL'den ID bulundu: ${match[1]}`);
              return match[1];
            }
          }
        }
      }

      // Format 3: GUID'den ID çıkarma
      if (itemGuid) {
        // GUID içinde v= parametresi var mı?
        const vMatch = itemGuid.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/);
        if (vMatch && vMatch[1] && this.isValidYouTubeId(vMatch[1])) {
          console.log(`✓ GUID'den v= parametresi ile ID bulundu: ${vMatch[1]}`);
          return vMatch[1];
        }

        // GUID içinde video ID var mı?
        if (this.isValidYouTubeId(itemGuid)) {
          console.log(`✓ GUID direkt ID formatında: ${itemGuid}`);
          return itemGuid;
        }

        // GUID'de youtube.com veya youtu.be URL'si var mı?
        const guidUrlMatch = itemGuid.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})(?:&|$|\/|\?)/
        );
        if (
          guidUrlMatch &&
          guidUrlMatch[1] &&
          this.isValidYouTubeId(guidUrlMatch[1])
        ) {
          console.log(
            `✓ GUID'de YouTube URL'den ID bulundu: ${guidUrlMatch[1]}`
          );
          return guidUrlMatch[1];
        }
      }

      // Boşlukları temizleyip içeriğinde 11 karakterlik ID formatına uygun bir dizi olup olmadığını kontrol et
      const content = item.description || item.content || item.title || "";
      if (typeof content === "string" && content.length > 0) {
        const idMatch = content.match(/([a-zA-Z0-9_-]{11})/g);
        if (idMatch && idMatch.length > 0) {
          // Bulunan ID'leri doğrula
          for (const potentialId of idMatch) {
            if (this.isValidYouTubeId(potentialId)) {
              console.log(
                `⚠️ İçerikten potansiyel ID bulundu (güvenilirliği düşük): ${potentialId}`
              );
              return potentialId; // İlk bulunan geçerli ID'yi döndür
            }
          }
        }
      }

      // Son çare: Thumbnail URL'sinden ID çıkarmayı dene
      if (item.thumbnail && typeof item.thumbnail === "string") {
        const thumbnailMatch = item.thumbnail.match(
          /\/vi\/([a-zA-Z0-9_-]{11})\/|\/([a-zA-Z0-9_-]{11})\/hqdefault/
        );
        if (
          thumbnailMatch &&
          (thumbnailMatch[1] || thumbnailMatch[2]) &&
          this.isValidYouTubeId(thumbnailMatch[1] || thumbnailMatch[2])
        ) {
          const thumbnailId = thumbnailMatch[1] || thumbnailMatch[2];
          console.log(`✓ Thumbnail URL'den ID bulundu: ${thumbnailId}`);
          return thumbnailId;
        }
      }

      console.warn(
        `❌ Hiçbir yöntemle YouTube ID bulunamadı: "${
          item.title?.substring(0, 30) || "Başlıksız"
        }..."`
      );
      return null;
    } catch (error) {
      console.error(`❌ Video ID çıkarma hatası: ${error.message}`, error);
      return null;
    }
  }

  /**
   * YouTube video ID formatını doğrular
   * @param {string} id - Doğrulanacak video ID
   * @returns {boolean} - Geçerli bir ID mi?
   */
  isValidYouTubeId(id) {
    if (!id || typeof id !== "string") return false;

    // YouTube video ID'leri genellikle 11 karakter uzunluğunda ve
    // a-z, A-Z, 0-9, _, ve - karakterlerinden oluşur
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  /**
   * YouTube video süresini çıkarır (ISO 8601 duration format)
   * @param {Object} item - Feed öğesi
   * @returns {string|null} - Video süresi (örn: "PT10M30S" - 10 dakika 30 saniye)
   */
  extractYoutubeVideoDuration(item) {
    try {
      // YouTube XML beslemesinde <yt:duration> etiketi içinde "seconds" özelliği
      if (item.ytDuration && item.ytDuration.seconds) {
        const seconds = parseInt(item.ytDuration.seconds);
        if (!isNaN(seconds)) {
          // Saniyeyi ISO 8601 duration formatına dönüştür (PT{H}H{M}M{S}S)
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const remainingSeconds = seconds % 60;

          let duration = "PT";
          if (hours > 0) duration += `${hours}H`;
          if (minutes > 0) duration += `${minutes}M`;
          if (remainingSeconds > 0 || (hours === 0 && minutes === 0))
            duration += `${remainingSeconds}S`;

          return duration;
        }
      }

      // Özel duration alanını kontrol et
      if (item.duration) {
        return item.duration;
      }

      // İçerik açıklamasında süre bilgisini ara (örn: "10:30")
      if (item.description) {
        // "Duration: 10:30" veya "Length: 10:30" gibi desenleri ara
        const durationMatch = item.description.match(
          /(?:Duration|Length|Süre)\s*:\s*(\d+:)?(\d+):(\d+)/i
        );
        if (durationMatch) {
          const hours = durationMatch[1]
            ? parseInt(durationMatch[1].replace(":", ""))
            : 0;
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseInt(durationMatch[3]);

          if (!isNaN(minutes) && !isNaN(seconds)) {
            let duration = "PT";
            if (hours > 0) duration += `${hours}H`;
            if (minutes > 0) duration += `${minutes}M`;
            if (seconds > 0 || (hours === 0 && minutes === 0))
              duration += `${seconds}S`;

            return duration;
          }
        }
      }

      // Süre bulunamazsa null döndür
      return null;
    } catch (error) {
      console.warn("Video süresini çıkarma hatası:", error);
      return null;
    }
  }
}

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
   * @param {number} options.maxItems - Maksimum öğe sayısı (varsayılan: 20)
   * @returns {Promise<Object>} - Ayrıştırılmış besleme
   */
  async parseYoutubeFeed(url, options = {}) {
    const { skipCache = false, maxItems = 20 } = options;

    try {
      console.log(`Parsing YouTube feed: ${url}`);

      // Feed'i çek
      const feed = await this.fetchWithProxy(url, skipCache);

      if (!feed || !feed.items) {
        return { title: "Unknown Channel", items: [] };
      }

      // YouTube feed verilerini hazırla
      const processedFeed = {
        title: feed.title || "Unknown Channel",
        description: feed.description || "",
        link: feed.link || "",
        icon: feed.image?.url || null,
        language: feed.language || "en",
        lastUpdated: feed.lastBuildDate || new Date().toISOString(),
        items: [],
      };

      // YouTube öğelerini işle
      const items = feed.items || [];

      // Tüm öğeleri işleyerek shorts ve normal videolara ayır
      const processedItems = items
        .map((item) => {
          // Video ID'sini çıkar
          const videoId = this.extractYoutubeVideoId(item);
          // Video URL'i kontrol et
          const itemLink =
            typeof item.link === "string" ? item.link.trim() : "";
          // YouTube Shorts kontrolü
          const isShort = itemLink.includes("/shorts/");
          // Videoda açıklama/özet kontrolü
          const description = item.contentSnippet || item.description || "";

          // Öğeyi hazırla
          return {
            title: item.title || "Untitled Video",
            link: itemLink,
            description: description,
            content: item.content || item.contentSnippet || "",
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            guid: item.guid || item.id || videoId || "",
            thumbnail: videoId
              ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
              : null,
            author: item.author || "",
            videoId: videoId,
            isShort: isShort,
            type: isShort ? "shorts" : "video",
          };
        })
        .filter((item) => item.videoId); // Sadece video ID'si olan öğeleri al

      // Shorts ve normal videoları ayır
      const shortsVideos = processedItems.filter((item) => item.isShort);
      const normalVideos = processedItems.filter((item) => !item.isShort);

      console.log(
        `YouTube feed: ${shortsVideos.length} Shorts, ${normalVideos.length} normal videolar bulundu`
      );

      // Shorts videoları için üst sınır (maksimum öğelerin %30'u olacak şekilde)
      const maxShortsCount = Math.floor(maxItems * 0.3);
      const maxNormalCount =
        maxItems - Math.min(shortsVideos.length, maxShortsCount);

      // İki diziyi sınırlı sayıda birleştir
      const selectedShorts = shortsVideos.slice(0, maxShortsCount);
      const selectedNormals = normalVideos.slice(0, maxNormalCount);

      // Önce normal videoları, sonra Shorts videoları ekle (böylece normal videolar öncelikli olur)
      processedFeed.items = [...selectedNormals, ...selectedShorts];

      // Son kontrol - eğer toplam öğe sayısı maxItems değerinden fazlaysa, kırp
      if (processedFeed.items.length > maxItems) {
        processedFeed.items = processedFeed.items.slice(0, maxItems);
      }

      console.log(
        `YouTube feed: ${processedFeed.items.length} video işlendi (${selectedShorts.length} Shorts, ${selectedNormals.length} normal)`
      );

      return processedFeed;
    } catch (error) {
      console.error("YouTube parsing error:", error);
      throw new Error(`YouTube feed could not be parsed: ${error.message}`);
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
      console.log(`Fetching feed: ${feedUrl}`);

      // Önbellekten veri kontrolü - client-side ve localStorage mevcutsa
      let hasLocalStorage = false;
      try {
        hasLocalStorage =
          typeof window !== "undefined" && window.localStorage !== undefined;
      } catch (e) {
        console.warn("localStorage may not be accessible:", e);
      }

      // Önbellek anahtarı
      const cacheKey = `feed_cache_${feedUrl}`;
      const cacheTime = 5 * 60 * 1000; // 5 dakika

      // Önbellekten veri kontrolü
      if (!skipCache && hasLocalStorage) {
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const cache = JSON.parse(cachedData);
            const now = new Date().getTime();

            // Önbellekteki veri süresi geçerli mi?
            if (cache.timestamp && now - cache.timestamp < cacheTime) {
              console.log("Feed data retrieved from cache");

              // Öğe sayısını 20 ile sınırla
              if (
                cache.data &&
                cache.data.items &&
                cache.data.items.length > 20
              ) {
                cache.data.items = cache.data.items.slice(0, 20);
              }

              return cache.data;
            }
          }
        } catch (cacheError) {
          console.warn("Cache access error:", cacheError);
        }
      }

      // Doğrudan veya proxy ile feed verilerini çek
      let feed;
      try {
        // Önce doğrudan bağlantıyı dene
        feed = await this.parser.parseURL(feedUrl);
      } catch (directError) {
        console.warn("Direct connection error, trying proxy");

        // Proxy üzerinden dene
        const response = await fetch("/api/feed-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: feedUrl }),
        });

        if (!response.ok) {
          throw new Error(`Proxy error: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(`Proxy error: ${result.error}`);
        }

        feed = result.feed;
      }

      // Öğe sayısını 20 ile sınırla
      if (feed && feed.items && feed.items.length > 20) {
        feed.items = feed.items.slice(0, 20);
      }

      // Önbelleğe kaydet
      if (!skipCache && hasLocalStorage && feed) {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: new Date().getTime(),
              data: feed,
            })
          );
          console.log("Feed data saved to cache");
        } catch (storageError) {
          console.warn("Error saving to cache:", storageError);
        }
      }

      return feed;
    } catch (error) {
      console.error("Error fetching feed:", error);
      throw new Error(`Failed to fetch feed: ${error.message}`);
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
    if (!item) return null;

    // ID, link ve guid için değerleri al
    const itemId = typeof item.id === "string" ? item.id.trim() : "";
    const itemLink = typeof item.link === "string" ? item.link.trim() : "";
    const itemGuid = typeof item.guid === "string" ? item.guid.trim() : "";

    // 1. yt:video:ID formatından ID çıkarma
    if (itemId && itemId.includes("yt:video:")) {
      const videoId = itemId
        .split("yt:video:")
        .pop()
        .split(/[/?#&]/)[0];
      if (this.isValidYouTubeId(videoId)) {
        return videoId;
      }
    }

    // 2. YouTube URL'lerinden ID çıkarma
    if (itemLink) {
      // URL parametrelerinden v değerini al
      const vMatch = itemLink.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/);
      if (vMatch && vMatch[1] && this.isValidYouTubeId(vMatch[1])) {
        return vMatch[1];
      }

      // youtu.be/ID formatından ID al
      const shortMatch = itemLink.match(
        /youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/
      );
      if (shortMatch && shortMatch[1] && this.isValidYouTubeId(shortMatch[1])) {
        return shortMatch[1];
      }

      // Embed formatından ID al
      const embedMatch = itemLink.match(
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/
      );
      if (embedMatch && embedMatch[1] && this.isValidYouTubeId(embedMatch[1])) {
        return embedMatch[1];
      }
    }

    // 3. GUID'den ID çıkarma
    if (itemGuid) {
      // v parametresi içeren GUID
      const vMatch = itemGuid.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/);
      if (vMatch && vMatch[1] && this.isValidYouTubeId(vMatch[1])) {
        return vMatch[1];
      }

      // Doğrudan ID olan GUID
      if (this.isValidYouTubeId(itemGuid)) {
        return itemGuid;
      }
    }

    // 4. Thumbnail URL'den ID çıkarma
    if (item.thumbnail && typeof item.thumbnail === "string") {
      const thumbnailMatch = item.thumbnail.match(
        /\/vi\/([a-zA-Z0-9_-]{11})\/|\/([a-zA-Z0-9_-]{11})\/hqdefault/
      );
      if (thumbnailMatch && (thumbnailMatch[1] || thumbnailMatch[2])) {
        const thumbnailId = thumbnailMatch[1] || thumbnailMatch[2];
        if (this.isValidYouTubeId(thumbnailId)) {
          return thumbnailId;
        }
      }
    }

    return null;
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

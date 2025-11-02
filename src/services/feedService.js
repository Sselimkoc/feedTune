/**
 * Feed Service - API çağrılarını ve business logic'i merkezi yerde yönet
 * YouTube ve RSS feed işlemleri için servis
 */

const FEED_TYPES = {
  YOUTUBE: "youtube",
  RSS: "rss",
};

/**
 * YouTube channel'ı URL veya keyword ile ara/preview yap
 * @param {string} input - YouTube URL veya channel adı
 * @returns {Promise<Object>} Channel bilgileri
 */
export const searchYoutubeChannel = async (input) => {
  try {
    const res = await fetch("/api/youtube/channel-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(input)
          ? { url: input }
          : { keyword: input }
      ),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to search YouTube channel");
    }

    return data;
  } catch (error) {
    console.error("YouTube search error:", error);
    throw error;
  }
};

/**
 * RSS feed'i preview yap
 * @param {string} url - RSS feed URL'si
 * @returns {Promise<Object>} Feed bilgileri
 */
export const previewRssFeed = async (url) => {
  try {
    const res = await fetch("/api/rss-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to preview RSS feed");
    }

    return data;
  } catch (error) {
    console.error("RSS preview error:", error);
    throw error;
  }
};

/**
 * YouTube URL'sini kontrol et
 * @param {string} url - Kontrol edilecek URL
 * @returns {boolean}
 */
export const isYoutubeUrl = (url) => {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
};

/**
 * Görüntü URL'sini proxy üzerinden al
 * @param {string} url - Orijinal görüntü URL'si
 * @returns {string|null} Proxy edilmiş URL veya null
 */
export const getProxiedImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

/**
 * Feed objesini standardize et (YouTube veya RSS)
 * @param {Object} rawData - API'den gelen ham veri
 * @param {string} type - Feed tipi ('youtube' veya 'rss')
 * @returns {Object} Standardize edilmiş feed objesi
 */
export const normalizeFeedData = (rawData, type) => {
  if (type === FEED_TYPES.YOUTUBE) {
    const channel = rawData.channel || rawData;
    return {
      title: channel.title || "",
      description: channel.description || "",
      thumbnail: channel.thumbnail || null,
      subscribersFormatted: channel.subscribersFormatted || null,
      type: FEED_TYPES.YOUTUBE,
      url: channel.url || "",
    };
  }

  if (type === FEED_TYPES.RSS) {
    const feed = rawData.feed || rawData;
    return {
      title: feed.title || "",
      description: feed.description || "",
      icon: feed.icon || null,
      type: FEED_TYPES.RSS,
      url: rawData.url || "",
    };
  }

  return rawData;
};

/**
 * Multiple YouTube channels'ı döndür (search results)
 * @param {Array} channels - Channel array'i
 * @returns {Array} Normalize edilmiş channel array'i
 */
export const normalizeChannelResults = (channels) => {
  return channels.map((channel) => ({
    title: channel.title || "",
    description: channel.description || "",
    thumbnail: channel.thumbnail || null,
    subscribersFormatted: channel.subscribersFormatted || null,
    url: channel.url || "",
  }));
};

/**
 * Kategori adından UUID'ye map et
 * @param {string} categoryValue - Kategori value ('general', 'tech', vs)
 * @returns {string|null} Kategori UUID'si
 */
export const mapCategoryToUUID = (categoryValue) => {
  // Backend kategorileri için UUID mapping
  // Bu UUIDler database'deki kategori IDs'dir
  const categoryMap = {
    general: "550e8400-e29b-41d4-a716-446655440001",
    tech: "550e8400-e29b-41d4-a716-446655440002",
    news: "550e8400-e29b-41d4-a716-446655440003",
    entertainment: "550e8400-e29b-41d4-a716-446655440004",
    other: "550e8400-e29b-41d4-a716-446655440005",
  };

  return categoryMap[categoryValue] || categoryMap.general;
};

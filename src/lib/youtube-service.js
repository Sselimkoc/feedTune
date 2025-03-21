/**
 * YouTube Servisi
 *
 * YouTube kanallarının yönetimi, ayrıştırılması ve veritabanına kaydedilmesi için
 * merkezi bir hizmet sağlar.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * YouTube kanal bilgilerini getir
 * @param {string} channelId - YouTube kanal ID'si, kullanıcı adı veya URL
 * @returns {Promise<Object>} - Kanal bilgileri
 */
export async function parseYoutubeChannel(channelId) {
  try {
    // Kanal ID, kullanıcı adı veya URL olabilir
    const normalizedChannelId = normalizeChannelId(channelId);

    if (!normalizedChannelId) {
      throw new Error(
        "Geçerli bir YouTube kanal ID'si, kullanıcı adı veya URL girin"
      );
    }

    // Eğer bu tam kanal ID'si ise doğrudan getir
    if (
      normalizedChannelId.startsWith("UC") &&
      normalizedChannelId.length >= 11
    ) {
      return await getChannelById(normalizedChannelId);
    }

    // @ işareti içeren veya kısa isim içeren sorgularda önce kanal ara
    return await searchAndGetChannels(normalizedChannelId);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("YouTube API zaman aşımına uğradı");
    }
    console.error("YouTube kanal ayrıştırma hatası:", error);
    throw new Error(`YouTube kanal ayrıştırma hatası: ${error.message}`);
  }
}

/**
 * YouTube kanal ID'sini normalize et
 * @param {string} channelId - YouTube kanal ID'si, kullanıcı adı veya URL
 * @returns {string} - Normalize edilmiş kanal ID'si
 */
function normalizeChannelId(channelId) {
  if (!channelId) return null;

  // Boşlukları temizle
  channelId = channelId.trim();

  // Çok uzun girdileri reddet
  if (channelId.length > 2000) {
    throw new Error("Kanal ID veya URL çok uzun");
  }

  try {
    // Eğer bir URL ise
    if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
      const url = new URL(
        channelId.startsWith("http") ? channelId : `https://${channelId}`
      );

      // youtube.com/channel/ID formatı
      if (url.pathname.includes("/channel/")) {
        return url.pathname.split("/channel/")[1].split("/")[0];
      }

      // youtube.com/c/USERNAME formatı - bu durumda API ile çözümleme gerekir
      if (url.pathname.includes("/c/") || url.pathname.includes("/user/")) {
        // Bu durum için daha karmaşık bir çözüm gerekebilir
        return (
          url.pathname.split("/c/")[1]?.split("/")[0] ||
          url.pathname.split("/user/")[1]?.split("/")[0]
        );
      }

      // youtube.com/@USERNAME formatı - @ işaretini koruyarak döndür
      if (url.pathname.startsWith("/@")) {
        return url.pathname; // Tam yol döndür: "/@username"
      }
    }

    // @ ile başlayan bir kullanıcı adı ise - olduğu gibi koru
    if (channelId.startsWith("@")) {
      return channelId; // @ işaretini koruyarak döndür
    }

    // Düz bir kanal ID'si veya kullanıcı adı ise
    return channelId;
  } catch (error) {
    console.error("Kanal ID normalizasyon hatası:", error);
    throw new Error("Geçerli bir YouTube kanal ID'si veya URL'si girin");
  }
}

/**
 * Kanalın son videolarını getir
 * @param {string} playlistId - Kanal yüklemeleri playlist ID'si
 * @returns {Promise<Array>} - Son videolar listesi
 */
async function getRecentVideos(playlistId) {
  if (!playlistId) return [];

  try {
    // AbortController ile timeout uygula
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 saniye timeout

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=10&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "FeedTune/1.0 YouTube Parser",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`YouTube API hatası: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      // Video verilerini dönüştür ve maksimum sayıyı sınırla
      const maxVideos = 20; // En fazla 20 video getir
      return data.items.slice(0, maxVideos).map((item) => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title || "İsimsiz Video",
        description: item.snippet.description || "",
        thumbnail:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.default?.url,
        publishedAt:
          item.contentDetails.videoPublishedAt ||
          item.snippet.publishedAt ||
          new Date().toISOString(),
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle || "İsimsiz Kanal",
        link: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      }));
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("YouTube video getirme zaman aşımına uğradı");
      return []; // Boş dizi döndür, uygulamanın çalışmaya devam etmesini sağla
    }
    console.error("YouTube videoları getirme hatası:", error);
    return [];
  }
}

/**
 * YouTube kanalı ekle
 * @param {string} channelId - YouTube kanal ID'si, kullanıcı adı veya URL
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} - Eklenen kanal bilgisi
 */
export async function addYoutubeChannel(channelId, userId) {
  const supabase = createClientComponentClient();

  try {
    // Önce YouTube kanalını ayrıştır
    const channelData = await parseYoutubeChannel(channelId);

    if (!channelData || !channelData.channel) {
      throw new Error("Kanal bilgileri alınamadı");
    }

    const channel = channelData.channel;

    // Feeds tablosuna ekle
    const { data: newFeed, error: feedError } = await supabase
      .from("feeds")
      .insert([
        {
          user_id: userId,
          type: "youtube",
          title: channel.title,
          link: `https://www.youtube.com/channel/${channel.id}`,
          description: channel.description,
          site_favicon: channel.thumbnailUrl,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (feedError) throw feedError;

    // YouTube feeds tablosuna ekle
    const { error: youtubeError } = await supabase
      .from("youtube_feeds")
      .insert([
        {
          id: newFeed.id,
          channel_id: channel.id,
          channel_title: channel.title,
          channel_thumbnail: channel.thumbnailUrl,
          subscriber_count: parseInt(channel.subscriberCount) || 0,
          video_count: parseInt(channel.videoCount) || 0,
          playlist_id: channel.uploadsPlaylistId,
        },
      ]);

    if (youtubeError) throw youtubeError;

    // Feed öğelerini ekle
    if (channelData.videos && channelData.videos.length > 0) {
      const feedItems = channelData.videos.map((video) => ({
        feed_id: newFeed.id,
        title: video.title,
        link: video.link,
        description: video.description,
        content: video.description,
        author: video.channelTitle,
        published_at: new Date(video.publishedAt).toISOString(),
        guid: video.id,
        thumbnail: video.thumbnail,
        created_at: new Date().toISOString(),
      }));

      // YouTube item details'e de ekle
      const { error: itemsError } = await supabase
        .from("feed_items")
        .insert(feedItems);

      if (itemsError) {
        console.error("Feed öğeleri ekleme hatası:", itemsError);
      } else {
        // Her video için youtube_item_details'e ekle
        const itemDetails = await Promise.all(
          channelData.videos.map(async (video) => {
            // Önce feed_items tablosundaki id'yi al
            const { data: feedItem } = await supabase
              .from("feed_items")
              .select("id")
              .eq("feed_id", newFeed.id)
              .eq("guid", video.id)
              .single();

            if (feedItem) {
              return {
                item_id: feedItem.id,
                video_id: video.id,
                duration: null, // API'den alınabilir
                view_count: 0, // API'den alınabilir
                like_count: 0, // API'den alınabilir
                comment_count: 0, // API'den alınabilir
              };
            }

            return null;
          })
        );

        const validItemDetails = itemDetails.filter((item) => item !== null);

        if (validItemDetails.length > 0) {
          const { error: detailsError } = await supabase
            .from("youtube_item_details")
            .insert(validItemDetails);

          if (detailsError) {
            console.error(
              "YouTube video detayları ekleme hatası:",
              detailsError
            );
          }
        }
      }
    }

    return newFeed;
  } catch (error) {
    console.error("YouTube kanal ekleme hatası:", error);
    throw new Error(`YouTube kanalı eklenirken hata oluştu: ${error.message}`);
  }
}

/**
 * YouTube kanalını güncelle
 * @param {string} feedId - Besleme ID'si
 * @returns {Promise<Object>} - Güncellenen kanal bilgisi
 */
export async function updateYoutubeChannel(feedId) {
  const supabase = createClientComponentClient();

  try {
    // YouTube feed bilgilerini al
    const { data: youtubeFeed, error: youtubeFeedError } = await supabase
      .from("youtube_feeds")
      .select("channel_id, playlist_id")
      .eq("id", feedId)
      .single();

    if (youtubeFeedError) throw youtubeFeedError;

    if (!youtubeFeed || !youtubeFeed.channel_id) {
      throw new Error("YouTube kanal bilgileri bulunamadı");
    }

    // YouTube kanalını ayrıştır
    const channelData = await parseYoutubeChannel(youtubeFeed.channel_id);

    if (!channelData || !channelData.channel) {
      throw new Error("Kanal bilgileri alınamadı");
    }

    const channel = channelData.channel;

    // Feeds tablosunu güncelle
    const { error: feedError } = await supabase
      .from("feeds")
      .update({
        title: channel.title,
        link: `https://www.youtube.com/channel/${channel.id}`,
        description: channel.description,
        site_favicon: channel.thumbnailUrl,
        last_fetched_at: new Date().toISOString(),
      })
      .eq("id", feedId);

    if (feedError) throw feedError;

    // YouTube feeds tablosunu güncelle
    const { error: youtubeError } = await supabase
      .from("youtube_feeds")
      .update({
        channel_title: channel.title,
        channel_thumbnail: channel.thumbnailUrl,
        subscriber_count: parseInt(channel.subscriberCount) || 0,
        video_count: parseInt(channel.videoCount) || 0,
        playlist_id: channel.uploadsPlaylistId,
      })
      .eq("id", feedId);

    if (youtubeError) throw youtubeError;

    // Feed öğelerini güncelle
    if (channelData.videos && channelData.videos.length > 0) {
      const feedItems = channelData.videos.map((video) => ({
        feed_id: feedId,
        title: video.title,
        link: video.link,
        description: video.description,
        content: video.description,
        author: video.channelTitle,
        published_at: new Date(video.publishedAt).toISOString(),
        guid: video.id,
        thumbnail: video.thumbnail,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from("feed_items")
        .upsert(feedItems, {
          onConflict: "feed_id,guid",
          ignoreDuplicates: false,
        });

      if (itemsError) {
        console.error("Feed öğeleri güncelleme hatası:", itemsError);
      }
    }

    return { success: true, message: "YouTube kanalı başarıyla güncellendi" };
  } catch (error) {
    console.error("YouTube kanal güncelleme hatası:", error);
    throw new Error(
      `YouTube kanalı güncellenirken hata oluştu: ${error.message}`
    );
  }
}

/**
 * YouTube kanalını sil
 * @param {string} feedId - Besleme ID'si
 * @returns {Promise<Object>} - Silme sonucu
 */
export async function deleteYoutubeChannel(feedId) {
  const supabase = createClientComponentClient();

  try {
    // Feeds tablosunda is_active'i false yap (soft delete)
    const { error: feedError } = await supabase
      .from("feeds")
      .update({ is_active: false })
      .eq("id", feedId);

    if (feedError) throw feedError;

    return { success: true, message: "YouTube kanalı başarıyla silindi" };
  } catch (error) {
    console.error("YouTube kanal silme hatası:", error);
    throw new Error(`YouTube kanalı silinirken hata oluştu: ${error.message}`);
  }
}

/**
 * Kanal ID'sine göre kanal detaylarını getir
 * @param {string} channelId - YouTube kanal ID'si
 * @returns {Promise<Object>} - Kanal bilgileri
 */
async function getChannelById(channelId) {
  // YouTube API üzerinden kanal bilgilerini al (AbortController ile timeout uygula)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`;

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FeedTune/1.0 YouTube Parser",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`YouTube API hatası: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("Kanal bulunamadı");
    }

    const channelData = data.items[0];

    // Kanal verilerini temizle ve dönüştür
    const transformedChannel = {
      id: channelData.id,
      title: channelData.snippet.title || "İsimsiz Kanal",
      description: channelData.snippet.description || "",
      thumbnailUrl:
        channelData.snippet.thumbnails.high?.url ||
        channelData.snippet.thumbnails.default?.url,
      subscriberCount: channelData.statistics.subscriberCount || "0",
      videoCount: channelData.statistics.videoCount || "0",
      publishedAt: channelData.snippet.publishedAt,
      uploadsPlaylistId: channelData.contentDetails?.relatedPlaylists?.uploads,
    };

    // Son videoları da getir
    const videos = await getRecentVideos(transformedChannel.uploadsPlaylistId);

    return {
      channel: transformedChannel,
      videos: videos,
      suggestedChannels: [], // Tam ID eşleşmesinde önerilen kanal yok
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Kanal ara ve detaylarını getir
 * @param {string} query - Arama sorgusu
 * @returns {Promise<Object>} - En iyi eşleşen kanal ve önerilen kanallar
 */
async function searchAndGetChannels(query) {
  // AbortController ile timeout uygula
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Search API ile kanalları ara (en fazla 5 sonuç)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=channel&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`;

    const searchResponse = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FeedTune/1.0 YouTube Parser",
      },
    });

    clearTimeout(timeoutId);

    if (!searchResponse.ok) {
      throw new Error(`YouTube API hatası: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("Kanal bulunamadı");
    }

    // İlk sonucu ana kanal olarak belirle
    const mainChannelId = searchData.items[0].id.channelId;
    const mainChannelData = await getChannelById(mainChannelId);

    // Diğer kanalların ID'lerini topla
    const suggestedChannelIds = searchData.items
      .slice(1)
      .map((item) => item.id.channelId);

    // Önerilen kanallar için detaylı bilgileri getir
    let suggestedChannels = [];

    if (suggestedChannelIds.length > 0) {
      // Tüm önerilen kanalların ID'lerini birleştir
      const channelIdsParam = suggestedChannelIds.join(",");

      // Channels API ile detaylı bilgileri al
      const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelIdsParam}&key=${process.env.YOUTUBE_API_KEY}`;

      try {
        const channelsResponse = await fetch(channelsUrl, {
          headers: {
            "User-Agent": "FeedTune/1.0 YouTube Parser",
          },
        });

        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();

          if (channelsData.items && channelsData.items.length > 0) {
            // Detaylı kanal bilgilerini dönüştür
            suggestedChannels = channelsData.items.map((channel) => ({
              id: channel.id,
              title: channel.snippet.title || "İsimsiz Kanal",
              description: channel.snippet.description || "",
              thumbnailUrl:
                channel.snippet.thumbnails.high?.url ||
                channel.snippet.thumbnails.medium?.url ||
                channel.snippet.thumbnails.default?.url,
              subscriberCount: channel.statistics.subscriberCount || "0",
              videoCount: channel.statistics.videoCount || "0",
              publishedAt: channel.snippet.publishedAt,
              uploadsPlaylistId:
                channel.contentDetails?.relatedPlaylists?.uploads,
            }));
          }
        }
      } catch (error) {
        console.error("Önerilen kanallar için detay getirme hatası:", error);
        // Hata durumunda temel bilgilerle devam et
        suggestedChannels = searchData.items.slice(1).map((item) => ({
          id: item.id.channelId,
          title: item.snippet.title || "İsimsiz Kanal",
          description: item.snippet.description || "",
          thumbnailUrl:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
        }));
      }
    } else {
      // Önerilen kanal yoksa boş dizi döndür
      suggestedChannels = [];
    }

    // Ana kanalı ve önerilen kanalları döndür
    return {
      ...mainChannelData,
      suggestedChannels: suggestedChannels,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

import { NextResponse } from "next/server";
import { getChannelVideos } from "@/lib/youtube/fetch-client";
import { youtubeService } from "@/lib/youtube/service";

/**
 * YouTube Channel Videos API
 * Bu endpoint, belirli bir YouTube kanalına ait videoları getirir
 */

/**
 * Videoları formatlayan yardımcı fonksiyon
 * @param {Array} videos - YouTube API'den gelen video listesi
 * @returns {Array} - Formatlanmış video listesi
 */
function formatVideos(videos) {
  if (!videos || !Array.isArray(videos)) return [];

  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description
      ? video.description.length > 150
        ? video.description.substring(0, 150) + "..."
        : video.description
      : "",
    thumbnail: video.thumbnail,
    publishedAt: video.publishedAt,
    url: video.url || `https://youtube.com/watch?v=${video.id}`,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
  }));
}

/**
 * YouTube kanal videolarını getiren endpoint
 *
 * POST /api/youtube/channel-videos
 * Body:
 * - channelId: YouTube kanal ID'si
 * - maxResults: Maksimum sonuç sayısı (opsiyonel, varsayılan: 20)
 */
export async function POST(request) {
  console.log("YouTube kanal videoları API POST çağrıldı");

  try {
    // İstek gövdesini JSON olarak ayrıştır
    const body = await request.json().catch((e) => {
      console.error("JSON parsing error:", e);
      return {};
    });

    console.log("Request body:", body);

    const { channelId, maxResults = 20 } = body;

    // Kanal ID'si gerekli
    if (!channelId) {
      console.error(
        "YouTube kanal videoları için channelId parametresi gerekli"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Kanal ID'si belirtmelisiniz",
        },
        { status: 400 }
      );
    }

    // Önce kanal bilgilerini alalım
    let channelTitle = "";
    let channelThumbnail = "";
    try {
      const channelInfo = await youtubeService.getChannelInfo(channelId);
      if (channelInfo) {
        channelTitle = channelInfo.title || "";
        channelThumbnail = channelInfo.thumbnail || "";
      }
    } catch (channelError) {
      console.warn("Kanal bilgileri alınamadı:", channelError);
      // Kanal bilgileri olmasa da devam edebiliriz
    }

    // Video listesini alalım
    const videos = await getChannelVideos(channelId, Math.min(maxResults, 50));

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        channelId,
        channelTitle,
        channelThumbnail,
        videos: [],
        message: "Kanalda video bulunamadı",
      });
    }

    // Formatlanmış videoları döndür
    return NextResponse.json({
      success: true,
      channelId,
      channelTitle,
      channelThumbnail,
      videos: formatVideos(videos),
      totalCount: videos.length,
    });
  } catch (error) {
    console.error("YouTube kanal videoları çekilirken hata:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "YouTube kanal videoları çekilirken bir hata oluştu: " +
          error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET metodu için destek
 */
export async function GET(request) {
  console.log("YouTube kanal videoları servisi GET çağrıldı");

  // Query parametrelerini incele
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const maxResults = searchParams.get("maxResults") || 20;

  // Eğer kanal ID parametresi varsa, videoları getir
  if (channelId) {
    console.log("GET isteği ile channelId tespit edildi, videolar getiriliyor");

    // POST metoduna yönlendir
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelId, maxResults }),
      })
    );
  }

  // Kanal ID parametresi yoksa, sadece durum bilgisi döndür
  return NextResponse.json({
    status: "YouTube kanal videoları servisi çalışıyor",
    time: new Date().toISOString(),
    note: "Video listesi için channelId parametresi ekleyin",
  });
}

import { NextResponse } from "next/server";
import { searchChannels, getVideoById } from "@/lib/youtube/fetch-client";

/**
 * YouTube Video Search API
 * Bu endpoint, YouTube video arama işlevleri sağlar
 */

/**
 * YouTube videolarını arama endpoint'i
 *
 * POST /api/youtube/video-search
 * Body:
 * - query: Arama sorgusu
 * - maxResults: Maksimum sonuç sayısı (opsiyonel, varsayılan: 10)
 */
export async function POST(request) {
  console.log("YouTube video arama API POST çağrıldı");

  try {
    // İstek gövdesini JSON olarak ayrıştır
    const body = await request.json().catch((e) => {
      console.error("JSON parsing error:", e);
      return {};
    });

    console.log("Request body:", body);

    const { query, maxResults = 10 } = body;

    // Arama sorgusu gerekli
    if (!query) {
      console.error("YouTube video araması için query parametresi gerekli");
      return NextResponse.json(
        {
          success: false,
          error: "Arama için sorgu belirtmelisiniz",
        },
        { status: 400 }
      );
    }

    // YouTube Data API'ye istek yapmak yerine, önce ilgili kanalı arayalım
    // ve daha sonra o kanalın videolarını çekelim
    // Bu yaklaşım, YouTube API kotasını daha verimli kullanır
    const channels = await searchChannels(query, 1);

    if (!channels || channels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu arama için YouTube kanalı bulunamadı",
          videos: [],
        },
        { status: 404 }
      );
    }

    // İlk kanalın ID'sini kullan
    const channelId = channels[0].id;

    // Kanal ID'sini kullanarak video listesini alma API'sini çağıracağız
    // ancak burada direkt API çağrısı yerine proxy kullanıyoruz
    const apiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/youtube/channel-videos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          maxResults: Math.min(Number(maxResults) || 10, 30), // En fazla 30 video
        }),
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`Channel videos API error: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();

    if (!apiData.success || !apiData.videos) {
      return NextResponse.json(
        {
          success: false,
          error: "Video bulunamadı",
          videos: [],
        },
        { status: 404 }
      );
    }

    // İlk sonuçları döndür
    return NextResponse.json({
      success: true,
      channelId: channelId,
      channelTitle: channels[0].title,
      query: query,
      videos: apiData.videos,
    });
  } catch (error) {
    console.error("YouTube video araması sırasında hata:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "YouTube video araması sırasında bir hata oluştu: " + error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET metodu için destek
 */
export async function GET(request) {
  console.log("YouTube video arama servisi GET çağrıldı");

  // Query parametrelerini incele
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const maxResults = searchParams.get("maxResults") || 10;

  // Eğer arama parametresi varsa, arama yap
  if (query) {
    console.log(
      "GET isteği ile arama parametresi tespit edildi, arama yapılıyor"
    );

    // POST metoduna yönlendir
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, maxResults }),
      })
    );
  }

  // Arama parametresi yoksa, sadece durum bilgisi döndür
  return NextResponse.json({
    status: "YouTube video arama servisi çalışıyor",
    time: new Date().toISOString(),
    note: "Arama yapmak için query parametresi ekleyin",
  });
}

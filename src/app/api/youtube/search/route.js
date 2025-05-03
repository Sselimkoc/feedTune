import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";
import { youtubeService } from "@/lib/youtube/service";

/**
 * YouTube kanalı aramak için API endpoint
 * Hem URL hem de anahtar kelime ile arama yapabilir
 *
 * @param {object} request - İstek nesnesi
 * @returns {Promise<NextResponse>} - JSON yanıtı
 */
export async function POST(request) {
  console.log("YouTube kanal arama API çağrıldı");

  try {
    // İstek gövdesini JSON olarak ayrıştır
    const body = await request.json();
    const { url, keyword } = body;

    // En az url veya keyword gerekli
    if (!url && !keyword) {
      console.error("YouTube araması için url veya keyword gerekli");
      return NextResponse.json(
        {
          success: false,
          error: "Arama için bir URL veya anahtar kelime belirtmelisiniz",
        },
        { status: 400 }
      );
    }

    let youtubeId = null;

    // URL verilmişse, YouTube ID'yi çıkarmaya çalış
    if (url) {
      if (!isValidUrl(url)) {
        console.error(`Geçersiz URL: ${url}`);
        return NextResponse.json(
          {
            success: false,
            error: "Geçerli bir URL belirtmelisiniz",
          },
          { status: 400 }
        );
      }

      console.log(`URL'den YouTube ID çıkarılıyor: ${url}`);
      youtubeId = await youtubeService.extractYoutubeChannelId(url);

      if (youtubeId) {
        console.log(`YouTube ID bulundu: ${youtubeId}`);

        // YouTube ID'ye göre kanal bilgisini al
        const channelInfo = await youtubeService.getChannelInfo(youtubeId);

        if (channelInfo) {
          return NextResponse.json({
            success: true,
            channel: {
              id: youtubeId,
              title: channelInfo.title || "Bilinmeyen Kanal",
              description: channelInfo.description || "",
              thumbnail: channelInfo.thumbnail || "",
              url: `https://youtube.com/channel/${youtubeId}`,
              subscribers: channelInfo.subscribers || "Bilinmiyor",
              videoCount: channelInfo.video_count || "0",
            },
          });
        }
      }
    }

    // Keyword verilmişse veya URL'den ID çıkarılamadıysa, anahtar kelime araması yap
    if (keyword || (url && !youtubeId)) {
      const searchQuery = keyword || url;
      console.log(`Anahtar kelime ile YouTube araması: ${searchQuery}`);

      // YouTube Data API veya alternatif servis ile arama yap
      const result = await fetchYouTubeChannelSearch(searchQuery);

      if (result && result.id) {
        return NextResponse.json({
          success: true,
          channel: {
            id: result.id,
            title: result.title || "Bilinmeyen Kanal",
            description: result.description || "",
            thumbnail: result.thumbnail || "",
            url: `https://youtube.com/channel/${result.id}`,
            subscribers: result.subscribers || "Bilinmiyor",
            videoCount: result.videoCount || "0",
          },
        });
      }
    }

    // Hiçbir sonuç bulunamadı
    return NextResponse.json({
      success: false,
      error: "Bu arama için YouTube kanalı bulunamadı",
    });
  } catch (error) {
    console.error("YouTube araması sırasında hata:", error);
    return NextResponse.json(
      {
        success: false,
        error: "YouTube araması sırasında bir hata oluştu",
      },
      { status: 500 }
    );
  }
}

/**
 * YouTube kanal araması yapmak için yardımcı fonksiyon
 * Anahtar kelimeye göre YouTube Data API veya alternatif servis kullanarak kanal arar
 *
 * @param {string} query - Arama sorgusu
 * @returns {Promise<object|null>} - Bulunan kanal bilgisi veya null
 */
async function fetchYouTubeChannelSearch(query) {
  try {
    // Kendi YouTube Channel Search API'mizi çağır
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/youtube/channel-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API isteği başarısız oldu: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.channels && data.channels.length > 0) {
      return data.channels[0]; // İlk sonucu döndür
    }

    return null;
  } catch (error) {
    console.error("YouTube kanal araması API hatası:", error);
    return null;
  }
}

/**
 * Servis durumunu kontrol etmek için API endpoint
 *
 * @returns {NextResponse} - JSON yanıtı
 */
export function GET() {
  return NextResponse.json({ status: "YouTube arama servisi çalışıyor" });
}

/**
 * Formats large numbers into readable text (1000 -> 1K, 1000000 -> 1M)
 */
function formatCount(count) {
  if (!count) return "0";

  const num = parseInt(count, 10);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(".0", "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(".0", "") + "K";
  }
  return num.toString();
}

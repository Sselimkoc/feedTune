import { NextResponse } from "next/server";
import { isValidUrl } from "@/lib/utils";
import { youtubeService } from "@/lib/youtube/service";
import { searchChannels, getChannelById } from "@/lib/youtube/fetch-client";

/**
 * YouTube Channel Search API
 * Bu endpoint, tüm YouTube kanal arama işlevlerini tek bir yerde toplar.
 */

/**
 * Sayıları kullanıcı dostu formata dönüştüren yardımcı fonksiyon
 * @param {string|number} num - Formatlanacak sayı
 * @returns {string} - Formatlanmış sayı (örn: 1.2M, 5.7K)
 */
function formatNumber(num) {
  if (!num || isNaN(Number(num))) return "Bilinmiyor";

  num = Number(num);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}

/**
 * YouTube kanallarını arama endpoint'i
 *
 * POST /api/youtube/channel-search
 * Body:
 * - query: Arama sorgusu
 * - url: YouTube URL (opsiyonel)
 * - keyword: Arama anahtar kelimesi (opsiyonel)
 *
 * En az `query` veya `keyword` veya `url` parametrelerinden biri gereklidir.
 */
export async function POST(request) {
  console.log("YouTube kanal arama API POST çağrıldı");

  try {
    // İstek gövdesini JSON olarak ayrıştır
    const body = await request.json().catch((e) => {
      console.error("JSON parsing error:", e);
      return {};
    });

    console.log("Request body:", body);

    const { query, url, keyword } = body;

    // Arama sorgusu önceliği: query > keyword > url
    const searchQuery = query || keyword || url;

    // En az bir arama parametresi gerekli
    if (!searchQuery) {
      console.error("YouTube araması için query, url veya keyword gerekli");
      return NextResponse.json(
        {
          success: false,
          error:
            "Arama için bir sorgu, URL veya anahtar kelime belirtmelisiniz",
        },
        { status: 400 }
      );
    }

    // URL verilmiş ve geçerli bir URL ise, önce kanal ID'yi çıkarmaya çalış
    let channelId = null;
    if (url && isValidUrl(url)) {
      console.log(`URL'den YouTube ID çıkarılıyor: ${url}`);
      try {
        channelId = await youtubeService.extractYoutubeChannelId(url);

        if (channelId) {
          console.log(`YouTube ID bulundu: ${channelId}`);

          // Kanal ID ile direkt bilgileri al
          const channelInfo = await youtubeService.getChannelInfo(channelId);

          if (channelInfo) {
            const subscriberCount =
              channelInfo.statistics?.subscriberCount || "Bilinmiyor";
            const videoCount = channelInfo.statistics?.videoCount || "0";

            return NextResponse.json({
              success: true,
              source: "channel_id",
              channel: {
                id: channelId,
                title: channelInfo.title || "Bilinmeyen Kanal",
                description: channelInfo.description || "",
                thumbnail:
                  channelInfo.thumbnail ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    channelInfo.title || "Channel"
                  )}&background=random&color=fff&size=120`,
                url: `https://youtube.com/channel/${channelId}`,
                subscribers: subscriberCount,
                subscribersFormatted: formatNumber(subscriberCount),
                videoCount: videoCount,
                videoCountFormatted: formatNumber(videoCount),
              },
              channels: [
                {
                  id: channelId,
                  title: channelInfo.title || "Bilinmeyen Kanal",
                  description: channelInfo.description || "",
                  thumbnail:
                    channelInfo.thumbnail ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      channelInfo.title || "Channel"
                    )}&background=random&color=fff&size=120`,
                  publishedAt:
                    channelInfo.publishedAt || new Date().toISOString(),
                  subscribers: subscriberCount,
                  subscribersFormatted: formatNumber(subscriberCount),
                  videoCount: videoCount,
                  videoCountFormatted: formatNumber(videoCount),
                },
              ],
            });
          }
        }
      } catch (error) {
        console.warn(
          "URL'den YouTube ID çıkarılamadı, anahtar kelime aramasına geçiliyor"
        );
      }
    }

    // Kanal ID bulunamadıysa veya URL yoksa, anahtar kelime araması yap
    console.log(`Anahtar kelime ile YouTube araması: "${searchQuery}"`);

    // Fetch-client ile kanal araması yap (401 hatası vermeyen client)
    const results = await searchChannels(searchQuery, 5);

    if (!results || results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu arama için YouTube kanalı bulunamadı",
          channels: [],
        },
        { status: 404 }
      );
    }

    // İlk sonucu ana kanal olarak kullan ve detayları al
    const primaryChannel = results[0];

    // İlk kanal için detaylı bilgi almak için ikinci bir istek yap
    let detailedChannel = primaryChannel;
    let subscriberCount = "Bilinmiyor";
    let videoCount = "0";

    try {
      if (primaryChannel.id) {
        const channelDetails = await getChannelById(primaryChannel.id);
        if (channelDetails && channelDetails.statistics) {
          subscriberCount =
            channelDetails.statistics.subscriberCount || "Bilinmiyor";
          videoCount = channelDetails.statistics.videoCount || "0";
          detailedChannel = {
            ...primaryChannel,
            statistics: channelDetails.statistics,
          };
        }
      }
    } catch (detailError) {
      console.warn("Kanal detayları alınırken hata oluştu:", detailError);
    }

    return NextResponse.json({
      success: true,
      source: "search",
      channel: {
        id: primaryChannel.id,
        title: primaryChannel.title || "Bilinmeyen Kanal",
        description: primaryChannel.description || "",
        thumbnail:
          primaryChannel.thumbnail ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            primaryChannel.title || "Channel"
          )}&background=random&color=fff&size=120`,
        url: `https://youtube.com/channel/${primaryChannel.id}`,
        subscribers: subscriberCount,
        subscribersFormatted: formatNumber(subscriberCount),
        videoCount: videoCount,
        videoCountFormatted: formatNumber(videoCount),
      },
      channels: results.map((channel, index) => ({
        id: channel.id,
        title: channel.title,
        description: channel.description,
        thumbnail:
          channel.thumbnail ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            channel.title || "Channel"
          )}&background=random&color=fff&size=120`,
        publishedAt: channel.publishedAt,
        // Sadece ilk kanal için detaylı bilgileri içerir, diğerleri için varsayılan değerler kullanılır
        subscribers: index === 0 ? subscriberCount : "Bilinmiyor",
        subscribersFormatted:
          index === 0 ? formatNumber(subscriberCount) : "Bilinmiyor",
        videoCount: index === 0 ? videoCount : "0",
        videoCountFormatted: index === 0 ? formatNumber(videoCount) : "0",
      })),
    });
  } catch (error) {
    console.error("YouTube kanal araması sırasında hata:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "YouTube kanal araması sırasında bir hata oluştu: " + error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Servis durumunu kontrol etmek için API endpoint
 */
export async function GET(request) {
  console.log("YouTube kanal arama servisi GET çağrıldı");

  // Query parametrelerini incele ve GET ile de arama yapabilmek için destek ekle
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const keyword = searchParams.get("keyword");
  const url = searchParams.get("url");

  // Eğer arama parametresi varsa, arama yap
  if (query || keyword || url) {
    console.log(
      "GET isteği ile arama parametresi tespit edildi, arama yapılıyor"
    );
    // POST metoduna benzer şekilde işlem yap, sadece parametreler ayrıştırılır
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, keyword, url }),
      })
    );
  }

  // Arama parametresi yoksa, sadece durum bilgisi döndür
  return NextResponse.json({
    status: "YouTube kanal arama servisi çalışıyor",
    time: new Date().toISOString(),
    note: "Arama yapmak için query, keyword veya url parametresi ekleyin",
  });
}

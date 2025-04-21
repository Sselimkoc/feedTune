import { NextResponse } from "next/server";
import axios from "axios";
import cheerio from "cheerio";

/**
 * YouTube kanal araması için API endpoint
 * Verilen sorgu ile YouTube kanallarını arar ve sonuçları döndürür
 *
 * @param {object} request - İstek nesnesi
 * @returns {Promise<NextResponse>} - JSON yanıtı
 */
export async function POST(request) {
  console.log("[YouTube Kanal Arama API] Başlatılıyor");

  try {
    // İstek gövdesini JSON olarak ayrıştır
    const body = await request.json();
    const { query } = body;

    // Sorgu kontrolü
    if (!query || query.trim() === "") {
      console.error("[YouTube Kanal Arama API] Geçersiz sorgu");
      return NextResponse.json(
        {
          success: false,
          error: "Geçerli bir arama sorgusu belirtmelisiniz",
        },
        { status: 400 }
      );
    }

    console.log(`[YouTube Kanal Arama API] Sorgu: "${query}"`);

    // YouTube arama URL'si
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query
    )}&sp=EgIQAg%253D%253D`;

    // İsteği gerçekleştir (timeout ve retry mekanizmaları ile)
    const response = await fetchWithRetry(searchUrl);

    if (!response || !response.data) {
      throw new Error("YouTube'dan yanıt alınamadı");
    }

    // HTML içeriğini ayrıştır
    const $ = cheerio.load(response.data);

    // Kanal sonuçlarını bul
    const initialData = extractInitialData($);
    const channels = parseChannels(initialData);

    console.log(`[YouTube Kanal Arama API] ${channels.length} kanal bulundu`);

    return NextResponse.json({
      success: true,
      query,
      channels,
    });
  } catch (error) {
    console.error("[YouTube Kanal Arama API] Hata:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "YouTube kanal araması sırasında bir hata oluştu",
      },
      { status: 500 }
    );
  }
}

/**
 * Tekrar denemelerle fetch işlemi yapar
 *
 * @param {string} url - İstek URL'si
 * @param {number} retries - Tekrar deneme sayısı
 * @returns {Promise<object|null>} - Axios yanıtı veya null
 */
async function fetchWithRetry(url, retries = 3) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `[YouTube Kanal Arama API] Fetch denemesi ${i + 1}/${retries}`
      );

      return await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          Referer: "https://www.youtube.com/",
        },
        timeout: 10000,
      });
    } catch (error) {
      console.error(
        `[YouTube Kanal Arama API] Fetch hatası (${i + 1}/${retries}):`,
        error.message
      );
      lastError = error;

      // Gecikme ekleyerek tekrar dene (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, i))
      );
    }
  }

  throw lastError || new Error("Bilinmeyen hata");
}

/**
 * YouTube sayfasından initialData JSON'unu çıkarır
 *
 * @param {object} $ - Cheerio nesnesi
 * @returns {object|null} - YouTube initial data veya null
 */
function extractInitialData($) {
  try {
    // YouTube script etiketlerini bul
    const scripts = $("script").toArray();

    for (const script of scripts) {
      const content = $(script).html() || "";

      // ytInitialData içeren script'i ara
      if (content.includes("ytInitialData")) {
        const match = content.match(/var ytInitialData = (.+?);(?:\s|$)/);

        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      }
    }

    return null;
  } catch (error) {
    console.error(
      "[YouTube Kanal Arama API] Initial data çıkarma hatası:",
      error.message
    );
    return null;
  }
}

/**
 * YouTube initial data'dan kanal bilgilerini ayrıştırır
 *
 * @param {object} initialData - YouTube initial data
 * @returns {Array} - Kanal dizisi
 */
function parseChannels(initialData) {
  try {
    if (!initialData) return [];

    const channels = [];

    // İçerik bölümünü bul
    const contents =
      initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents || [];

    for (const section of contents) {
      const itemSectionRenderer = section.itemSectionRenderer;

      if (!itemSectionRenderer || !itemSectionRenderer.contents) continue;

      for (const item of itemSectionRenderer.contents) {
        // Kanal render edilmiş öğeleri bul
        const channelRenderer = item.channelRenderer;

        if (!channelRenderer) continue;

        // Kanal bilgilerini çıkar
        const channelId = channelRenderer.channelId;
        const title = channelRenderer.title?.simpleText || "Bilinmeyen Kanal";

        // Resim URL'sini al
        let thumbnail = "";
        if (
          channelRenderer.thumbnail?.thumbnails &&
          channelRenderer.thumbnail.thumbnails.length > 0
        ) {
          thumbnail =
            channelRenderer.thumbnail.thumbnails[
              channelRenderer.thumbnail.thumbnails.length - 1
            ].url;
        }

        // Abone sayısını çıkar
        let subscribers = "Bilinmiyor";
        if (channelRenderer.subscriberCountText?.simpleText) {
          subscribers = channelRenderer.subscriberCountText.simpleText;
        }

        // Kanal açıklaması
        let description = "";
        if (channelRenderer.descriptionSnippet?.runs) {
          description = channelRenderer.descriptionSnippet.runs
            .map((run) => run.text)
            .join("");
        }

        // Video sayısı
        let videoCount = "0";
        if (channelRenderer.videoCountText?.runs) {
          videoCount = channelRenderer.videoCountText.runs
            .map((run) => run.text)
            .join("");
        }

        channels.push({
          id: channelId,
          title,
          description,
          thumbnail,
          url: `https://youtube.com/channel/${channelId}`,
          subscribers,
          videoCount,
        });
      }
    }

    return channels;
  } catch (error) {
    console.error(
      "[YouTube Kanal Arama API] Kanal ayrıştırma hatası:",
      error.message
    );
    return [];
  }
}

/**
 * Servis durumunu kontrol etmek için API endpoint
 *
 * @returns {NextResponse} - JSON yanıtı
 */
export function GET() {
  return NextResponse.json({ status: "YouTube kanal arama servisi çalışıyor" });
}

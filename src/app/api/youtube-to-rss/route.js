import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import axios from "axios";

/**
 * YouTube URL'lerini RSS feed URL'lerine dönüştüren yardımcı fonksiyon
 * @param {string} url - YouTube URL'si
 * @returns {Promise<string>} - RSS feed URL'si
 */
async function convertYoutubeUrlToRss(url) {
  try {
    // URL'yi ayrıştır
    const urlObj = new URL(url);

    // Hashtag işaretçilerini temizle
    const cleanUrl = url.split("#")[0];

    // 1. Kanal URL'si ise (/channel/)
    if (urlObj.pathname.includes("/channel/")) {
      const channelId = urlObj.pathname.split("/channel/")[1].split("/")[0];
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }

    // 2. Kullanıcı URL'si ise (/user/)
    if (urlObj.pathname.includes("/user/")) {
      const username = urlObj.pathname.split("/user/")[1].split("/")[0];
      return `https://www.youtube.com/feeds/videos.xml?user=${username}`;
    }

    // 3. @ ile başlayan kanal URL'si
    if (urlObj.pathname.includes("/@")) {
      const channelName = urlObj.pathname.split("/@")[1].split("/")[0];

      // YouTube'un HTML sayfasını çekerek kanal ID'sini bulmaya çalışalım
      const response = await axios.get(cleanUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      });

      // HTML'den kanal ID'sini çıkar - Birkaç farklı yöntem deneyebiliriz
      const html = response.data;

      // Yöntem 1: externalId'yi ara
      let channelId = null;
      const externalIdMatch = html.match(
        /"externalId":\s*"(UC[a-zA-Z0-9_-]{22})"/
      );
      if (externalIdMatch && externalIdMatch[1]) {
        channelId = externalIdMatch[1];
      }

      // Yöntem 2: channelId'yi ara
      if (!channelId) {
        const channelIdMatch = html.match(
          /"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/
        );
        if (channelIdMatch && channelIdMatch[1]) {
          channelId = channelIdMatch[1];
        }
      }

      // Yöntem 3: meta tag'lerde ara
      if (!channelId) {
        const metaTagMatch = html.match(
          /<meta\s+itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/
        );
        if (metaTagMatch && metaTagMatch[1]) {
          channelId = metaTagMatch[1];
        }
      }

      if (channelId) {
        return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      }

      throw new Error(
        `@ formatındaki URL'den kanal ID'si çıkarılamadı: ${url}`
      );
    }

    // 4. Video URL'si ise, videonun kanalını bulmaya çalış
    if (urlObj.pathname.includes("/watch") || urlObj.hostname === "youtu.be") {
      let videoId;

      if (urlObj.hostname === "youtu.be") {
        // youtu.be/VIDEO_ID formatı
        videoId = urlObj.pathname.substring(1);
      } else {
        // youtube.com/watch?v=VIDEO_ID formatı
        const videoIdMatch = urlObj.search.match(/[?&]v=([^&]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
          videoId = videoIdMatch[1];
        }
      }

      if (videoId) {
        // Video sayfasını çekerek kanal ID'sini bulmaya çalışalım
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await axios.get(videoUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          timeout: 10000,
        });

        const html = response.data;

        // Kanal ID'sini HTML'den çıkar
        let channelId = null;
        const channelIdMatch = html.match(
          /"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/
        );
        if (channelIdMatch && channelIdMatch[1]) {
          channelId = channelIdMatch[1];
        }

        if (channelId) {
          return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        }

        throw new Error(`Video URL'sinden kanal ID'si çıkarılamadı: ${url}`);
      }
    }

    // 5. Oynatma listesi işleme
    if (
      urlObj.pathname.includes("/playlist") ||
      urlObj.search.includes("list=")
    ) {
      const playlistMatch = urlObj.search.match(/[?&]list=([^&]+)/);
      if (playlistMatch && playlistMatch[1]) {
        const playlistId = playlistMatch[1];
        // Oynatma listeleri için RSS desteği yok, özel bir mekanizma gerekiyor
        throw new Error(
          `YouTube oynatma listeleri şu anda desteklenmiyor: ${url}`
        );
      }
    }

    throw new Error(`Desteklenmeyen YouTube URL formatı: ${url}`);
  } catch (error) {
    console.error("YouTube URL dönüştürme hatası:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Kullanıcı oturum kontrolü
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    // Request gövdesinden URL'yi al
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL'si gerekli" },
        { status: 400 }
      );
    }

    // URL'yi doğrula
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Geçersiz URL formatı" },
        { status: 400 }
      );
    }

    // YouTube URL'sini RSS feed URL'sine dönüştür
    const rssUrl = await convertYoutubeUrlToRss(url);

    return NextResponse.json({ rssUrl });
  } catch (error) {
    console.error("YouTube to RSS API hatası:", error);
    return NextResponse.json(
      { error: `YouTube URL'si dönüştürülemedi: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "YouTube to RSS API çalışıyor" });
}

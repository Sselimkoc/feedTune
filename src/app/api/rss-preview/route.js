import { NextResponse } from "next/server";
import Parser from "rss-parser";

/**
 * RSS Önizleme API
 * Verilen URL'deki RSS beslemesini çekip önizleme bilgilerini döndürür
 * Endpoint: POST /api/rss-preview
 */
export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL parametresi gerekli" },
        { status: 400 }
      );
    }

    console.log(`RSS Önizleme: ${url} çekiliyor`);

    const parser = new Parser({
      customFields: {
        item: [
          ["media:content", "media"],
          ["media:thumbnail", "mediaThumbnail"],
          ["enclosure", "enclosure"],
          ["content:encoded", "contentEncoded"],
          ["dc:creator", "creator"],
        ],
      },
    });

    let response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*",
        },
        timeout: 10000, // 10 saniye timeout
      });
    } catch (fetchError) {
      console.error("Fetch hatası:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: `RSS kaynağına erişilemedi: ${fetchError.message}`,
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `RSS kaynağına erişilemedi: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const content = await response.text();

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "RSS beslemesi boş içerik döndürdü" },
        { status: 404 }
      );
    }

    let feed;
    try {
      feed = await parser.parseString(content);
    } catch (parseError) {
      console.error("RSS ayrıştırma hatası:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: `RSS beslemesi ayrıştırılamadı: ${parseError.message}`,
        },
        { status: 422 }
      );
    }

    if (!feed) {
      return NextResponse.json(
        {
          success: false,
          error: "RSS beslemesi bulunamadı veya ayrıştırılamadı",
        },
        { status: 404 }
      );
    }

    // Öğe sayısını kontrol et ve logla
    let originalItemCount = 0;
    if (feed.items && Array.isArray(feed.items)) {
      originalItemCount = feed.items.length;
      
      // Çok fazla öğe varsa sınırla (önizleme için 50 yeterli)
      if (originalItemCount > 50) {
        console.log(`RSS Önizleme: Öğe sayısı sınırlandırılıyor: ${originalItemCount} -> 50`);
        feed.items = feed.items.slice(0, 50);
      }
      
      console.log(`RSS Önizleme: ${feed.items.length} öğe (orijinal: ${originalItemCount})`);
    }

    const preview = Array.isArray(feed.items)
      ? feed.items.slice(0, 3).map((item) => ({
          title: item.title || "Başlıksız",
          link: item.link || "",
          date: item.pubDate || item.isoDate || new Date().toISOString(),
          summary: item.contentSnippet || item.summary || "",
        }))
      : [];

    const feedData = {
      success: true,
      title: feed.title || "Başlıksız Besleme",
      description: feed.description || "",
      items: originalItemCount || feed.items?.length || 0,
      image: feed.image?.url || feed.favicon || null,
      language: feed.language || null,
      lastUpdated: feed.lastBuildDate || null,
      preview: preview,
      url: url,
    };

    return NextResponse.json(feedData, { status: 200 });
  } catch (error) {
    console.error("RSS önizleme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: `RSS önizleme hatası: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * RSS önizleme durum kontrolü
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: "available",
    message: "RSS preview service is running",
  });
}

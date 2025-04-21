import { NextResponse } from "next/server";
import Parser from "rss-parser";

/**
 * Feed Proxy API
 * URL'leri çekip CORS kısıtlamalarını aşmak için kullanılır
 * Endpoint: POST /api/feed-proxy
 */
export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL parametresi gerekli" },
        { status: 400 }
      );
    }

    console.log(`Feed Proxy: ${url} çekiliyor`);

    // RSS/Atom içeriğini çek
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*",
      },
    });

    if (!response.ok) {
      const statusText = response.statusText || "Bilinmeyen hata";
      return NextResponse.json(
        { error: `Feed çekilemedi: ${response.status} ${statusText}` },
        { status: response.status }
      );
    }

    // İçeriği text olarak al
    const content = await response.text();

    // Parser ile işle
    const parser = new Parser({
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
        ],
        feed: ["image", "language", "updated", "published"],
      },
    });

    try {
      const feed = await parser.parseString(content);

      // Öğe sayısını kontrol et ve sınırla
      if (feed && feed.items && Array.isArray(feed.items)) {
        const originalItemCount = feed.items.length;
        if (originalItemCount > 50) {
          console.log(
            `Feed Proxy: Öğe sayısı sınırlandırılıyor: ${originalItemCount} -> 50`
          );
          feed.items = feed.items.slice(0, 50);
        }
        console.log(
          `Feed Proxy: ${feed.items.length} öğe döndürülüyor (orijinal: ${originalItemCount})`
        );
      }

      return NextResponse.json({ feed, success: true }, { status: 200 });
    } catch (parseError) {
      console.error("Feed ayrıştırma hatası:", parseError);

      // HTML mi RSS mi anlama
      const isXML =
        content.includes("<?xml") ||
        content.includes("<rss") ||
        content.includes("<feed");

      if (!isXML) {
        return NextResponse.json(
          { error: "Bu URL RSS veya Atom beslemesi değil" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `RSS işleme hatası: ${parseError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Feed proxy hatası:", error);
    return NextResponse.json(
      { error: `Feed işleme hatası: ${error.message}` },
      { status: 500 }
    );
  }
}

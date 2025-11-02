/**
 * Image Proxy API Endpoint
 * Bu endpoint, CORS kısıtlamaları nedeniyle yüklenemeyen görüntüleri
 * (özellikle YouTube thumbnails) yerel sunucu üzerinden ileterek yüklemeyi sağlar.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Önbelleği devre dışı bırak

export async function GET(request) {
  try {
    // URL parametresini al
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    // URL yoksa hata döndür
    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL parametresi gerekli" },
        { status: 400 }
      );
    }

    console.log("Görüntü proxy isteği:", imageUrl);

    // Görüntüyü fetch ile al (5 saniye timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // Hata durumunda, hata bilgisini döndür
    if (!response.ok) {
      console.error(
        `Görüntü alınamadı: ${response.status} ${response.statusText} - ${imageUrl}`
      );
      return NextResponse.json(
        { error: `Görüntü alınamadı: ${response.status}` },
        { status: response.status }
      );
    }

    // Görüntü verilerini al
    const imageBuffer = await response.arrayBuffer();

    // Görüntü content-type bilgisini al
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Görüntüyü yanıt olarak döndür
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // 1 gün önbellek
        "Access-Control-Allow-Origin": "*", // CORS izni
      },
    });
  } catch (error) {
    console.error("Görüntü proxy hatası:", error);
    return NextResponse.json(
      { error: `Görüntü proxy hatası: ${error.message}` },
      { status: 500 }
    );
  }
}

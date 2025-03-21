import { NextResponse } from "next/server";
import { parseRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * RSS besleme ayrıştırma timeout'u - 15 saniye
 * Çok büyük RSS beslemeleri için koruma ekledik
 */
const PARSE_TIMEOUT = 15000;

/**
 * Timeout ile Promise döndüren fonksiyon
 * @param {Promise} promise - Asıl promise
 * @param {number} timeout - Milisaniye cinsinden timeout
 * @param {string} errorMessage - Timeout durumunda gösterilecek hata mesajı
 * @returns {Promise} - Timeout eklenmiş promise
 */
const withTimeout = (promise, timeout, errorMessage) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * RSS besleme ayrıştırma endpoint'i
 *
 * ?url=https://example.com/rss şeklinde bir sorgu parametresi kabul eder
 * ve RSS beslemesini ayrıştırarak döndürür.
 */
export async function GET(request) {
  try {
    // Oturum kontrolü
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    // URL parametresini al
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parametresi gereklidir" },
        { status: 400 }
      );
    }

    // URL validasyonu
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (e) {
      return NextResponse.json(
        { error: "Geçerli bir URL giriniz" },
        { status: 400 }
      );
    }

    // RSS beslemesini ayrıştır - timeout ile
    const feedData = await withTimeout(
      parseRssFeed(url),
      PARSE_TIMEOUT,
      "RSS beslemesi yükleme zaman aşımı. Lütfen daha küçük bir besleme deneyin."
    );

    // Büyük veri yapılarına karşı koruma - sadece belirli sayıda öğe döndür
    const responseItems = (feedData.items || []).slice(0, 10);

    // Dönüştürülmüş feed verisini döndür
    return NextResponse.json({
      feed: {
        title: feedData.title || "İsimsiz Besleme",
        description: feedData.description || "",
        link: feedData.link || url,
        language: feedData.language || null,
        lastBuildDate: feedData.lastBuildDate || null,
      },
      items: responseItems,
    });
  } catch (error) {
    console.error("RSS ayrıştırma hatası:", error);

    // Timeout hatası için özel mesaj
    if (error.message && error.message.includes("zaman aşımı")) {
      return NextResponse.json(
        { error: error.message },
        { status: 408 } // Request Timeout status
      );
    }

    return NextResponse.json(
      { error: error.message || "RSS beslemesi ayrıştırılamadı" },
      { status: 500 }
    );
  }
}

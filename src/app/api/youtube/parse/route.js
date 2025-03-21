import { NextResponse } from "next/server";
import { parseYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube kanal ayrıştırma timeout'u - 15 saniye
 * Çok büyük yanıtlar için koruma eklendi
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
 * Channel ID'sini doğrula
 * @param {string} channelId - Doğrulanacak channel ID
 * @returns {boolean} - Doğrulama sonucu
 */
const validateChannelId = (channelId) => {
  if (!channelId) return false;
  if (channelId.length > 2000) return false;

  // Geçerli bir URL veya ID olup olmadığını kontrol et
  try {
    if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
      new URL(
        channelId.startsWith("http") ? channelId : `https://${channelId}`
      );
      return true;
    }

    // Olası kanal ID formatlarını kontrol et
    return (
      // UCxxxxxxxx veya normal kanal ID formatı (genelde 11-24 karakter arası)
      (channelId.startsWith("UC") &&
        channelId.length >= 11 &&
        channelId.length <= 24) ||
      // @username formatı
      channelId.startsWith("@") ||
      // Custom username (genelde kısa ve basit)
      (!/\s/.test(channelId) && channelId.length >= 3 && channelId.length <= 50)
    );
  } catch (error) {
    return false;
  }
};

/**
 * YouTube kanal ayrıştırma endpoint'i
 *
 * ?channelId=CHANNEL_ID şeklinde bir sorgu parametresi kabul eder
 * ve YouTube kanal bilgilerini ayrıştırarak döndürür.
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

    // ChannelId parametresini al
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId parametresi gereklidir" },
        { status: 400 }
      );
    }

    // Kanal ID'sini doğrula
    if (!validateChannelId(channelId)) {
      return NextResponse.json(
        {
          error:
            "Geçerli bir YouTube kanal ID'si, kullanıcı adı veya URL girin",
        },
        { status: 400 }
      );
    }

    // YouTube kanalını ayrıştır - timeout ile
    const channelData = await withTimeout(
      parseYoutubeChannel(channelId),
      PARSE_TIMEOUT,
      "YouTube kanalı getirme zaman aşımına uğradı. Lütfen tekrar deneyin."
    );

    // Video sayısını sınırla - bellek tüketimini azaltmak için
    const responseVideos = (channelData.videos || []).slice(0, 5);

    // Dönüştürülmüş kanal verisini döndür
    return NextResponse.json({
      channel: channelData.channel,
      videos: responseVideos,
      suggestedChannels: channelData.suggestedChannels || [],
    });
  } catch (error) {
    console.error("YouTube kanal ayrıştırma hatası:", error);

    // Timeout hatası için özel mesaj
    if (error.message && error.message.includes("zaman aşımı")) {
      return NextResponse.json(
        { error: error.message },
        { status: 408 } // Request Timeout status
      );
    }

    return NextResponse.json(
      { error: error.message || "YouTube kanalı ayrıştırılamadı" },
      { status: 500 }
    );
  }
}

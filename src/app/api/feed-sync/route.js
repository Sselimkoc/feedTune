import { NextResponse } from "next/server";
import { updateRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Feed senkronizasyon endpoint'i
 * Kullanıcının tüm feed'lerini yeniler
 *
 * POST metodu ile çağrılır ve parametresiz çalışır.
 */
export async function POST(request) {
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

    // Kullanıcının tüm aktif feed'lerini al
    const { data: userFeeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id, type")
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    if (feedsError) {
      console.error("Feed'leri alma hatası:", feedsError);
      return NextResponse.json(
        { error: "Feed'ler alınırken bir hata oluştu" },
        { status: 500 }
      );
    }

    // Her bir feed'i güncelle
    const updatePromises = userFeeds.map(async (feed) => {
      try {
        // Şu an için sadece RSS feed'leri güncelleniyor
        // İleride YouTube feed'leri için de güncelleme eklenebilir
        if (feed.type === "rss") {
          await updateRssFeed(feed.id);
          return { id: feed.id, success: true };
        }
        return {
          id: feed.id,
          success: false,
          message: "Desteklenmeyen feed türü",
        };
      } catch (error) {
        console.error(`Feed ${feed.id} güncelleme hatası:`, error);
        return { id: feed.id, success: false, error: error.message };
      }
    });

    // Tüm güncelleme sonuçlarını bekle
    const results = await Promise.all(updatePromises);

    // Başarılı ve başarısız güncelleme sayılarını hesapla
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} feed başarıyla güncellendi${
        failCount > 0 ? `, ${failCount} feed güncellenemedi` : ""
      }`,
      results,
    });
  } catch (error) {
    console.error("Feed senkronizasyon hatası:", error);

    return NextResponse.json(
      {
        error: error.message || "Feed'ler güncellenirken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}

/**
 * Feed senkronizasyon durum endpoint'i
 * İsteğe bağlı olarak kullanılabilir
 */
export async function GET(request) {
  try {
    return NextResponse.json({
      status: "available",
      message: "Feed senkronizasyon servisi çalışıyor",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Feed senkronizasyon servisi hatası" },
      { status: 500 }
    );
  }
}

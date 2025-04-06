import { NextResponse } from "next/server";
import { updateRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Erişim anahtarı - gerçek bir uygulamada daha güvenli bir yöntem kullanılmalı
const ACCESS_KEY = process.env.CRON_SECRET || "feed-update-secret-key";

/**
 * Tüm feed'leri güncelleyen endpoint
 * Bu endpoint bir CRON job tarafından belirli aralıklarla çağrılabilir
 *
 * Feed'lerin güncel kalması için periyodik olarak bu endpoint'in çağrılması gerekir
 */
export async function POST(request) {
  try {
    // İstek body'sini kontrol et
    const body = await request.json();

    // Erişim anahtarını kontrol et
    if (body.key !== ACCESS_KEY) {
      return NextResponse.json(
        { error: "Geçersiz erişim anahtarı" },
        { status: 401 }
      );
    }

    // Supabase bağlantısı
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Tüm aktif RSS feed'lerini al
    const { data: allFeeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id, type")
      .eq("is_active", true)
      .eq("type", "rss"); // Şimdilik sadece RSS feed'leri

    if (feedsError) {
      console.error("Feed'leri alma hatası:", feedsError);
      return NextResponse.json(
        { error: "Feed'ler alınırken bir hata oluştu" },
        { status: 500 }
      );
    }

    console.log(
      `${allFeeds.length} aktif feed bulundu. Güncelleme başlatılıyor...`
    );

    // Kaç feed'in güncelleneceğini belirle - opsiyonel limit parametresi
    const limit =
      body.limit && !isNaN(parseInt(body.limit))
        ? parseInt(body.limit)
        : allFeeds.length;

    // Feed'leri güncelle - belirlenen limite kadar
    const feedsToUpdate = allFeeds.slice(0, limit);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Her feed'i sırayla güncelle
    for (const feed of feedsToUpdate) {
      try {
        // RSS feed'i güncelle
        if (feed.type === "rss") {
          await updateRssFeed(feed.id);
          successCount++;
          results.push({ id: feed.id, success: true });
        } else {
          failCount++;
          results.push({
            id: feed.id,
            success: false,
            message: "Desteklenmeyen feed türü",
          });
        }
      } catch (error) {
        failCount++;
        console.error(`Feed ${feed.id} güncelleme hatası:`, error);
        results.push({
          id: feed.id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} feed başarıyla güncellendi${
        failCount > 0 ? `, ${failCount} feed güncellenemedi` : ""
      }`,
      totalFeeds: allFeeds.length,
      updatedFeeds: feedsToUpdate.length,
      results: body.details ? results : undefined,
    });
  } catch (error) {
    console.error("Toplu feed güncelleme hatası:", error);
    return NextResponse.json(
      {
        error: error.message || "Feed'ler güncellenirken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}

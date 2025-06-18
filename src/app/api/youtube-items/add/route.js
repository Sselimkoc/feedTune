import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

/**
 * YouTube içeriklerini eklemek için API
 */
export async function POST(request) {
  console.log("📥 YouTube item ekleme API'si çağrıldı");

  try {
    // Request içeriğini logla
    const requestBody = await request.json();
    console.log(
      `📦 İstek gövdesi: feedId=${requestBody.feedId}, ${
        requestBody.items?.length || 0
      } öğe`
    );

    const { feedId, items } = requestBody;

    if (!feedId || !items || !Array.isArray(items) || items.length === 0) {
      console.error("❌ Geçersiz istek parametreleri:", {
        feedId,
        itemsCount: items?.length,
      });
      return NextResponse.json(
        { error: "Geçersiz istek parametreleri" },
        { status: 400 }
      );
    }

    // Oturum kontrolü
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient();

    // Kullanıcı oturumunu kontrol et
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("❌ Oturum bulunamadı");
      return NextResponse.json(
        { error: "Kullanıcı oturumu gerekli" },
        { status: 401 }
      );
    }

    console.log("👤 Kullanıcı ID:", session.user.id);
    console.log(
      `🔄 ${items.length} YouTube içeriği eklenecek - Feed ID: ${feedId}`
    );

    // Besleme sahibinin, isteği yapan kullanıcı olduğunu doğrula
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("user_id, title, type")
      .eq("id", feedId)
      .single();

    if (feedError) {
      console.error("❌ Feed kontrolü sırasında hata:", feedError);
      return NextResponse.json(
        { error: `Feed bulunamadı: ${feedError.message}` },
        { status: 404 }
      );
    }

    console.log("📋 Feed bilgileri:", feed);

    if (feed.user_id !== session.user.id) {
      console.error(
        "❌ Yetkilendirme hatası: Bu beslemeye içerik ekleme yetkiniz yok"
      );
      return NextResponse.json(
        { error: "Bu beslemeye içerik ekleme yetkiniz yok" },
        { status: 403 }
      );
    }

    if (feed.type !== "youtube") {
      console.error("❌ Feed türü YouTube değil:", feed.type);
      return NextResponse.json(
        { error: "Bu feed YouTube türünde değil" },
        { status: 400 }
      );
    }

    // Mevcut video ID'lerini kontrol et
    console.log("🔍 Mevcut video ID'lerini kontrol ediliyor...");

    const { data: existingItems, error: existingError } = await supabase
      .from("youtube_items")
      .select("video_id")
      .eq("feed_id", feedId);

    if (existingError) {
      console.error("❌ Mevcut öğeleri kontrol ederken hata:", existingError);
      return NextResponse.json(
        {
          error: `Mevcut öğeleri kontrol ederken hata: ${existingError.message}`,
        },
        { status: 500 }
      );
    }

    // Mevcut video ID'lerini bir set'e dönüştür
    const existingVideoIds = new Set(
      existingItems?.map((item) => item.video_id) || []
    );

    console.log(`ℹ️ ${existingVideoIds.size} mevcut video ID'si bulundu`);

    // Yalnızca yeni videoları ekle (duplikasyonu önle)
    const newItems = items.filter(
      (item) => !existingVideoIds.has(item.video_id)
    );

    if (newItems.length === 0) {
      console.log("ℹ️ Eklenecek yeni YouTube içeriği bulunamadı");
      return NextResponse.json({
        success: true,
        inserted: 0,
        message: "Eklenecek yeni YouTube içeriği bulunamadı",
      });
    }

    console.log(`🆕 ${newItems.length} yeni YouTube öğesi eklenecek`);

    // Veri kalitesi kontrolü yap ve gerekirse düzelt
    const cleanedItems = newItems.map((item) => {
      // video_id kontrolü
      if (!item.video_id) {
        console.warn(`⚠️ Video ID eksik:`, item);
        // URL'den ID çıkarmayı dene
        if (item.url) {
          try {
            const urlObj = new URL(item.url);
            const videoId = urlObj.searchParams.get("v");
            if (videoId) {
              item.video_id = videoId;
              console.log(`✅ URL'den video ID çıkarıldı: ${videoId}`);
            }
          } catch (e) {
            console.error("❌ URL'den ID çıkarma hatası:", e);
          }
        }
      }

      // Diğer alanların kontrolü
      return {
        ...item,
        feed_id: feedId,
        title: item.title || "Başlıksız Video",
        video_id:
          item.video_id ||
          `unknown-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        url: item.url || `https://youtube.com/watch?v=${item.video_id}`,
        published_at: item.published_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    });

    console.log(`🧹 Veri temizleme sonrası ${cleanedItems.length} öğe hazır`);

    try {
      // Küçük gruplar halinde ekle (50'şer öğe)
      const batchSize = 20;
      let insertedCount = 0;
      let errors = [];

      for (let i = 0; i < cleanedItems.length; i += batchSize) {
        const batch = cleanedItems.slice(i, i + batchSize);
        console.log(
          `📤 ${i + 1} - ${i + batch.length} arası öğeler ekleniyor...`
        );

        try {
          console.log(
            `🧾 Batch ${i / batchSize + 1} içeriği:`,
            JSON.stringify(batch.slice(0, 2), null, 2)
          );

          const { data: insertedData, error: insertError } = await supabase
            .from("youtube_items")
            .insert(batch);

          if (insertError) {
            console.error(
              `❌ Parti ${i / batchSize + 1} ekleme hatası:`,
              insertError,
              `Hata kodu: ${insertError.code}, Hata detayı: ${insertError.details}, Mesaj: ${insertError.message}`
            );
            errors.push({
              batch: i / batchSize + 1,
              error: insertError.message,
              code: insertError.code,
              details: insertError.details,
            });
          } else {
            insertedCount += batch.length;
            console.log(
              `✅ Parti ${i / batchSize + 1}: ${
                batch.length
              } öğe başarıyla eklendi. Eklenen veri:`,
              insertedData ? "Veri mevcut" : "Veri dönmedi"
            );
          }
        } catch (batchError) {
          console.error(
            `❌ Parti ${i / batchSize + 1} ekleme hatası (catch):`,
            batchError,
            `Hata tipi: ${batchError.name}, Hata mesajı: ${batchError.message}, Stack: ${batchError.stack}`
          );
          errors.push({
            batch: i / batchSize + 1,
            error: batchError.message,
            name: batchError.name,
          });
        }
      }

      if (insertedCount > 0) {
        console.log(
          `🎉 İşlem tamamlandı: ${insertedCount} YouTube öğesi eklendi, ${errors.length} hata oluştu`
        );
        return NextResponse.json({
          success: true,
          inserted: insertedCount,
          errors: errors.length > 0 ? errors : null,
          message: `${insertedCount} YouTube öğesi başarıyla eklendi${
            errors.length > 0 ? `, ${errors.length} hata oluştu` : ""
          }`,
        });
      } else {
        console.error(
          "❌ Hiç öğe eklenemedi, hatalar:",
          JSON.stringify(errors, null, 2)
        );
        return NextResponse.json(
          {
            success: false,
            inserted: 0,
            errors,
            error:
              "Hiçbir YouTube öğesi eklenemedi, detaylı hatalar errors alanında",
          },
          { status: 500 }
        );
      }
    } catch (insertError) {
      console.error("❌ YouTube öğeleri ekleme hatası:", insertError);
      return NextResponse.json(
        { error: `YouTube öğeleri eklenirken hata: ${insertError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ API işlemi sırasında genel hata:", error);
    return NextResponse.json(
      { error: `İşlem sırasında hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * API durumunu kontrol etmek için GET
 */
export async function GET() {
  return NextResponse.json({
    status: "available",
    message: "YouTube içerik ekleme API'si hazır",
  });
}

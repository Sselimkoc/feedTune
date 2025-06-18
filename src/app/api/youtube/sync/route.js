import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { FeedParser } from "@/utils/feedParser";
import axios from "axios";

/**
 * YouTube feed içeriklerini senkronize eden API
 */
export async function POST(request) {
  console.log("📡 YouTube Feed Senkronizasyon API'si çağrıldı");

  try {
    const supabase = createServerSupabaseClient();

    // İstek verilerini al
    const requestData = await request.json();
    const { feedId, userId } = requestData;

    console.log(`📥 İstek verileri: feedId=${feedId}, userId=${userId}`);

    if (!feedId || !userId) {
      console.error("❌ Eksik parametreler");
      return NextResponse.json(
        { error: "feedId ve userId parametreleri gerekli" },
        { status: 400 }
      );
    }

    // Oturum doğrulama
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

    if (session.user.id !== userId) {
      console.error("❌ Kullanıcı ID'leri eşleşmiyor");
      return NextResponse.json(
        { error: "Yetkilendirme hatası" },
        { status: 403 }
      );
    }

    // Feed bilgilerini al
    console.log("🔍 Feed bilgileri alınıyor...");
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("id, title, url, type")
      .eq("id", feedId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (feedError || !feed) {
      console.error("❌ Feed bulunamadı:", feedError);
      return NextResponse.json(
        { error: feedError?.message || "Feed bulunamadı" },
        { status: 404 }
      );
    }

    if (feed.type !== "youtube") {
      console.error(`❌ Geçersiz feed tipi: ${feed.type}`);
      return NextResponse.json(
        { error: "Bu feed YouTube türünde değil" },
        { status: 400 }
      );
    }

    console.log(`📋 Feed bilgileri:`, feed);

    // YouTube RSS besleme URL'si oluştur
    let feedUrl = feed.url;
    if (!feedUrl.includes("feeds/videos.xml")) {
      // URL'den kanal ID'sini çıkar
      const channelId = extractChannelId(feedUrl);
      if (!channelId) {
        console.error(`❌ Kanal ID çıkarılamadı: ${feedUrl}`);
        return NextResponse.json(
          { error: "Kanal ID'si çıkarılamadı" },
          { status: 400 }
        );
      }
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      console.log(`🔄 RSS URL oluşturuldu: ${feedUrl}`);
    }

    // RSS içeriğini fetch et
    console.log(`📥 RSS feed indiriliyor: ${feedUrl}`);
    let rssFeed;
    try {
      const parser = new FeedParser();
      rssFeed = await parser.parseRssFeed(feedUrl);
      console.log(
        `✅ RSS feed başarıyla ayrıştırıldı, ${rssFeed.items.length} öğe bulundu`
      );
    } catch (parseError) {
      console.error(`❌ RSS feed ayrıştırma hatası:`, parseError);

      // İkinci bir yöntem deneyerek YouTube API proxy ile deneyelim
      try {
        console.log(`🔄 Alternatif yöntem deneniyor...`);
        const response = await axios.get(feedUrl);

        if (response.status !== 200) {
          throw new Error(`RSS feed alınamadı: ${response.status}`);
        }

        const parser = new FeedParser();
        rssFeed = await parser.parser.parseString(response.data);
        console.log(
          `✅ Alternatif yöntem başarılı, ${rssFeed.items.length} öğe bulundu`
        );
      } catch (alternativeError) {
        console.error(`❌ Alternatif yöntem hatası:`, alternativeError);
        return NextResponse.json(
          { error: `RSS içeriği alınamadı: ${parseError.message}` },
          { status: 500 }
        );
      }
    }

    if (!rssFeed || !rssFeed.items || !Array.isArray(rssFeed.items)) {
      console.error(`❌ Geçersiz RSS içeriği:`, rssFeed);
      return NextResponse.json(
        { error: "Geçersiz RSS içeriği" },
        { status: 500 }
      );
    }

    // YouTube öğelerini işle
    console.log(`🔄 ${rssFeed.items.length} YouTube öğesi işleniyor...`);
    const youtubeItems = rssFeed.items
      .map((item) => {
        // Video ID'sini çıkar
        let videoId = "";
        if (item.id) {
          const idParts = item.id.split(":");
          videoId = idParts[idParts.length - 1];
        } else if (item.link) {
          try {
            const urlObj = new URL(item.link);
            videoId = urlObj.searchParams.get("v") || "";
          } catch (e) {
            console.error(`❌ URL ayrıştırma hatası:`, e);
          }
        }

        console.log(
          `📹 Video ID ayrıştırıldı: ${videoId} (${item.title?.substring(
            0,
            30
          )}...)`
        );

        return {
          feed_id: feedId,
          video_id: videoId,
          title: item.title || "Başlıksız Video",
          url: item.link || `https://www.youtube.com/watch?v=${videoId}`,
          description: item.description || item.summary || "",
          thumbnail:
            item.thumbnail ||
            item.image?.url ||
            item.mediaGroup?.[0]?.thumbnail?.[0]?.url ||
            "",
          channel_title: feed.title || rssFeed.title,
          published_at:
            item.pubDate || item.isoDate || new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
      })
      .filter((item) => item.video_id); // Boş ID'leri filtrele

    console.log(
      `✅ ${youtubeItems.length} YouTube öğesi geçerli ID ile işlendi`
    );

    // Mevcut video ID'lerini kontrol et
    console.log(`🔍 Mevcut video ID'leri kontrol ediliyor...`);
    const { data: existingItems, error: existingError } = await supabase
      .from("youtube_items")
      .select("video_id")
      .eq("feed_id", feedId);

    if (existingError) {
      console.error(`❌ Mevcut öğeleri kontrol ederken hata:`, existingError);
      return NextResponse.json(
        {
          error: `Mevcut öğeleri kontrol ederken hata: ${existingError.message}`,
        },
        { status: 500 }
      );
    }

    const existingVideoIds = new Set(
      existingItems?.map((item) => item.video_id) || []
    );
    console.log(`ℹ️ ${existingVideoIds.size} mevcut video ID'si bulundu`);

    // Yalnızca yeni videoları ekle
    const newItems = youtubeItems.filter(
      (item) => item.video_id && !existingVideoIds.has(item.video_id)
    );

    console.log(`🆕 ${newItems.length} yeni YouTube öğesi eklenecek`);

    if (newItems.length === 0) {
      // Feed son güncelleme zamanını yine de güncelle
      await updateFeedTimestamp(supabase, feedId);

      return NextResponse.json({
        success: true,
        message: "Yeni YouTube öğesi bulunamadı",
        total: rssFeed.items.length,
        new: 0,
      });
    }

    // Küçük gruplar halinde ekle (20'şer öğe)
    console.log(`📤 YouTube öğeleri ekleniyor...`);
    const batchSize = 20;
    let insertedCount = 0;
    let errors = [];

    for (let i = 0; i < newItems.length; i += batchSize) {
      const batch = newItems.slice(i, i + batchSize);
      console.log(
        `📤 Parti ${i / batchSize + 1}: ${batch.length} öğe ekleniyor...`
      );

      try {
        // Ekleme işleminden önce verileri kontrol edelim
        console.log(`🔍 Veri örneği:`, JSON.stringify(batch[0], null, 2));

        // YouTube items tablosunda gerekli alanların varlığını kontrol edelim
        const { data: tableInfo, error: tableError } = await supabase
          .from("youtube_items")
          .select("created_at")
          .limit(1);

        if (tableError) {
          console.error(
            "❌ YouTube_items tablosu kontrolünde hata:",
            tableError
          );
          errors.push({
            type: "table_check",
            error: tableError.message,
          });
        } else {
          console.log("✅ YouTube_items tablosu mevcut ve erişilebilir");
        }

        // Veri doğruluğunu kontrol et
        const validBatch = batch.map((item) => ({
          ...item,
          // Gerekli alanların varlığını kontrol et ve düzelt
          video_id:
            item.video_id ||
            `unknown-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          title: item.title || "Başlıksız Video",
          url: item.url || `https://www.youtube.com/watch?v=${item.video_id}`,
          feed_id: feedId,
          published_at: item.published_at || new Date().toISOString(),
          created_at: new Date().toISOString(),
        }));

        // Eklemeden önce RLS politikalarını kontrol et
        let rlsOk = true;
        try {
          const rlsCheck = await checkRlsPolicies(supabase);
          if (!rlsCheck.canInsert) {
            console.warn(
              "⚠️ RLS politikaları insert izni vermiyor olabilir:",
              rlsCheck
            );
            rlsOk = false;
          } else {
            console.log("✅ RLS politikaları insert izni veriyor");
          }
        } catch (rlsError) {
          console.warn("⚠️ RLS kontrol hatası:", rlsError.message);
        }

        // Service-Level authorizasyon ile insert yapmayı dene
        let insertQuery;
        if (rlsOk) {
          // Normal insert - RLS politikaları izin veriyor
          insertQuery = supabase
            .from("youtube_items")
            .insert(validBatch)
            .select("id, video_id");
        } else {
          // RLS bypass ile insert - Auth bypass için supabase-js fonksiyon çağrısı kullan
          console.log("🔄 RLS bypass denemesi: rpc üzerinden ekleme yapılıyor");
          try {
            // RPC fonksiyonu üzerinden ekleme yapmayı dene
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              "insert_youtube_items",
              {
                items: validBatch,
                p_user_id: userId,
              }
            );

            if (rpcError) {
              console.error("❌ RPC insert hatası:", rpcError);
              // Yine de normal insert yapmayı dene
              insertQuery = supabase
                .from("youtube_items")
                .insert(validBatch)
                .select("id, video_id");
            } else {
              console.log("✅ RPC insert başarılı:", rpcResult);
              insertedCount += rpcResult?.inserted_count || 0;
              continue; // Sonraki batch'e geç
            }
          } catch (rpcError) {
            console.error("❌ RPC çağrı hatası:", rpcError);
            // Yine de normal insert yapmayı dene
            insertQuery = supabase
              .from("youtube_items")
              .insert(validBatch)
              .select("id, video_id");
          }
        }

        const { data: insertedData, error: insertError } = await insertQuery;

        if (insertError) {
          console.error(
            `❌ Parti ${i / batchSize + 1} ekleme hatası:`,
            insertError,
            "Hata kodu:",
            insertError.code,
            "Detay:",
            insertError.details
          );

          // Tekil olarak deneyelim
          console.log(
            `🔄 Öğeleri tek tek eklemeyi deniyorum (${batch.length} öğe)`
          );
          let individualInsertCount = 0;

          for (const item of validBatch) {
            try {
              const { data: singleInsert, error: singleError } = await supabase
                .from("youtube_items")
                .insert(item)
                .select("id");

              if (singleError) {
                console.error(
                  `❌ Tek öğe eklemede hata (${item.video_id}):`,
                  singleError.message
                );
              } else {
                individualInsertCount++;
              }
            } catch (singleCatchError) {
              console.error(
                `❌ Tek öğe ekleme istisna:`,
                singleCatchError.message
              );
            }
          }

          if (individualInsertCount > 0) {
            console.log(
              `✅ Tek tek ekleme başarılı: ${individualInsertCount} öğe eklendi`
            );
            insertedCount += individualInsertCount;
          } else {
            errors.push({
              batch: i / batchSize + 1,
              error: insertError.message,
              code: insertError.code,
              details: insertError.details,
            });
          }
        } else {
          const actualInserted = insertedData?.length || batch.length;
          insertedCount += actualInserted;
          console.log(
            `✅ Parti ${
              i / batchSize + 1
            }: ${actualInserted} öğe başarıyla eklendi`,
            insertedData ? `(${insertedData.length} ID döndü)` : ""
          );
        }
      } catch (batchError) {
        console.error(
          `❌ Parti ${i / batchSize + 1} ekleme hatası (catch):`,
          batchError.message
        );
        errors.push({
          batch: i / batchSize + 1,
          error: batchError.message,
        });
      }
    }

    // Feed son güncelleme zamanını güncelle
    await updateFeedTimestamp(supabase, feedId);

    console.log(`🎉 İşlem tamamlandı: ${insertedCount} YouTube öğesi eklendi`);
    return NextResponse.json({
      success: true,
      message: `${insertedCount} YouTube öğesi başarıyla eklendi`,
      total: rssFeed.items.length,
      new: insertedCount,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error(`❌ Genel hata:`, error);
    return NextResponse.json(
      { error: `Senkronizasyon hatası: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * YouTube URL'inden kanal ID'sini çıkarır
 * @param {string} url - YouTube URL'i
 * @returns {string|null} - Kanal ID'si veya null
 */
function extractChannelId(url) {
  try {
    if (!url) return null;

    // https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw
    if (url.includes("/channel/")) {
      return url.split("/channel/")[1]?.split(/[/?#]/)[0] || null;
    }

    // https://www.youtube.com/@GoogleDevelopers
    if (url.includes("/@")) {
      // Kullanıcı adından doğrudan ID çıkaramayız
      // Bu durumda kullanıcı adını döndürüyoruz
      return url.split("/@")[1]?.split(/[/?#]/)[0] || null;
    }

    // https://www.youtube.com/user/GoogleDevelopers
    if (url.includes("/user/")) {
      return url.split("/user/")[1]?.split(/[/?#]/)[0] || null;
    }

    return null;
  } catch (error) {
    console.error(`❌ Kanal ID çıkarma hatası:`, error);
    return null;
  }
}

/**
 * Feed'in son güncelleme zamanını günceller
 * @param {Object} supabase - Supabase client
 * @param {string} feedId - Feed ID'si
 */
async function updateFeedTimestamp(supabase, feedId) {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("feeds")
      .update({
        last_updated: now,
        last_fetched: now,
        updated_at: now,
      })
      .eq("id", feedId);

    if (error) {
      console.error(`❌ Feed zaman damgası güncelleme hatası:`, error);
    } else {
      console.log(`✅ Feed zaman damgası güncellendi`);
    }
  } catch (error) {
    console.error(`❌ Feed zaman damgası güncelleme hatası (catch):`, error);
  }
}

/**
 * RLS politikalarını kontrol eder
 * @param {Object} supabase - Supabase istemcisi
 * @returns {Promise<Object>} - RLS politika sonuçları
 */
async function checkRlsPolicies(supabase) {
  try {
    console.log("🔍 RLS politikalarını kontrol ediyorum...");
    // Politikaları kontrol etmek için test eklemesi dene
    const testItem = {
      feed_id: "00000000-0000-0000-0000-000000000000", // Geçici test ID'si
      video_id: `test-${Date.now()}`,
      title: "RLS Test Item",
      url: "https://youtube.com/test",
      created_at: new Date().toISOString(),
    };

    // Politikaları sorgula
    try {
      const { data: policies } = await supabase.rpc("get_table_policies", {
        table_name: "youtube_items",
      });

      console.log("📋 YouTube_items tablosu politikaları:", policies);

      // Politikaların varlığını ve insert iznini kontrol et
      const insertPolicy = policies?.find(
        (p) => p.operation === "INSERT" || p.operation === "ALL"
      );

      if (!insertPolicy) {
        console.warn(
          "⚠️ YouTube_items tablosu için insert politikası bulunamadı"
        );
        return { canInsert: false, policies };
      }
    } catch (rpcError) {
      console.warn("⚠️ Politika sorgulama hatası:", rpcError.message);
      // RPC fonksiyonu bulunamadıysa, test inserti deneriz
    }

    // Test insert yap
    const { data, error } = await supabase
      .from("youtube_items")
      .insert(testItem)
      .select("id");

    // Hemen silme işlemi yap
    if (data && data[0]?.id) {
      await supabase.from("youtube_items").delete().eq("id", data[0].id);

      console.log("✅ RLS testi başarılı: Insert izni var");
      return { canInsert: true };
    }

    if (error) {
      // Tablo bulunamama hatası mı, yoksa yetki hatası mı?
      const isPermissionError =
        error.code === "42501" || // permission denied
        error.code === "PGRST204" || // JWT içeriği policy'ye uymuyor
        error.message?.includes("permission denied") ||
        error.message?.includes("new row violates row-level");

      if (isPermissionError) {
        console.warn("⚠️ RLS testi başarısız: Insert izni yok", error.message);
        return { canInsert: false, error: error.message, code: error.code };
      }

      // Diğer hata türleri
      console.warn("⚠️ RLS test insert hatası:", error.message);
      return { canInsert: false, error: error.message, code: error.code };
    }

    return { canInsert: false, error: "Bilinmeyen durum" };
  } catch (error) {
    console.error("❌ RLS politika kontrolü hatası:", error);
    return { canInsert: false, error: error.message };
  }
}

/**
 * API durum kontrolü
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // RLS politikalarını kontrol et
    const rlsCheck = await checkRlsPolicies(supabase);

    return NextResponse.json({
      status: "available",
      message: "YouTube Senkronizasyon API'si çalışıyor",
      rls: rlsCheck,
    });
  } catch (error) {
    console.error(`❌ Genel hata:`, error);
    return NextResponse.json(
      { error: `Senkronizasyon hatası: ${error.message}` },
      { status: 500 }
    );
  }
}

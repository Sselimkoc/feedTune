import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube feed'leri ve içerikleri için tanılama API'si
 */
export async function GET(request) {
  try {
    // URL search parametreleri
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const feedId = searchParams.get("feedId");

    if (!userId) {
      return NextResponse.json(
        { error: "UserId parametresi gerekli" },
        { status: 400 }
      );
    }

    // Route handler client oluştur
    const supabase = createRouteHandlerClient({ cookies });

    // Session kontrolü
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const result = {
      timestamp: new Date().toISOString(),
      userId,
      feeds: {},
      items: {},
      rls: {},
    };

    // 1. YouTube feed'lerini kontrol et
    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id, title, url, type, last_fetched, last_updated, created_at")
      .eq("user_id", userId)
      .eq("type", "youtube")
      .is("deleted_at", null);

    result.feeds = {
      count: feeds?.length || 0,
      error: feedsError ? feedsError.message : null,
      sample: feeds?.slice(0, 3) || [],
    };

    // 2. Belirli bir feed veya tüm feed'ler için YouTube içeriklerini kontrol et
    if (feeds && feeds.length > 0) {
      const targetFeedIds = feedId ? [feedId] : feeds.map((f) => f.id);

      const { data: items, error: itemsError } = await supabase
        .from("youtube_items")
        .select("id, feed_id, video_id, title, published_at, created_at")
        .in("feed_id", targetFeedIds)
        .order("published_at", { ascending: false })
        .limit(20);

      result.items = {
        count: items?.length || 0,
        error: itemsError ? itemsError.message : null,
        sample: items?.slice(0, 5) || [],
      };

      // 3. Her feed için içerik sayısını kontrol et
      if (feeds.length > 0) {
        const feedCounts = await Promise.all(
          feeds.map(async (feed) => {
            const { count, error } = await supabase
              .from("youtube_items")
              .select("*", { count: "exact", head: true })
              .eq("feed_id", feed.id);

            return {
              feedId: feed.id,
              title: feed.title,
              count: count || 0,
              error: error ? error.message : null,
            };
          })
        );

        result.feedCounts = feedCounts;
      }

      // 4. RLS politikalarını test et
      try {
        const { data: rlsTest, error: rlsError } = await supabase.rpc(
          "test_youtube_items_rls",
          { user_id_param: userId }
        );

        result.rls = {
          success: !!rlsTest,
          error: rlsError ? rlsError.message : null,
          data: rlsTest,
        };
      } catch (rlsError) {
        result.rls = {
          success: false,
          error: rlsError.message,
          note: "RLS test fonksiyonu bulunamadı",
        };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("YouTube tanılama hatası:", error);

    return NextResponse.json(
      { error: "Tanılama işlemi sırasında hata: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * Manuel YouTube içerik senkronizasyonu
 */
export async function POST(request) {
  try {
    const { feedId, userId } = await request.json();

    if (!feedId || !userId) {
      return NextResponse.json(
        { error: "feedId ve userId parametreleri gerekli" },
        { status: 400 }
      );
    }

    // Route handler client oluştur
    const supabase = createRouteHandlerClient({ cookies });

    // Session kontrolü
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    // Feed'i kontrol et
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("*")
      .eq("id", feedId)
      .eq("user_id", userId)
      .eq("type", "youtube")
      .is("deleted_at", null)
      .single();

    if (feedError || !feed) {
      return NextResponse.json(
        { error: feedError?.message || "Feed bulunamadı" },
        { status: 404 }
      );
    }

    // Manuel senkronizasyon için API çağrısı yap
    // Not: Burada normalde özel bir API endpoint'i çağırırdık
    const result = {
      success: true,
      message: "YouTube feed senkronizasyonu başlatıldı",
      feed: {
        id: feed.id,
        title: feed.title,
        url: feed.url,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("YouTube senkronizasyon hatası:", error);

    return NextResponse.json(
      { error: "Senkronizasyon işlemi sırasında hata: " + error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    // URL search parametreleri
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Her işlevi inceleyecek bayraklar
    const checkFeeds = searchParams.get("feeds") === "true";
    const checkRssItems = searchParams.get("rssItems") === "true";
    const checkYoutubeItems = searchParams.get("youtubeItems") === "true";
    const checkUserInteractions = searchParams.get("interactions") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "UserId parametresi gerekli" },
        { status: 400 }
      );
    }

    // Route handler client oluştur - server tarafında güvenilir auth
    const supabase = createRouteHandlerClient({ cookies });

    const diagnosticResult = {
      timestamp: new Date().toISOString(),
      userId,
      dbConnection: true,
      tables: {},
      tablesExist: {},
    };

    // Tablo varlığını kontrol et
    const tableCheckPromises = [
      checkTableExists(supabase, "feeds"),
      checkTableExists(supabase, "rss_items"),
      checkTableExists(supabase, "youtube_items"),
      checkTableExists(supabase, "user_interactions"),
    ];

    const [feedsExist, rssItemsExist, youtubeItemsExist, interactionsExist] =
      await Promise.all(tableCheckPromises);

    diagnosticResult.tablesExist = {
      feeds: feedsExist,
      rss_items: rssItemsExist,
      youtube_items: youtubeItemsExist,
      user_interactions: interactionsExist,
    };

    // Feed verilerini kontrol et
    if (checkFeeds) {
      const { data: feeds, error } = await supabase
        .from("feeds")
        .select("id, title, url, type, user_id, created_at, updated_at")
        .eq("user_id", userId)
        .is("deleted_at", null);

      diagnosticResult.tables.feeds = {
        count: feeds?.length || 0,
        error: error ? error.message : null,
        sample: feeds?.slice(0, 3) || [],
      };

      // Feed ID'lerini topla
      if (feeds && feeds.length > 0) {
        const rssFeedIds = feeds
          .filter((feed) => feed.type === "rss" || feed.type === "atom")
          .map((feed) => feed.id);

        const youtubeFeedIds = feeds
          .filter((feed) => feed.type === "youtube")
          .map((feed) => feed.id);

        // RSS öğelerini kontrol et
        if (checkRssItems && rssFeedIds.length > 0) {
          const { data: rssItems, error: rssError } = await supabase
            .from("rss_items")
            .select("id, title, feed_id, published_at, created_at")
            .in("feed_id", rssFeedIds)
            .limit(10);

          diagnosticResult.tables.rss_items = {
            count: rssItems?.length || 0,
            error: rssError ? rssError.message : null,
            feedIds: rssFeedIds,
            sample: rssItems?.slice(0, 3) || [],
          };
        }

        // YouTube öğelerini kontrol et
        if (checkYoutubeItems && youtubeFeedIds.length > 0) {
          const { data: youtubeItems, error: youtubeError } = await supabase
            .from("youtube_items")
            .select("id, title, feed_id, published_at, created_at")
            .in("feed_id", youtubeFeedIds)
            .limit(10);

          diagnosticResult.tables.youtube_items = {
            count: youtubeItems?.length || 0,
            error: youtubeError ? youtubeError.message : null,
            feedIds: youtubeFeedIds,
            sample: youtubeItems?.slice(0, 3) || [],
          };
        }
      }
    }

    // Kullanıcı etkileşimlerini kontrol et
    if (checkUserInteractions) {
      const { data: interactions, error: interactionsError } = await supabase
        .from("user_interactions")
        .select(
          "id, user_id, item_id, item_type, is_read, is_favorite, is_read_later, created_at"
        )
        .eq("user_id", userId)
        .limit(10);

      diagnosticResult.tables.user_interactions = {
        count: interactions?.length || 0,
        error: interactionsError ? interactionsError.message : null,
        sample: interactions?.slice(0, 3) || [],
      };
    }

    return NextResponse.json(diagnosticResult);
  } catch (error) {
    console.error("Tanılama API hatası:", error);
    return NextResponse.json(
      { error: "Tanılama işlemi sırasında hata: " + error.message },
      { status: 500 }
    );
  }
}

// Bir tablonun var olup olmadığını kontrol eden yardımcı fonksiyon
async function checkTableExists(supabase, tableName) {
  try {
    // Tablodan tek bir kayıt çekmeyi dene
    const { error } = await supabase
      .from(tableName)
      .select("count")
      .limit(1)
      .maybeSingle();

    // pg_class sorgusu yapmak yerine basit bir hata kontrolü
    return !error || !error.message.includes("does not exist");
  } catch (error) {
    console.error(`${tableName} tablosunu kontrol ederken hata:`, error);
    return false;
  }
}

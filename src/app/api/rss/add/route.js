import { NextResponse } from "next/server";
import { addRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * RSS besleme ekleme endpoint'i
 *
 * POST metodu ile çağrılır ve body'de url parametresi bekler.
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

    // Request body'den URL'yi al
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL parametresi gereklidir" },
        { status: 400 }
      );
    }

    // Mevcut kullanıcının feed listesinde bu URL'nin olup olmadığını kontrol et
    const { data: existingFeeds, error: feedCheckError } = await supabase
      .from("rss_feeds")
      .select("id, feeds!inner(user_id)")
      .eq("feed_url", url)
      .eq("feeds.user_id", session.user.id)
      .eq("feeds.is_active", true);

    if (feedCheckError) {
      console.error("Feed kontrol hatası:", feedCheckError);
      return NextResponse.json(
        { error: "RSS besleme kontrolü sırasında bir hata oluştu" },
        { status: 500 }
      );
    }

    // Eğer feed zaten eklenmiş ise hata döndür
    if (existingFeeds && existingFeeds.length > 0) {
      return NextResponse.json(
        { error: "Bu RSS beslemesi zaten eklenmiş" },
        { status: 409 }
      );
    }

    // RSS beslemesini ekle
    const newFeed = await addRssFeed(url, session.user.id);

    return NextResponse.json({
      success: true,
      message: "RSS beslemesi başarıyla eklendi",
      feed: {
        id: newFeed.id,
        title: newFeed.title,
        description: newFeed.description,
        link: newFeed.link,
      },
    });
  } catch (error) {
    console.error("RSS besleme ekleme hatası:", error);

    return NextResponse.json(
      { error: error.message || "RSS beslemesi eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

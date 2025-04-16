import { NextResponse } from "next/server";
import { addRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * RSS feed add endpoint
 *
 * Called via POST method and expects url parameter in the body.
 */
export async function POST(request) {
  try {
    // Session check
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

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL parametresi gereklidir" },
        { status: 400 }
      );
    }

    // Check if the URL already exists in the user's feed list
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

    if (existingFeeds && existingFeeds.length > 0) {
      return NextResponse.json(
        { error: "This RSS feed is already added" },
        { status: 409 }
      );
    }

    const newFeed = await addRssFeed(url, session.user.id);

    return NextResponse.json({
      success: true,
      message: "RSS feed added successfully",
      feed: {
        id: newFeed.id,
        title: newFeed.title,
        description: newFeed.description,
        url: newFeed.url,
      },
    });
  } catch (error) {
    console.error("RSS feed add error:", error);

    return NextResponse.json(
      { error: error.message || "Error adding RSS feed" },
      { status: 500 }
    );
  }
}

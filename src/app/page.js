import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { HomeContent } from "@/components/home/HomeContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSession(supabase) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

async function getFeedsData(session) {
  if (!session) {
    return {
      feeds: [],
      stats: {},
      recentItems: [],
    };
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Get feeds
    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (feedsError) throw feedsError;

    // Get recent items from feed_items
    const { data: recentItems, error: itemsError } = await supabase
      .from("feed_items")
      .select("*")
      .in(
        "feed_id",
        feeds.map((f) => f.id)
      )
      .order("published_at", { ascending: false })
      .limit(10);

    if (itemsError) throw itemsError;

    // Calculate basic stats
    const stats = {
      totalFeeds: feeds.length,
      totalItems: recentItems?.length || 0,
      rssFeeds: feeds.filter((f) => f.type === "rss").length,
      youtubeFeeds: feeds.filter((f) => f.type === "youtube").length,
    };

    return {
      feeds: feeds || [],
      stats: stats || {},
      recentItems: recentItems || [],
    };
  } catch (error) {
    console.error("Error fetching feeds data:", error);
    return {
      feeds: [],
      stats: {},
      recentItems: [],
    };
  }
}

export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const session = await getSession(supabase);
  const { feeds, stats, recentItems } = await getFeedsData(session);

  return (
    <HomeContent
      initialSession={session}
      feeds={feeds}
      stats={stats}
      recentItems={recentItems}
    />
  );
}

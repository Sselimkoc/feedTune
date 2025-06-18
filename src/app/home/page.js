import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { feedService } from "@/services/feedService";

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

    // Get stats
    const stats = await feedService.getStats(session.user.id);

    // Get recent items
    const recentItems = await feedService.getRecentItems(session.user.id);

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

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { HomeContent } from "@/components/home/HomeContent";
import { feedService } from "@/services/feedService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSession() {
  try {
    const supabase = createServerComponentClient({ cookies });
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
    const supabase = createServerComponentClient({ cookies });

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
  const session = await getSession();
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

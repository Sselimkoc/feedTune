import { Suspense } from "react";
import { Loader2, Rss } from "lucide-react";
import { FeedContainer } from "@/components/features/feeds/layout/FeedContainer";
import { FeedDialogManager } from "@/components/features/feeds/dialogs/FeedDialogManager";
import { extractFeedTitle } from "@/lib/utils";

// Set page to dynamic to allow for query parameters
export const dynamic = "force-dynamic";

// Metadata for the page
export async function generateMetadata({ params, searchParams }) {
  // If there's a feed ID in the search params, try to get its title
  let title = "Feeds | FeedTune";
  let description = "View and manage your RSS feeds and YouTube channels.";

  // For now we'll use a generic title, but in a real implementation
  // you might fetch the feed title from the database
  if (searchParams?.id) {
    try {
      // This would typically be a database call
      // const feed = await db.feed.findFirst({ where: { id: searchParams.id }});
      // if (feed) {
      //   title = `${feed.title} | FeedTune`;
      //   description = feed.description || description;
      // }
    } catch (error) {
      console.error("Error fetching feed for metadata:", error);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(title.split(" | ")[0])}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

/**
 * Feeds Page Component
 * Main page for displaying and managing feeds
 */
export default function FeedsPage({ searchParams }) {
  // Extract feedId from searchParams if available
  const feedId = searchParams?.id;

  return (
    <div className="max-w-[1600px] mx-auto py-4 px-3 sm:px-4 md:py-6 md:px-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        {/* Main feed container component */}
        <FeedContainer
          initialFeedId={feedId}
          headerIcon={<Rss className="w-6 h-6" />}
        />

        {/* Dialog manager for feed-related dialogs */}
        <FeedDialogManager />
      </Suspense>
    </div>
  );
}

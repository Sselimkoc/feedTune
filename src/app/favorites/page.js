import { Suspense } from "react";
import { FavoritesContent } from "@/components/features/favorites/FavoritesContent";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

// Metadata and OpenGraph
export async function generateMetadata() {
  return {
    title: "Favorites | FeedTune",
    description: "View and manage your favorite content from RSS feeds and YouTube channels.",
    keywords: ["favorites", "bookmarks", "saved content", "RSS", "YouTube"],
    openGraph: {
      title: "Favorites | FeedTune",
      description: "View and manage your favorite content from RSS feeds and YouTube channels.",
      type: "website",
    },
  };
}

export default function FavoritesPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-2 md:px-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <FavoritesContent />
      </Suspense>
    </div>
  );
}

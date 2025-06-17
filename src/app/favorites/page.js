import { Suspense } from "react";
import { FavoritesContent } from "@/components/features/favorites/FavoritesContent";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

// Metadata and OpenGraph
export async function generateMetadata() {
  return {
    title: "Favoriler | FeedTune",
    description: "Favori içeriklerinizi görüntüleyin ve yönetin.",
    openGraph: {
      title: "Favoriler | FeedTune",
      description: "Favori içeriklerinizi görüntüleyin ve yönetin.",
    },
  };
}

export default function FavoritesPage() {
  return (
    <div className="max-w-screen-2xl mx-auto py-8 px-2 md:px-6">
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

import { Suspense } from "react";
import { FeedContent } from "@/components/feeds/FeedContent";

export const dynamic = "force-dynamic";

export default function FeedsPage() {
  return (
    <main className="container py-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <FeedContent />
      </Suspense>
    </main>
  );
}

import { Suspense } from "react";
import { FeedContent } from "@/components/feeds/FeedContent";

export const dynamic = "force-dynamic";

export default function FeedsPage() {
  return (
    <main className="container py-6 min-h-0">
      <Suspense fallback={<div>Loading...</div>}>
        <FeedContent />
      </Suspense>
    </main>
  );
}

import { Suspense } from "react";
import { FeedContent } from "@/components/feeds/FeedContent";

export const dynamic = "force-dynamic";

export default function FeedsPage() {
  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">My Feeds</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <FeedContent />
      </Suspense>
    </main>
  );
}

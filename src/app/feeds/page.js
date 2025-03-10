import { Suspense } from "react";
import { FeedContent } from "@/components/features/feeds/FeedContent";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FeedsPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-4 px-3 sm:px-4 md:py-6 md:px-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <FeedContent />
      </Suspense>
    </div>
  );
}

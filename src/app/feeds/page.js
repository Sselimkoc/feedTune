import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { FeedContainer } from "@/components/features/feeds/layout/FeedContainer";

export const dynamic = "force-dynamic";

// Metadata ve OpenGraph bilgileri
export async function generateMetadata() {
  return {
    title: "Feed İçerikleri | FeedTune",
    description:
      "RSS beslemeleriniz ve YouTube kanallarınızdan içerikleri görüntüleyin.",
  };
}

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
        <FeedContainer />
      </Suspense>
    </div>
  );
}

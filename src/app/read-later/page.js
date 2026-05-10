import { Suspense } from "react";
import { ReadLaterContent } from "@/components/features/read-later/ReadLaterContent";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Read Later | FeedTune",
  description: "Save content to read later from your RSS feeds and YouTube subscriptions.",
  keywords: ["read later", "bookmarks", "saved articles", "RSS", "YouTube"],
  openGraph: {
    title: "Read Later | FeedTune",
    description: "Save content to read later from your RSS feeds and YouTube subscriptions.",
    type: "website",
  },
};

export default function ReadLaterPage() {
  return (
    <div className="max-w-screen-2xl mx-auto py-8 px-2 md:px-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReadLaterContent />
      </Suspense>
    </div>
  );
}

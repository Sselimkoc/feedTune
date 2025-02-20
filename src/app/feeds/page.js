import { AddFeedDialog } from "@/components/Feeds/AddFeedDialog";
import { FeedList } from "@/components/Feeds/FeedList";

export default function FeedsPage() {
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Feeds</h1>
        <AddFeedDialog />
      </div>
      <FeedList />
    </div>
  );
}

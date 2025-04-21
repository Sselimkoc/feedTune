import { useState } from "react";
import { useFeedScreen } from "@/hooks/useFeedScreen";
import { FeedList } from "../layout/FeedList";

export function FeedScreen() {
  const { feeds, refreshFeeds } = useFeedScreen();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFeeds();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <FeedList
        feeds={feeds}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}

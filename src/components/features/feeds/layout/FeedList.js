import { useTranslations } from "next-intl";
import { FeedContainer } from "./FeedContainer";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useFeedService } from "@/hooks/useFeedService";

export function FeedList({ feeds, onRefresh, isRefreshing }) {
  const t = useTranslations();
  const { refreshFeed } = useFeedService();

  const handleRefresh = async (feed, skipCache = false) => {
    try {
      toast.loading(t("refreshingSelectedFeed"));
      await refreshFeed(feed, skipCache);
      toast.success(t("refreshSuccess"));
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Feed refresh error:", error);
      toast.error(t("refreshError"));
    }
  };

  if (!feeds.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("noFeeds")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("feeds")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? t("refreshing") : t("refresh")}
        </Button>
      </div>
      <div className="grid gap-4">
        {feeds.map((feed) => (
          <FeedContainer key={feed.id} feed={feed} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertCircle } from "lucide-react";
import { FeedCard } from "./FeedCard";
import { useFeedService } from "@/hooks/features/useFeedService";
import Link from "next/link";

export function FeedList({
  feeds,
  isLoading,
  error,
  viewMode = "grid",
  onFeedDelete,
}) {
  const { t } = useLanguage();
  const { invalidateFeedsQuery } = useFeedService();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="h-[200px]">
            <div className="p-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("feeds.error.title")}</h3>
        <p className="text-muted-foreground mb-4">
          {t("feeds.error.description")}
        </p>
        <Button variant="outline" onClick={() => invalidateFeedsQuery()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (!feeds?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("feeds.empty.title")}</h3>
        <p className="text-muted-foreground mb-4">
          {t("feeds.empty.description")}
        </p>
        <Button asChild>
          <Link href="/feeds/add">{t("feeds.add")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      {feeds.map((feed) => (
        <FeedCard key={feed.id} feed={feed} onDelete={onFeedDelete} />
      ))}
    </div>
  );
}

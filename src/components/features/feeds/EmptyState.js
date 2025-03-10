"use client";

import { Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function EmptyState({ onAddFeed }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Rss className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {t("feeds.emptyState.title")}
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t("feeds.emptyState.description")}
      </p>
      <Button onClick={onAddFeed} className="mt-6">
        {t("feeds.emptyState.addFeedButton")}
      </Button>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { AddFeedDialog } from "./AddFeedDialog";
import { PlusCircle, Rss, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function EmptyFeedState() {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 p-8 text-center">
      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-8 shadow-sm border max-w-md">
        <div className="flex justify-center mb-6 space-x-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse" />
            <Rss className="h-12 w-12 text-primary relative" />
          </div>
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/10 animate-pulse [animation-delay:500ms]" />
            <Youtube className="h-12 w-12 text-primary/80 relative" />
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-3">
          {t("feeds.feedList.noFeeds")}
        </h3>
        <p className="text-muted-foreground mb-8">
          {t("feeds.feedList.description")}
        </p>

        <AddFeedDialog>
          <Button size="lg" className="w-full gap-2">
            <PlusCircle className="h-5 w-5" />
            <span>{t("feeds.feedList.addFeed")}</span>
          </Button>
        </AddFeedDialog>
      </div>
    </div>
  );
}

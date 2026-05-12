"use client";

import { Rss } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function FeedHeader({ totalFeeds }) {
  const { t } = useTranslation();
  return (
    <header className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mt-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Rss className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-blue-500 drop-shadow-sm">
            {t("feeds.title")}
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            {t("feeds.description")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalFeeds} {t("feeds.items")}
        </span>
      </div>
    </header>
  );
}

"use client";

import { Rss } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function FeedHeader({ totalFeeds }) {
  const { t } = useTranslation();
  return (
    <header className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mt-0 md:mt-8 mb-4 md:mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Rss className="h-5 w-5 md:h-7 md:w-7 text-blue-600 shrink-0" />
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-blue-500 drop-shadow-sm leading-tight">
            {t("feeds.title")}
          </h1>
          <p className="hidden sm:block text-muted-foreground text-sm md:text-base max-w-2xl">
            {t("feeds.description")}
          </p>
        </div>
      </div>
      <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
        {totalFeeds} {t("feeds.items")}
      </span>
    </header>
  );
}

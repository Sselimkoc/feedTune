"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function FeedIcon({ feed }) {
  if (feed.icon) {
    return (
      <img
        src={feed.icon}
        alt=""
        className="w-5 h-5 rounded-full"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const div = document.createElement("div");
          div.className =
            "w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold";
          div.textContent = feed.title?.charAt(0)?.toUpperCase() || "F";
          e.currentTarget.parentElement.insertBefore(div, e.currentTarget);
        }}
      />
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
      {feed.title?.charAt(0)?.toUpperCase()}
    </div>
  );
}

export function FeedFilterBar({ feeds, selectedFeedIds, onSelectAll, onSelectFeed }) {
  const { t } = useTranslation();

  return (
    <nav className="w-full overflow-x-auto flex gap-2 mb-8 py-2 px-1 sticky top-16 z-20 bg-background/80 backdrop-blur-sm border-b border-border/40">
      <button
        onClick={onSelectAll}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium whitespace-nowrap",
          selectedFeedIds.length === 0
            ? "bg-blue-600 text-white shadow"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
      >
        <span className="font-bold">{t("feeds.allFeeds")}</span>
      </button>

      {feeds.map((feed) => (
        <button
          key={feed.id}
          onClick={() => onSelectFeed(feed.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium whitespace-nowrap",
            selectedFeedIds.includes(feed.id)
              ? "bg-blue-600 text-white shadow"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          <FeedIcon feed={feed} />
          <span>{feed.title}</span>
        </button>
      ))}
    </nav>
  );
}

"use client";

import { useLanguage } from "@/hooks/useLanguage";

export function KeyboardShortcuts() {
  const { t } = useLanguage();

  // Klavye kısayolları
  const shortcuts = [
    { key: "j", description: t("shortcuts.nextItem") },
    { key: "k", description: t("shortcuts.prevItem") },
    { key: "o", description: t("shortcuts.openItem") },
    {
      key: "m",
      description: t("shortcuts.markAsRead"),
    },
    {
      key: "s",
      description: t("shortcuts.toggleFavorite"),
    },
    {
      key: "b",
      description: t("shortcuts.saveForLater"),
    },
    {
      key: "r",
      description: t("shortcuts.refreshFeeds"),
    },
    { key: "f", description: t("shortcuts.openFilter") },
    { key: "g", description: t("shortcuts.gridView") },
    { key: "l", description: t("shortcuts.listView") },
    {
      key: "?",
      description: t("shortcuts.openShortcuts"),
    },
    { key: "Esc", description: t("shortcuts.close") },
  ];

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground mb-4">
        {t("shortcuts.description")}
      </p>

      <div className="grid grid-cols-1 gap-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.key}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <span className="text-sm">{shortcut.description}</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-primary bg-muted rounded border border-border">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

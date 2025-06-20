"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Keyboard } from "lucide-react";
import { ScrollArea } from "@/components/core/ui/scroll-area";

export function KeyboardShortcutsDialog({ isOpen, onOpenChange }) {
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t("shortcuts.title")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] px-1">
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
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button>{t("common.close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

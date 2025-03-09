"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function KeyboardShortcutsHelp({ open, onOpenChange }) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("feeds.keyboardShortcuts.title")}</DialogTitle>
          <DialogDescription>
            {t("feeds.keyboardShortcuts.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">j / ↓</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.nextItem")}
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">k / ↑</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.previousItem")}
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">o / Enter</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.openItem")}
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">m</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.markAsRead")}
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">s</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.addToFavorites")}
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">b</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.addToReadLater")}
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">?</div>
            <div className="text-sm text-muted-foreground">
              {t("feeds.keyboardShortcuts.showHelp") || "Bu yardımı göster"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

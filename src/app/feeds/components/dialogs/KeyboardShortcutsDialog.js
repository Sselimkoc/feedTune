"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Keyboard } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function KeyboardShortcutsDialog({ isOpen, onOpenChange }) {
  const { t } = useLanguage();

  // Klavye kısayolları
  const shortcuts = [
    { key: "j", description: t("shortcuts.nextItem") || "Sonraki öğe" },
    { key: "k", description: t("shortcuts.prevItem") || "Önceki öğe" },
    { key: "o", description: t("shortcuts.openItem") || "Öğeyi aç" },
    {
      key: "m",
      description:
        t("shortcuts.markAsRead") || "Okundu/Okunmadı olarak işaretle",
    },
    {
      key: "s",
      description: t("shortcuts.toggleFavorite") || "Favorilere ekle/çıkar",
    },
    {
      key: "b",
      description: t("shortcuts.saveForLater") || "Sonra okumak üzere kaydet",
    },
    {
      key: "r",
      description: t("shortcuts.refreshFeeds") || "Feed'leri yenile",
    },
    { key: "f", description: t("shortcuts.openFilter") || "Filtreleri aç" },
    { key: "g", description: t("shortcuts.gridView") || "Izgara görünümü" },
    { key: "l", description: t("shortcuts.listView") || "Liste görünümü" },
    {
      key: "?",
      description: t("shortcuts.openShortcuts") || "Klavye kısayollarını aç",
    },
    { key: "Esc", description: t("shortcuts.close") || "Kapat" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t("shortcuts.title") || "Klavye Kısayolları"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] px-1">
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground mb-4">
              {t("shortcuts.description") ||
                "Daha hızlı gezinmek için aşağıdaki klavye kısayollarını kullanabilirsiniz"}
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

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    {
      key: "Tab / Shift+Tab",
      description: "Bir sonraki / önceki feed'e geçiş yap",
    },
    {
      key: "↑",
      description: "Bir önceki feed'e geçiş yap",
    },
    {
      key: "↓",
      description: "Bir sonraki feed'e geçiş yap",
    },
    {
      key: "→",
      description: "Bir sonraki öğeye geçiş yap",
    },
    {
      key: "←",
      description: "Bir önceki öğeye geçiş yap",
    },
    {
      key: "Enter",
      description: "Seçili öğeyi yeni sekmede aç ve okundu olarak işaretle",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Klavye Kısayolları</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Klavye Kısayolları</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Feed'ler arasında gezinmek ve içerikleri okumak için aşağıdaki
            klavye kısayollarını kullanabilirsiniz.
          </p>
          <div className="grid gap-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm font-medium">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

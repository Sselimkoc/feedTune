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

export function KeyboardShortcutsHelp({ open, onOpenChange }) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Klavye Kısayolları</DialogTitle>
          <DialogDescription>
            Feed&apos;leri daha hızlı gezinmek için klavye kısayollarını
            kullanabilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">j / ↓</div>
            <div className="text-sm text-muted-foreground">
              Sonraki öğeye git
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">k / ↑</div>
            <div className="text-sm text-muted-foreground">
              Önceki öğeye git
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">o / Enter</div>
            <div className="text-sm text-muted-foreground">Öğeyi aç</div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">m</div>
            <div className="text-sm text-muted-foreground">
              Okundu/Okunmadı olarak işaretle
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">s</div>
            <div className="text-sm text-muted-foreground">
              Favorilere ekle/çıkar
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">b</div>
            <div className="text-sm text-muted-foreground">
              Okuma listesine ekle/çıkar
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">?</div>
            <div className="text-sm text-muted-foreground">
              Bu yardımı göster
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

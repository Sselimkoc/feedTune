"use client";

import { Button } from "@/components/ui/button";
import { AddFeedDialog } from "./AddFeedDialog";
import { PlusCircle, Rss, Youtube } from "lucide-react";

export function EmptyFeedState() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-8 text-center">
      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-8 shadow-sm border max-w-md">
        <div className="flex justify-center mb-6 space-x-2">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse" />
            <Rss className="h-10 w-10 text-primary relative" />
          </div>
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/10 animate-pulse [animation-delay:500ms]" />
            <Youtube className="h-10 w-10 text-primary/80 relative" />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">Henüz feed eklenmemiş</h3>
        <p className="text-muted-foreground mb-6">
          RSS feed'leri veya YouTube kanalları ekleyerek içerikleri takip etmeye
          başlayabilirsiniz.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <AddFeedDialog defaultPlatform="rss">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Rss className="h-4 w-4" />
              <span>RSS Feed Ekle</span>
            </Button>
          </AddFeedDialog>

          <AddFeedDialog defaultPlatform="youtube">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Youtube className="h-4 w-4" />
              <span>YouTube Ekle</span>
            </Button>
          </AddFeedDialog>
        </div>
      </div>
    </div>
  );
}

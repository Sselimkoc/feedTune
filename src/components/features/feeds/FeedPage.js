"use client";

import { useFeedService } from "@/hooks/features/useFeedService";
import { ContentCard } from "@/components/shared/ContentCard";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Rss } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedPage() {
  const { feeds, items, isLoading, error } = useFeedService();
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);

  // Feed selection logic
  const handleFeedSelect = (feedId) => {
    setSelectedFeedIds((prev) =>
      prev.includes(feedId)
        ? prev.filter((id) => id !== feedId)
        : [...prev, feedId]
    );
  };

  // Filter items by selected feeds
  const filteredItems =
    selectedFeedIds.length === 0
      ? items
      : items.filter((item) => selectedFeedIds.includes(item.feed_id));

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/60">
      {/* Header */}
      <header className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mt-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-primary drop-shadow-sm">
            İçerikler
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Seçili beslemelerden gelen en güncel içerikleri keşfet.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedFeedIds.length === 0 ? "default" : "outline"}
            onClick={() => setSelectedFeedIds([])}
            size="sm"
          >
            Tümünü Göster
          </Button>
        </div>
      </header>

      {/* Feed Filter Bar */}
      <nav className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mb-8 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {feeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => handleFeedSelect(feed.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all border border-transparent hover:bg-primary/10 hover:border-primary/30 text-left whitespace-nowrap",
                selectedFeedIds.includes(feed.id)
                  ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow"
                  : "text-muted-foreground"
              )}
            >
              <span className="truncate font-medium">{feed.title}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted/60">
                {feed.type}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-2 md:px-6">
        <section className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <span className="animate-pulse text-lg text-muted-foreground">
                Yükleniyor...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <span className="text-destructive text-2xl font-bold mb-2">
                Hata!
              </span>
              <span className="text-muted-foreground mb-4">
                İçerikler yüklenemedi.
              </span>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Yenile
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <img
                src="/images/placeholder.webp"
                alt="Boş"
                className="w-32 h-32 opacity-60 mb-4"
              />
              <span className="text-lg font-semibold mb-2">
                Hiç içerik bulunamadı
              </span>
              <span className="text-muted-foreground mb-4">
                Seçili beslemelerde henüz içerik yok.
              </span>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredItems.map((item) => (
                <ContentCard key={item.id} item={item} viewMode="grid" />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Rss, Sparkles, Star, BookOpen } from "lucide-react";

export default function FeedsLoading() {
  return (
    <div className="container py-6 px-4 sm:px-6">
      <div className="relative mb-12">
        {/* Dekoratif arka plan elementleri */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

        {/* Başlık alanı */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/60 backdrop-blur-sm p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Rss className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                <Sparkles className="h-3 w-3" />
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Feeds</h1>
              <p className="text-muted-foreground text-sm">
                Takip ettiğiniz tüm içerikler burada
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <Skeleton className="w-full sm:w-[140px] h-[46px] rounded-lg" />
          </div>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-card/60 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Rss className="h-5 w-5 text-primary" />
            </div>
            <div className="w-full">
              <p className="text-sm font-medium text-muted-foreground">
                Toplam Feed
              </p>
              <Skeleton className="h-8 w-16 mt-1" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
              <Star className="h-5 w-5 text-accent" />
            </div>
            <div className="w-full">
              <p className="text-sm font-medium text-muted-foreground">
                Favori İçerik
              </p>
              <Skeleton className="h-8 w-16 mt-1" />
            </div>
          </div>
        </div>

        <div className="hidden lg:block bg-card/60 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10">
              <BookOpen className="h-5 w-5 text-secondary" />
            </div>
            <div className="w-full">
              <p className="text-sm font-medium text-muted-foreground">
                Okunmamış
              </p>
              <Skeleton className="h-8 w-16 mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Feed listesi */}
      <div className="bg-card/40 backdrop-blur-sm p-4 sm:p-6 rounded-xl border shadow-sm">
        <div className="space-y-8">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[140px] rounded-md" />
              <Skeleton className="h-9 w-[100px] rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-9 w-[100px] rounded-md" />
            </div>
          </div>

          <div className="relative h-[calc(100vh-400px)] overflow-hidden">
            <div className="flex flex-col gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full max-w-4xl mx-auto">
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

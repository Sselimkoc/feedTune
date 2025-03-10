"use client";

import {
  Loader2,
  Rss,
  FileText,
  Star,
  BookmarkCheck,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export function LoadingState() {
  const { t } = useLanguage();

  // Skeleton için sahte veriler
  const statItems = [
    { icon: Rss, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { icon: FileText, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    { icon: Clock, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    { icon: Star, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    {
      icon: BookmarkCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const feedItems = Array(3).fill(null);
  const contentItems = Array(3).fill(null);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Stats Skeleton */}
      <section className="py-6">
        <div className="container">
          <div className="mb-4">
            <Skeleton className="h-6 w-36 mb-1" />
            <Skeleton className="h-4 w-60" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statItems.map((item, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm"
              >
                <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
                  <div className={`p-1.5 rounded-md ${item.bgColor}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <Skeleton className="h-5 w-8" />
                </CardHeader>
                <CardContent className="pb-3">
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feed Management Skeleton */}
      <section className="py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <Skeleton className="h-6 w-36 mb-1" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {feedItems.map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden h-full bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm"
              >
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-md" />
                    <Skeleton className="h-5 w-full max-w-[140px]" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="mt-1 mb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <Skeleton className="h-7 flex-1" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-7 w-7 rounded-md" />
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Content Skeleton */}
      <section className="py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <Skeleton className="h-6 w-36 mb-1" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contentItems.map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden h-full bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm"
              >
                <CardContent className="p-0 h-full flex flex-col">
                  <div>
                    <Skeleton className="w-full aspect-video" />

                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-3 w-20" />
                      </div>

                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-5 w-3/4 mb-3" />

                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-5/6 mb-3" />
                    </div>
                  </div>

                  <div className="p-3 pt-0 mt-auto">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-7 flex-1" />
                      <Skeleton className="h-7 w-7 rounded-md" />
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Yükleme göstergesi */}
      <div className="fixed bottom-4 right-4 bg-card/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-primary/10 animate-pulse">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </div>
  );
}

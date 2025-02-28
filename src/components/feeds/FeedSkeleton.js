"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-col space-y-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex gap-4">
                  <div className="w-[120px] h-[68px] bg-muted animate-pulse rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

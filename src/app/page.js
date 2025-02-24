"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const { user, checkSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession().finally(() => setIsLoading(false));
  }, [checkSession]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div className={user ? "" : "filter blur-sm"}>
        <div className="container py-12">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to FeedTune
            </h1>
            <p className="text-xl text-muted-foreground">
              Your personal RSS feed reader. Stay updated with your favorite
              content creators, blogs, and news sources in one place.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-lg font-semibold mb-2">RSS Feeds</h3>
                <p className="text-muted-foreground">
                  Add and manage RSS feeds from your favorite websites
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-lg font-semibold mb-2">YouTube Channels</h3>
                <p className="text-muted-foreground">
                  Follow YouTube channels and never miss new videos
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-lg font-semibold mb-2">Auto Updates</h3>
                <p className="text-muted-foreground">
                  Content updates automatically at your preferred interval
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!user && <AuthModal isOpen={true} />}
    </div>
  );
}

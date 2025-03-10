"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";

export function HomeFeedManagement({
  feeds,
  onAddFeed,
  onDeleteFeed,
  getRealWebsiteUrl,
}) {
  const { t } = useLanguage();

  return (
    <section className="py-8 lg:py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {t("home.feedManagement.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("home.feedManagement.description")}
            </p>
          </div>
          <Button onClick={onAddFeed}>
            {t("home.feedManagement.addFeed")}
          </Button>
        </div>

        {feeds && feeds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.slice(0, 6).map((feed) => (
              <Card key={feed.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {feed.site_favicon ? (
                      <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={feed.site_favicon}
                          alt={feed.title}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {feed.title?.substring(0, 2).toUpperCase() || "FT"}
                        </span>
                      </div>
                    )}
                    <CardTitle className="text-base truncate flex-1">
                      {feed.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8"
                      >
                        <Link
                          href={getRealWebsiteUrl(feed.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          {t("home.feedManagement.visitSite")}
                        </Link>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteFeed(feed.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                {t("home.feedManagement.noFeeds")}
              </p>
              <Button onClick={onAddFeed}>
                {t("home.feedManagement.addFirstFeed")}
              </Button>
            </CardContent>
          </Card>
        )}

        {feeds && feeds.length > 6 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" asChild>
              <Link href="/feeds">{t("home.feedManagement.viewAllFeeds")}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

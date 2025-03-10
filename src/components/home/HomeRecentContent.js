"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { cn, stripHtml } from "@/lib/utils";

export function HomeRecentContent({ recentItems }) {
  const { t } = useLanguage();

  return (
    <section className="py-8 lg:py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {t("home.recentContent.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("home.recentContent.description")}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/feeds">{t("home.recentContent.viewAllContent")}</Link>
          </Button>
        </div>

        {recentItems && recentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.slice(0, 6).map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden transition-all duration-200 hover:shadow-md",
                  "border border-border/50 hover:border-border"
                )}
              >
                <CardContent className="p-0">
                  <Link
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative w-full aspect-video bg-muted">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                          <span className="text-primary/40 text-lg font-semibold">
                            FeedTune
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {item.feed?.title ||
                            t("home.recentContent.unknownSource")}
                        </p>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <span>
                            {
                              item.timeAgoData
                                ? item.timeAgoData.isJustNow
                                  ? t("timeAgo.justNow")
                                  : item.timeAgoData.value === 1
                                  ? t(`timeAgo.${item.timeAgoData.unit}_one`)
                                  : t(
                                      `timeAgo.${item.timeAgoData.unit}_other`,
                                      {
                                        count: item.timeAgoData.value,
                                      }
                                    )
                                : new Date(
                                    item.published_at
                                  ).toLocaleDateString() // timeAgoData yoksa basit tarih formatı
                            }
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {stripHtml(item.description || "")}
                      </p>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full">
                          {t("home.recentContent.read")}
                        </Button>
                      </div>
                    </div>
                  </Link>
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
              <Button onClick={() => {}}>
                {t("home.feedManagement.addFirstFeed")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

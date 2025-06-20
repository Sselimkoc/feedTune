"use client";

import { Card, CardContent, CardTitle } from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import Link from "next/link";
import Image from "next/image";
import { cn, stripHtml } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  BookmarkCheck,
  Star,
  Loader2,
  ArrowRight,
} from "lucide-react";

export function HomeRecentContent({ recentItems, isLoading }) {
  const { t, language } = useLanguage();

  // Loading state
  if (isLoading) {
    return (
      <section className="py-6 lg:py-8">
        <div className="container">
          <motion.div
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-xl font-bold mb-1">
                {t("home.recentContent.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("home.recentContent.description")}
              </p>
            </div>
          </motion.div>

          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
              <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-full p-4 shadow-lg border">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">{t("common.loading")}</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {t("home.recentContent.loading")}
            </p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 lg:py-8">
      <div className="container">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-xl font-bold mb-1">
              {t("home.recentContent.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.recentContent.description")}
            </p>
          </div>
        </motion.div>

        {recentItems && recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.slice(0, 6).map((item, index) => (
              <motion.div
                key={item.id || `recent-item-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
                  <CardContent className="p-3 h-full flex flex-col">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block flex-1"
                    >
                      <div className="relative w-full aspect-video bg-muted">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title || ""}
                            fill
                            priority={index < 2}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                            <span className="text-primary/40 text-sm font-semibold">
                              FeedTune
                            </span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium max-w-[70%] truncate">
                          {item.feed?.title ||
                            t("home.recentContent.unknownSource")}
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {item.timeAgoData
                                ? item.timeAgoData.isJustNow
                                  ? t("home.recentContent.timeAgo.justNow")
                                  : t(
                                      `home.recentContent.timeAgo.${item.timeAgoData.unit}sAgo`,
                                      {
                                        count: item.timeAgoData.value,
                                      }
                                    )
                                : new Date(
                                    item.published_at
                                  ).toLocaleDateString(
                                    language === "tr" ? "tr-TR" : "en-US",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                            </span>
                          </div>
                        </div>

                        <CardTitle className="text-sm line-clamp-2 mb-1 hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {stripHtml(item.description || "")}
                        </p>
                      </div>
                    </a>

                    <div className="p-3 pt-0 mt-auto">
                      <div className="flex items-center gap-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-7 text-xs group inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          {t("home.recentContent.read")}
                          <ExternalLink className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          >
            <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-md transition-all duration-300">
              <CardContent className="pt-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-primary/60" />
                </div>
                <h3 className="text-lg font-medium mb-1">
                  {t("home.recentContent.noContentTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("home.recentContent.noContent")}
                </p>
                <Button variant="outline" size="sm" className="group" asChild>
                  <Link href="/feeds">
                    {t("home.recentContent.browseFeeds")}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
}

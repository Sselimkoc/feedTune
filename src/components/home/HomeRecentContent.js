"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { cn, stripHtml } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, ExternalLink, BookmarkCheck, Star } from "lucide-react";

export function HomeRecentContent({ recentItems }) {
  const { t } = useLanguage();

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
              {t("home.recentContent.title") || "Son İçerikler"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.recentContent.description") ||
                "Feed'lerinizden en son eklenen içerikler"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/feeds" className="group">
              {t("home.recentContent.viewAllContent") ||
                "Tüm İçerikleri Görüntüle"}
              <ExternalLink className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        {recentItems && recentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {recentItems.slice(0, 6).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden h-full bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm",
                    "hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
                  )}
                >
                  <CardContent className="p-0 h-full flex flex-col">
                    <Link
                      href={item.link}
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

                        {/* Kaynak etiketi */}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium max-w-[70%] truncate">
                          {item.feed?.title ||
                            t("home.recentContent.unknownSource") ||
                            "Bilinmeyen Kaynak"}
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {item.timeAgoData
                                ? item.timeAgoData.isJustNow
                                  ? t("timeAgo.justNow") || "Az önce"
                                  : item.timeAgoData.value === 1
                                  ? t(`timeAgo.${item.timeAgoData.unit}_one`) ||
                                    "1 dk önce"
                                  : t(
                                      `timeAgo.${item.timeAgoData.unit}_other`,
                                      {
                                        count: item.timeAgoData.value,
                                      }
                                    ) || `${item.timeAgoData.value} dk önce`
                                : new Date(
                                    item.published_at
                                  ).toLocaleDateString()}
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
                    </Link>

                    <div className="p-3 pt-0 mt-auto">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs group"
                          asChild
                        >
                          <Link
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("home.recentContent.read") || "Oku"}
                            <ExternalLink className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                          title={
                            t("feeds.feedList.addToFavorites") ||
                            "Favorilere ekle"
                          }
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-emerald-500"
                          title={
                            t("feeds.feedList.addToReadLater") ||
                            "Okuma listesine ekle"
                          }
                        >
                          <BookmarkCheck className="h-3.5 w-3.5" />
                        </Button>
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
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <CardContent className="pt-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-primary/60" />
                </div>
                <h3 className="text-lg font-medium mb-1">
                  {t("home.recentContent.noContentTitle") || "Henüz içerik yok"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("home.recentContent.noContent") ||
                    "Feed'lerinizden içerikler burada görünecek"}
                </p>
                <Button asChild size="sm">
                  <Link href="/feeds">
                    {t("home.feedManagement.viewAllFeeds") ||
                      "Feed'leri Görüntüle"}
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

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import {
  ExternalLink,
  Trash2,
  PlusCircle,
  Rss,
  Youtube,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AddFeedButton } from "@/components/features/feed/buttons/AddFeedButton";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";

export function HomeFeedManagement({ feeds, onAddFeed, onDeleteFeed }) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
              {t("home.feedManagement.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.feedManagement.description")}
            </p>
          </div>
        </motion.div>

        {feeds && feeds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {feeds.slice(0, 6).map((feed, index) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden h-full bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center gap-2">
                      {feed.site_favicon ? (
                        <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-primary/10">
                          <Image
                            src={feed.site_favicon}
                            alt={feed.title || ""}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {feed.type === "youtube" ? (
                            <Youtube className="h-4 w-4 text-primary" />
                          ) : (
                            <Rss className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      )}
                      <CardTitle className="text-sm truncate flex-1">
                        {feed.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    {feed.last_fetched_at && (
                      <div className="mt-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center justify-between">
                          <span className="truncate">
                            {t("home.feedManagement.lastUpdated")}:
                          </span>
                          <span className="text-right">
                            {new Date(
                              feed.last_fetched_at
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        asChild
                      >
                        <Link href={`/feeds?feedId=${feed.id}`}>
                          {t("home.feedManagement.viewContent")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onDeleteFeed?.(feed.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Rss className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("home.feedManagement.noFeeds.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("home.feedManagement.noFeeds.description")}
              </p>
              <AddFeedButton onClick={() => setIsDialogOpen(true)} />
            </div>
          </motion.div>
        )}

        <AddFeedDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={onAddFeed}
        />
      </div>
    </section>
  );
}

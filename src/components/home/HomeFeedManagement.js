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
import { useAddFeed } from "@/hooks/features/feed-screen/useAddFeed";

export function HomeFeedManagement({ feeds, onAddFeed, onDeleteFeed }) {
  const { t } = useTranslation();
  const { isDialogOpen, openAddFeedDialog, closeAddFeedDialog } = useAddFeed();

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

                      <div className="flex items-center">
                        {feed.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            asChild
                          >
                            <Link
                              href={feed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t("home.feedManagement.websiteLink")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteFeed(feed.id)}
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Add Feed Card */}
            {feeds.length < 6 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feeds.length * 0.1 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden h-full border-dashed border border-primary/20 bg-transparent",
                    "flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all",
                    "hover:shadow-md hover:translate-y-[-2px]"
                  )}
                  onClick={openAddFeedDialog}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4 text-center h-full">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <PlusCircle className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-medium mb-1">
                      {t("home.feedManagement.addFeed")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("home.feedManagement.addFeedDescription")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
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
                  <Rss className="h-6 w-6 text-primary/60" />
                </div>
                <h3 className="text-lg font-medium mb-1">
                  {t("home.feedManagement.noFeedsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("home.feedManagement.noFeeds")}
                </p>
                <AddFeedButton onAddFeed={openAddFeedDialog} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {feeds && feeds.length > 6 && (
          <motion.div
            className="flex justify-center mt-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button variant="outline" size="sm" className="group" asChild>
              <Link href="/feeds">
                {t("home.feedManagement.viewAllFeeds")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        )}
        <AddFeedDialog
          isOpen={isDialogOpen}
          onOpenChange={closeAddFeedDialog}
        />
      </div>
    </section>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Rss, FileText, Eye, Star, BookmarkCheck } from "lucide-react";

export function HomeStats({ stats = {} }) {
  const { t } = useTranslation();

  const defaultStats = {
    totalFeeds: 0,
    totalItems: 0,
    unreadItems: 0,
    favoriteItems: 0,
    readLaterItems: 0,
  };

  const safeStats = { ...defaultStats, ...stats };

  const statItems = [
    {
      value: safeStats.totalFeeds,
      label: t("home.stats.totalFeeds"),
      icon: Rss,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      value: safeStats.totalItems,
      label: t("home.stats.totalItems"),
      icon: FileText,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      value: safeStats.unreadItems,
      label: t("home.stats.unreadItems"),
      icon: Eye,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      value: safeStats.favoriteItems,
      label: t("home.stats.favoriteItems"),
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      value: safeStats.readLaterItems,
      label: t("home.stats.readLaterItems"),
      icon: BookmarkCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

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
            <h2 className="text-xl font-bold mb-1">{t("home.stats.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("home.stats.description")}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {statItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
                <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
                  <div className={`p-1.5 rounded-md ${item.bgColor}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {item.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-muted-foreground text-xs truncate">
                    {item.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

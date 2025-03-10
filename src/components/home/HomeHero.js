"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Rss, Youtube, Star, BookmarkCheck } from "lucide-react";
import Image from "next/image";

export function HomeHero({ onAuthClick }) {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      {/* Arka plan desenleri */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Sol taraf - Metin içeriği */}
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Rss className="h-4 w-4 mr-2" />
                FeedTune
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t("home.title")}
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-xl"
              variants={itemVariants}
            >
              {t("home.subtitle")}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4"
              variants={itemVariants}
            >
              <Button size="lg" className="group" onClick={onAuthClick}>
                {t("home.getStarted")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={onAuthClick}>
                {t("auth.login")}
              </Button>
            </motion.div>

            <motion.div
              className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              <div className="flex flex-col items-center p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
                <Rss className="h-5 w-5 text-primary mb-2" />
                <span className="text-sm font-medium">RSS</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
                <Youtube className="h-5 w-5 text-primary mb-2" />
                <span className="text-sm font-medium">YouTube</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
                <Star className="h-5 w-5 text-primary mb-2" />
                <span className="text-sm font-medium">
                  {t("nav.favorites")}
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
                <BookmarkCheck className="h-5 w-5 text-primary mb-2" />
                <span className="text-sm font-medium">
                  {t("nav.readLater")}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Sağ taraf - Görsel içerik */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-primary/10 bg-card/50 backdrop-blur-sm">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/dashboard-preview.png"
                  alt="FeedTune Dashboard"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Dekoratif elementler */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />

            {/* Yüzen kartlar */}
            <motion.div
              className="absolute -top-4 -left-4 p-3 rounded-lg bg-card shadow-lg border border-primary/10 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">RSS Feeds</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -right-4 p-3 rounded-lg bg-card shadow-lg border border-primary/10 backdrop-blur-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">YouTube</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

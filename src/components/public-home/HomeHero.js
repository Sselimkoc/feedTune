"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function HomeHero({ onAuthClick }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <section className="flex justify-center items-center w-full py-6 md:py-12">
        <div className="w-full max-w-md bg-card/80 rounded-xl shadow-md p-5 flex flex-col items-center gap-4">
          <h1 className="text-xl md:text-3xl font-bold text-center">
            FeedTune
          </h1>
          <p className="text-sm md:text-base text-muted-foreground text-center">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <Button className="w-full" size="sm" onClick={onAuthClick}>
              {t("home.hero.getStarted")}
            </Button>
            <Button className="w-full" size="sm" variant="outline">
              {t("home.hero.learnMore")}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {t("home.hero.availableIn")}
            </span>
            <span className="text-xs font-medium">🇹🇷 Türkçe</span>
            <span className="text-xs font-medium">· 🇬🇧 English</span>
          </div>
        </div>
      </section>
    );
  }

  // Desktop: impressive, animated hero
  return (
    <section className="py-12 md:py-20 lg:py-32 overflow-hidden relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-64 h-64 bg-yellow-500/5 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
      </div>
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              duration: 0.5,
              delay: 0.1,
            }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 dark:bg-primary/10 text-primary text-sm font-medium mb-2 relative overflow-hidden group shadow-sm"
          >
            <Zap className="mr-2 h-3.5 w-3.5 animate-pulse" />
            <span className="relative z-10">{t("home.hero.newFeature")}</span>
          </motion.div>
          <motion.h1
            className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl/none bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-primary dark:via-primary/90 dark:to-primary/70 bg-clip-text text-transparent drop-shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.6,
              delay: 0.2,
            }}
          >
            FeedTune
          </motion.h1>
          <motion.p
            className="max-w-[600px] text-xl text-muted-foreground dark:text-muted-foreground mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.5,
              delay: 0.3,
            }}
          >
            {t("home.hero.subtitle")}
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-3 min-[400px]:items-start pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.5,
              delay: 0.4,
            }}
          >
            <Button
              size="lg"
              onClick={onAuthClick}
              className="relative group overflow-hidden rounded-full shadow-md hover:shadow-lg transition-all duration-300"
            >
              <span className="relative z-10 flex items-center font-medium">
                {t("home.hero.getStarted")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 opacity-100 group-hover:opacity-90 transition-opacity duration-300"></span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="rounded-full border-border/60 bg-white/80 dark:bg-transparent hover:bg-accent/30 hover:border-primary/30 transition-all duration-300"
            >
              <Link href="#about">{t("home.hero.learnMore")}</Link>
            </Button>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">
              {t("home.hero.availableIn")}
            </span>
            <span className="text-sm font-medium">🇹🇷 Türkçe</span>
            <span className="text-sm font-medium">· 🇬🇧 English</span>
          </div>
        </div>
      </div>
    </section>
  );
}

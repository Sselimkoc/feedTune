"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaRss, FaTimes, FaYoutube } from "react-icons/fa";
import { useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

// Supported languages
const supportedLanguages = {
  tr: {
    name: "Türkçe",
    nativeName: "Türkçe",
    flag: "🇹🇷",
  },
  en: {
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
};

export default function HomeHero({ onAuthClick }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t, i18n } = useTranslation();

  // Static content - language independent content
  const staticContent = {
    appName: "FeedTune",
    services: [
      { icon: <FaRss className="text-orange-500" />, name: "RSS" },
      { icon: <FaYoutube className="text-red-500" />, name: "YouTube" },
    ],
  };

  // List supported languages with flags
  const renderSupportedLanguages = () => {
    return Object.entries(supportedLanguages)
      .map(
        ([code, langData], index) => langData.flag + " " + langData.nativeName
      )
      .join(" · ");
  };

  return (
    <section
      ref={ref}
      className="py-8 md:py-16 lg:py-24 overflow-hidden relative"
    >
      {/* Background animated patterns - Improved */}
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
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <motion.div
            className="flex flex-col justify-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.5,
                  delay: 0.1,
                }}
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 dark:bg-primary/10 text-primary text-sm font-medium mb-2 relative overflow-hidden group shadow-sm"
              >
                <span className="absolute inset-0 bg-primary/10 dark:bg-primary/5 w-full scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
                <Zap className="mr-2 h-3.5 w-3.5 animate-pulse" />
                <span className="relative z-10">
                  {t("home.hero.newFeature")}
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl/none bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-primary dark:via-primary/90 dark:to-primary/70 bg-clip-text text-transparent drop-shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  duration: 0.6,
                  delay: 0.2,
                }}
              >
                {staticContent.appName}
              </motion.h1>

              <motion.p
                className="max-w-[600px] text-xl text-muted-foreground dark:text-muted-foreground mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  duration: 0.5,
                  delay: 0.3,
                }}
              >
                {t("home.hero.tagline")}
              </motion.p>
            </div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 0.5,
                delay: 0.4,
              }}
            >
              <div className="flex gap-2 items-center">
                {staticContent.services.map((service, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-background dark:bg-background/80 border border-border/50 px-3 py-1.5 rounded-full shadow-sm"
                  >
                    {service.icon}
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span>{t("home.hero.availableIn")}: </span>
                <span className="font-medium">
                  {renderSupportedLanguages()}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 min-[400px]:items-start pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 0.5,
                delay: 0.5,
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
          </motion.div>

          <div className="mx-auto lg:mx-0 relative lg:mt-0 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 0.6,
                delay: 0.2,
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 dark:from-primary/5 dark:to-primary/20 rounded-xl blur-xl"></div>
              <Image
                src="/dashboard-preview.png"
                alt={t("home.hero.dashboardImageAlt")}
                width="600"
                height="400"
                className="relative z-10 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm shadow-2xl"
                priority
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

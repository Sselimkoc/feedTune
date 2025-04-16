"use client";

import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { FaRss, FaTimes, FaYoutube } from "react-icons/fa";
import { useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export default function HomeHero({ onAuthClick }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t, language, supportedLanguages } = useLanguage();

  // Statik içerik - dil bağımsız olan içerikler
  const staticContent = {
    appName: "FeedTune",
    services: [
      { icon: <FaRss className="text-orange-500" />, name: "RSS" },
      { icon: <FaYoutube className="text-red-500" />, name: "YouTube" },
    ],
  };

  // Desteklenen dilleri bayraklarıyla birlikte listele
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
      {/* Arkaplan animasyonlu desenler */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
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
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-primary/5 w-full scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
                <Zap className="mr-2 h-3.5 w-3.5 animate-pulse" />
                <span className="relative z-10">
                  {t("home.hero.newFeature")}
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl/none bg-gradient-to-br from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent"
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
                className="max-w-[600px] text-xl text-muted-foreground mt-2"
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
                    className="flex items-center gap-1.5 bg-background/80 border border-border/50 px-3 py-1 rounded-full shadow-sm"
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
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-100 group-hover:opacity-90 transition-opacity duration-300"></span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="rounded-full border-border/50 hover:bg-accent/30 transition-all duration-300"
              >
                <Link href="#features">{t("home.hero.learnMore")}</Link>
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 rounded-xl blur-xl"></div>
              <Image
                src="/dashboard-preview.png"
                alt={t("home.hero.dashboardImageAlt")}
                width="600"
                height="400"
                className="mx-auto object-cover rounded-xl border border-border/50 shadow-xl relative z-10"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  console.warn("Dashboard preview image could not be loaded");
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.5,
                delay: 0.4,
              }}
              className="absolute right-[10%] top-[5%] hidden lg:block"
            >
              <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-border/50">
                <FaRss className="text-orange-500 h-4 w-4" />
              </div>
              <span className="absolute top-full right-5 h-20 w-px bg-gradient-to-b from-border to-transparent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.5,
                delay: 0.6,
              }}
              className="absolute right-[5%] top-[25%] hidden lg:block"
            >
              <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-border/50">
                <FaTimes className="text-red-500 h-4 w-4" />
              </div>
              <span className="absolute top-full right-5 h-20 w-px bg-gradient-to-b from-border to-transparent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.5,
                delay: 0.8,
              }}
              className="absolute left-[10%] bottom-[15%] hidden lg:block"
            >
              <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-border/50">
                <FaYoutube className="text-red-500 h-4 w-4" />
              </div>
              <span className="absolute bottom-full right-5 h-20 w-px bg-gradient-to-b from-transparent to-border" />
            </motion.div>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            type: "spring",
            stiffness: 70,
            damping: 15,
            duration: 0.7,
            delay: 0.7,
          }}
        >
          <div className="flex flex-col items-center space-y-3 border border-border/40 p-6 rounded-xl bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-primary/10 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              {t("home.features.onboarding.title")}
            </h3>
            <p className="text-muted-foreground text-center">
              {t("home.features.onboarding.description")}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 border border-border/40 p-6 rounded-xl bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-primary/10 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              {t("home.features.analytics.title")}
            </h3>
            <p className="text-muted-foreground text-center">
              {t("home.features.analytics.description")}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 border border-border/40 p-6 rounded-xl bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-primary/10 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              {t("home.features.customization.title")}
            </h3>
            <p className="text-muted-foreground text-center">
              {t("home.features.customization.description")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

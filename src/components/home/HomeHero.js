"use client";

import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { FaRss, FaTimes, FaYoutube } from "react-icons/fa";
import { useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
      className="py-12 md:py-24 lg:py-32 overflow-hidden relative"
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                {staticContent.appName}
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                {t("home.hero.tagline")}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                {staticContent.services.map((service, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full"
                  >
                    {service.icon}
                    <span className="text-sm">{service.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>{t("home.hero.availableIn")}: </span>
                <span className="font-medium">
                  {renderSupportedLanguages()}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 min-[400px]:items-start">
              <button
                onClick={onAuthClick}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
              >
                {t("home.hero.getStarted")}
              </button>
              <Link
                href="/features"
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
              >
                {t("home.hero.learnMore")}
              </Link>
            </div>
          </div>
          <div className="mx-auto lg:mx-0 relative lg:mt-0 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <Image
                src="/dashboard-preview.png"
                alt={t("home.hero.dashboardImageAlt")}
                width="600"
                height="400"
                className="mx-auto object-cover rounded-xl border border-gray-200 shadow-lg dark:border-gray-800"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  console.warn("Dashboard preview image could not be loaded");
                }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute right-[10%] top-[5%] hidden lg:block"
            >
              <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200 dark:bg-gray-950 dark:border-gray-800">
                <FaRss className="text-orange-500 h-4 w-4" />
              </div>
              <span className="absolute top-full right-5 h-20 w-px bg-gradient-to-b from-gray-500 to-transparent" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute right-[5%] top-[25%] hidden lg:block"
            >
              <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200 dark:bg-gray-950 dark:border-gray-800">
                <FaTimes className="text-red-500 h-4 w-4" />
              </div>
              <span className="absolute top-full right-5 h-20 w-px bg-gradient-to-b from-gray-500 to-transparent" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute left-[10%] bottom-[15%] hidden lg:block"
            >
              <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200 dark:bg-gray-950 dark:border-gray-800">
                <FaYoutube className="text-red-500 h-4 w-4" />
              </div>
              <span className="absolute bottom-full right-5 h-20 w-px bg-gradient-to-b from-transparent to-gray-500" />
            </motion.div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="flex flex-col items-center space-y-2 border-gray-200 p-4 rounded-lg dark:border-gray-800">
            <div className="p-2 bg-gray-100 rounded-full dark:bg-gray-800">
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
                className="h-6 w-6"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              {t("home.features.onboarding.title")}
            </h3>
            <p className="text-gray-500 text-center dark:text-gray-400">
              {t("home.features.onboarding.description")}
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border-gray-200 p-4 rounded-lg dark:border-gray-800">
            <div className="p-2 bg-gray-100 rounded-full dark:bg-gray-800">
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
                className="h-6 w-6"
              >
                <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              {t("home.features.analytics.title")}
            </h3>
            <p className="text-gray-500 text-center dark:text-gray-400">
              {t("home.features.analytics.description")}
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border-gray-200 p-4 rounded-lg dark:border-gray-800">
            <div className="p-2 bg-gray-100 rounded-full dark:bg-gray-800">
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
                className="h-6 w-6"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              {t("home.features.customization.title")}
            </h3>
            <p className="text-gray-500 text-center dark:text-gray-400">
              {t("home.features.customization.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

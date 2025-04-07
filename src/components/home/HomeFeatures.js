"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckCircle,
  Rss,
  Youtube,
  Star,
  Clock,
  Layout,
  Filter,
  Globe,
  Moon,
  Search,
  Share2,
  Zap,
  Smartphone,
} from "lucide-react";
import Image from "next/image";

export function HomeFeatures() {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Layout className="h-6 w-6 text-blue-500" />,
      title: t("home.features.cards.layout.title"),
      description: t("home.features.cards.layout.description"),
      color: "blue",
    },
    {
      icon: <Filter className="h-6 w-6 text-indigo-500" />,
      title: t("home.features.cards.filter.title"),
      description: t("home.features.cards.filter.description"),
      color: "indigo",
    },
    {
      icon: <Rss className="h-6 w-6 text-orange-500" />,
      title: t("home.features.cards.rss.title"),
      description: t("home.features.cards.rss.description"),
      color: "orange",
    },
    {
      icon: <Youtube className="h-6 w-6 text-red-500" />,
      title: t("home.features.cards.youtube.title"),
      description: t("home.features.cards.youtube.description"),
      color: "red",
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      title: t("home.features.cards.favorites.title"),
      description: t("home.features.cards.favorites.description"),
      color: "yellow",
    },
    {
      icon: <Clock className="h-6 w-6 text-purple-500" />,
      title: t("home.features.cards.readLater.title"),
      description: t("home.features.cards.readLater.description"),
      color: "purple",
    },
    {
      icon: <Globe className="h-6 w-6 text-green-500" />,
      title: t("home.features.cards.languages.title"),
      description: t("home.features.cards.languages.description"),
      color: "green",
    },
    {
      icon: <Moon className="h-6 w-6 text-slate-500" />,
      title: t("home.features.cards.darkMode.title"),
      description: t("home.features.cards.darkMode.description"),
      color: "slate",
    },
    {
      icon: <Search className="h-6 w-6 text-cyan-500" />,
      title: t("home.features.cards.search.title"),
      description: t("home.features.cards.search.description"),
      color: "cyan",
    },
  ];

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 50 },
    },
  };

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Arka plan desenleri */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4 mr-2" />
            {t("home.features.title")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("home.features.subtitle")}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("home.features.description")}
          </p>
        </motion.div>

        {/* Özellik kartları */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative overflow-hidden rounded-xl bg-card p-6 shadow-md hover:shadow-lg transition-shadow border border-${feature.color}-500/10`}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div
                className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-${feature.color}-500/5 -mr-10 -mt-10 blur-2xl`}
              />

              <div
                className={`inline-flex items-center justify-center p-2 rounded-lg bg-${feature.color}-500/10 mb-4`}
              >
                {feature.icon}
              </div>

              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Performans özellikler bölümü */}
        <motion.div
          className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Sol taraf - Performans bilgileri */}
          <div className="space-y-8">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4 mr-2" />
              {t("home.performanceTitle")}
            </div>

            <h3 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t("home.performanceSubtitle")}
              </span>
            </h3>

            <p className="text-lg text-muted-foreground">
              {t("home.performanceDescription")}
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-base font-medium">
                    {t("home.performanceFeature1")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("home.performanceFeature1Description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-base font-medium">
                    {t("home.performanceFeature2")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("home.performanceFeature2Description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-base font-medium">
                    {t("home.performanceFeature3")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("home.performanceFeature3Description")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ taraf - Görsel */}
          <div className="relative">
            <div className="relative z-10 rounded-xl overflow-hidden shadow-xl border border-primary/10">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                <Smartphone className="h-40 w-40 text-primary/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="h-12 w-12 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center text-primary"
                    animate={{
                      y: [0, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 3,
                    }}
                  >
                    <Zap className="h-6 w-6" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Dekoratif elementler */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />

            {/* Performans metrikleri */}
            <motion.div
              className="absolute -top-4 -left-4 p-3 rounded-lg bg-card shadow-lg border border-primary/10 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">1.2s FCP</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -right-4 p-3 rounded-lg bg-card shadow-lg border border-primary/10 backdrop-blur-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">PWA Ready</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

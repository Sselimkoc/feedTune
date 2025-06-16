"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaRss } from "react-icons/fa";
import { Sparkles, Globe, Zap } from "lucide-react";

export function HomeFeatures() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("home.features.rss.title"),
      description: t("home.features.rss.description"),
      icon: <FaRss className="w-8 h-8 text-orange-500" />,
    },
    {
      title: t("home.features.realtime.title"),
      description: t("home.features.realtime.description"),
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
    },
    {
      title: t("home.features.interface.title"),
      description: t("home.features.interface.description"),
      icon: <Sparkles className="w-8 h-8 text-blue-500" />,
    },
    {
      title: t("home.features.platform.title"),
      description: t("home.features.platform.description"),
      icon: <Globe className="w-8 h-8 text-green-500" />,
    },
  ];

  return (
    <section className="py-12" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {t("home.features.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("home.features.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-lg bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

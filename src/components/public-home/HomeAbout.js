"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BookOpen,
  RefreshCw,
  Share2,
  Smartphone,
  Moon,
  Palette,
  Globe2,
  Shield,
} from "lucide-react";

export function HomeAbout() {
  const { t } = useTranslation();

  const details = [
    {
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      title: t("home.about.reading.title"),
      description: t("home.about.reading.description"),
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-green-500" />,
      title: t("home.about.sync.title"),
      description: t("home.about.sync.description"),
    },
    {
      icon: <Share2 className="w-6 h-6 text-blue-500" />,
      title: t("home.about.share.title"),
      description: t("home.about.share.description"),
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-500" />,
      title: t("home.about.responsive.title"),
      description: t("home.about.responsive.description"),
    },
    {
      icon: <Moon className="w-6 h-6 text-yellow-500" />,
      title: t("home.about.theme.title"),
      description: t("home.about.theme.description"),
    },
    {
      icon: <Palette className="w-6 h-6 text-pink-500" />,
      title: t("home.about.ui.title"),
      description: t("home.about.ui.description"),
    },
    {
      icon: <Globe2 className="w-6 h-6 text-indigo-500" />,
      title: t("home.about.language.title"),
      description: t("home.about.language.description"),
    },
    {
      icon: <Shield className="w-6 h-6 text-red-500" />,
      title: t("home.about.security.title"),
      description: t("home.about.security.description"),
    },
  ];

  return (
    <section className="py-16 bg-muted/30" id="about">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">{t("home.about.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.about.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {details.map((detail, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="bg-muted/50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                {detail.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{detail.title}</h3>
              <p className="text-muted-foreground text-sm">
                {detail.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

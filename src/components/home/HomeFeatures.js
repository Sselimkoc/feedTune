"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Rss, Youtube, Bell, CheckCircle, Keyboard, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function HomeFeatures() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Rss,
      title: t("home.features.rssFeeds.title"),
      description: t("home.features.rssFeeds.desc"),
    },
    {
      icon: Youtube,
      title: t("home.features.youtube.title"),
      description: t("home.features.youtube.desc"),
    },
    {
      icon: Bell,
      title: t("home.features.autoUpdates.title"),
      description: t("home.features.autoUpdates.desc"),
    },
    {
      icon: CheckCircle,
      title: t("home.features.organization.title"),
      description: t("home.features.organization.desc"),
    },
    {
      icon: Keyboard,
      title: t("home.features.keyboard.title"),
      description: t("home.features.keyboard.desc"),
    },
    {
      icon: Moon,
      title: t("home.features.darkMode.title"),
      description: t("home.features.darkMode.desc"),
    },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-5px]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

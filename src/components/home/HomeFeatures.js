"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Rss, Youtube, Bell, CheckCircle, Keyboard, Moon } from "lucide-react";

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
    <section className="py-12 lg:py-16">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("home.features.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

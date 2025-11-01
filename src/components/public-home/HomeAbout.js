"use client";

import { useTranslation } from "react-i18next";
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
import { SectionHeader, FeatureCard } from "./shared";

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
        <SectionHeader
          title={t("home.about.title")}
          subtitle={t("home.about.subtitle")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {details.map((detail, index) => (
            <FeatureCard
              key={index}
              icon={detail.icon}
              title={detail.title}
              description={detail.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

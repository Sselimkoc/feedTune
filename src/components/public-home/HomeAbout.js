"use client";

import { useTranslation } from "react-i18next";
import { BookOpen, RefreshCw, Smartphone, Shield } from "lucide-react";
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
      icon: <RefreshCw className="w-6 h-6 text-primary" />,
      title: t("home.about.sync.title"),
      description: t("home.about.sync.description"),
    },
    {
      icon: <Smartphone className="w-6 h-6 text-primary" />,
      title: t("home.about.responsive.title"),
      description: t("home.about.responsive.description"),
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: t("home.about.security.title"),
      description: t("home.about.security.description"),
    },
  ];

  return (
    <section id="about" className="relative py-16 md:py-24 overflow-hidden">
      {/* subtle background tint that fades in and out */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.04] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          title={t("home.about.title")}
          subtitle={t("home.about.subtitle")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

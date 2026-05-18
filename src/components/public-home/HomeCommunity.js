"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/core/ui/button";
import { UsersIcon, RssIcon, StarIcon, Quote, ArrowRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
});

export function HomeCommunity({ onAuthClick }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const testimonials = [
    {
      id: 1,
      name: "Musab",
      role: t("home.community.roles.developer"),
      content: t("home.community.testimonials.alex"),
      rating: 5,
      initials: "MU",
    },
    {
      id: 2,
      name: "Ömer Faruk",
      role: t("home.community.roles.contentCreator"),
      content: t("home.community.testimonials.sarah"),
      rating: 5,
      initials: "ÖF",
    },
    {
      id: 3,
      name: "Mert",
      role: t("home.community.roles.journalist"),
      content: t("home.community.testimonials.david"),
      rating: 5,
      initials: "ME",
    },
  ];

  const stats = [
    {
      icon: <UsersIcon className="w-5 h-5" />,
      value: "250+",
      label: t("home.community.stats.users"),
    },
    {
      icon: <RssIcon className="w-5 h-5" />,
      value: "1,200+",
      label: t("home.community.stats.feeds"),
    },
    {
      icon: <StarIcon className="w-5 h-5" />,
      value: "4.8/5",
      label: t("home.community.stats.rating"),
    },
  ];

  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div className="text-center mb-16 md:mb-20" {...fadeUp(0)}>
          <div className="w-10 h-1 bg-gradient-to-r from-primary/80 to-primary/40 rounded-full mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            {t("home.community.title")}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            {t("home.community.subtitle")}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-16 md:mb-24 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div key={i} className="text-center" {...fadeUp(i * 0.1)}>
              <div className="text-3xl md:text-5xl font-bold mb-1 text-primary tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        {!isMobile && (
          <div className="grid grid-cols-3 gap-5 mb-16 md:mb-24">
            {testimonials.map((t_, i) => (
              <motion.div
                key={t_.id}
                className="relative rounded-2xl border border-border bg-card/60 p-6 flex flex-col gap-4 backdrop-blur-sm"
                {...fadeUp(i * 0.12)}
              >
                <Quote className="w-7 h-7 text-muted-foreground/20 absolute top-5 right-5" />
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed flex-grow pr-6">
                  "{t_.content}"
                </p>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(t_.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t_.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-none mb-0.5">{t_.name}</div>
                    <div className="text-xs text-muted-foreground">{t_.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Join CTA */}
        <motion.div className="text-center" {...fadeUp(0.2)}>
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            {t("home.community.join.title")}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-6">
            {t("home.community.join.subtitle")}
          </p>
          <Button
            size={isMobile ? "default" : "lg"}
            className="rounded-full shadow-md hover:shadow-lg transition-all duration-300 px-8 gap-2"
            onClick={onAuthClick}
          >
            {t("home.community.join.cta")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, Smartphone, Shield } from "lucide-react";
import { SectionHeader } from "./shared";

const features = [
  { icon: BookOpen,  key: "reading"    },
  { icon: RefreshCw, key: "sync"       },
  { icon: Smartphone,key: "responsive" },
  { icon: Shield,    key: "security"   },
];

export function HomeAbout() {
  const { t } = useTranslation();

  return (
    <section id="about" className="relative py-16 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.08] dark:via-primary/[0.04] to-transparent pointer-events-none" />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          title={t("home.about.title")}
          subtitle={t("home.about.subtitle")}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map(({ icon: Icon, key }, index) => (
            <motion.div
              key={key}
              className="group"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.22 } }}
            >
              <div className="relative h-full rounded-2xl bg-primary/[0.05] dark:bg-primary/[0.04] border border-primary/15 dark:border-primary/10 p-5 md:p-6 flex flex-col gap-4 transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/15 group-hover:border-primary/30 dark:group-hover:border-primary/25 group-hover:bg-primary/[0.09] dark:group-hover:bg-primary/[0.07] overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon */}
                <div className="relative w-fit">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 scale-150 transition-opacity duration-300" />
                  <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 z-10">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm md:text-base font-semibold group-hover:text-primary transition-colors duration-200">
                    {t(`home.about.${key}.title`)}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {t(`home.about.${key}.description`)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { PlusCircle, RefreshCw, Bookmark } from "lucide-react";

const steps = [
  { icon: PlusCircle, key: "step1", color: "from-primary/80 to-primary" },
  { icon: RefreshCw,  key: "step2", color: "from-primary to-primary/90" },
  { icon: Bookmark,  key: "step3", color: "from-primary/90 to-primary/70" },
];

export function HomeHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-10 h-1 bg-gradient-to-r from-primary/80 to-primary/40 rounded-full mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            {t("home.howItWorks.title")}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            {t("home.howItWorks.subtitle")}
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map(({ icon: Icon, key, color }, i) => (
            <motion.div
              key={key}
              className="relative flex flex-col items-center text-center gap-4"
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg relative z-10`}>
                <Icon className="w-9 h-9 text-white" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-border text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {t(`home.howItWorks.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {t(`home.howItWorks.${key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

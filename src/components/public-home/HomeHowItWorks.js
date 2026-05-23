"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { PlusCircle, RefreshCw, Bookmark } from "lucide-react";

const steps = [
  { icon: PlusCircle, key: "step1" },
  { icon: RefreshCw,  key: "step2" },
  { icon: Bookmark,  key: "step3" },
];

export function HomeHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="py-14 md:py-28 relative overflow-hidden">

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-10 md:mb-20"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-10 h-1 bg-gradient-to-r from-primary to-primary/40 rounded-full mx-auto mb-4" />
          <h2 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
            {t("home.howItWorks.title")}
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto">
            {t("home.howItWorks.subtitle")}
          </p>
        </motion.div>

        {/* ── MOBILE ── */}
        <div className="md:hidden relative max-w-sm mx-auto flex flex-col gap-0">
          {steps.map(({ icon: Icon, key }, i) => (
            <div key={key} className="relative flex items-stretch">
              <div className="flex flex-col items-center mr-4 pt-1">
                <motion.div
                  className="relative flex-shrink-0 w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 z-10"
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border-2 border-border text-[10px] font-bold flex items-center justify-center leading-none">
                    {i + 1}
                  </span>
                </motion.div>
                {i < steps.length - 1 && (
                  <motion.div
                    className="w-px flex-1 mt-1 min-h-[32px] bg-gradient-to-b from-primary/50 to-primary/10"
                    initial={{ scaleY: 0, originY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.5, delay: i * 0.12 + 0.2 }}
                  />
                )}
              </div>
              <motion.div
                className="pb-8 pt-1 flex-1"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.12 + 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-base font-semibold mb-1 leading-snug">
                  {t(`home.howItWorks.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`home.howItWorks.${key}.description`)}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP ── */}
        <div className="hidden md:block relative max-w-5xl mx-auto">

          <div className="grid grid-cols-3 gap-8 items-stretch">
            {steps.map(({ icon: Icon, key }, i) => (
              <motion.div
                key={key}
                className="group relative flex flex-col"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative h-full w-full rounded-2xl bg-primary/[0.05] dark:bg-primary/[0.04] border border-primary/15 dark:border-primary/10 p-8 flex flex-col items-center text-center gap-5 backdrop-blur-sm shadow-sm group-hover:shadow-lg group-hover:shadow-primary/15 group-hover:border-primary/30 dark:group-hover:border-primary/25 group-hover:bg-primary/[0.09] dark:group-hover:bg-primary/[0.07] transition-all duration-300">
                  {/* Top accent */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/25 rounded-2xl blur-xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-[72px] h-[72px] rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 z-10">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-background border-2 border-border text-xs font-bold flex items-center justify-center z-20 shadow-sm">
                      {i + 1}
                    </div>
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-200">
                      {t(`home.howItWorks.${key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
                      {t(`home.howItWorks.${key}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

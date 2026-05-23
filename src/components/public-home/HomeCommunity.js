"use client";

import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/core/ui/button";
import { UsersIcon, RssIcon, StarIcon, Quote, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useState, useEffect, useCallback } from "react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
});

function TestimonialCard({ testimonial }) {
  return (
    <div className="relative rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm p-5 flex flex-col gap-3 shadow-lg shadow-primary/5 h-full">
      {/* top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <Quote className="w-6 h-6 text-primary/20 absolute top-4 right-4" />
      <p className="text-sm text-muted-foreground leading-relaxed pr-6 flex-1">
        "{testimonial.content}"
      </p>
      <div className="flex gap-0.5">
        {[...Array(testimonial.rating)].map((_, j) => (
          <StarIcon key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
        ))}
      </div>
      <div className="flex items-center gap-2.5 pt-2 border-t border-border/60">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {testimonial.initials}
        </div>
        <div>
          <div className="text-sm font-semibold leading-none mb-0.5">{testimonial.name}</div>
          <div className="text-xs text-muted-foreground">{testimonial.role}</div>
        </div>
      </div>
    </div>
  );
}

export function HomeCommunity({ onAuthClick }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = ileri, -1 = geri

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
    { icon: <UsersIcon className="w-4 h-4" />, value: "250+",   label: t("home.community.stats.users") },
    { icon: <RssIcon   className="w-4 h-4" />, value: "1,200+", label: t("home.community.stats.feeds") },
    { icon: <StarIcon  className="w-4 h-4" />, value: "4.8/5",  label: t("home.community.stats.rating") },
  ];

  const goTo = useCallback((index) => {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  }, [active]);

  const next = useCallback(() => {
    setDirection(1);
    setActive((p) => (p + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setActive((p) => (p - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Otomatik geçiş (mobilde)
  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [isMobile, next]);

  const variants = {
    enter: (dir) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div className="text-center mb-12 md:mb-20" {...fadeUp(0)}>
          <div className="w-10 h-1 bg-gradient-to-r from-primary/80 to-primary/40 rounded-full mx-auto mb-4" />
          <h2 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
            {t("home.community.title")}
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto">
            {t("home.community.subtitle")}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12 md:mb-20 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="group flex flex-col items-center gap-1.5 p-3 md:p-6 rounded-2xl bg-card/40 md:bg-card/60 border border-border/40 md:border-border/60 md:backdrop-blur-sm md:hover:border-primary/30 md:hover:shadow-lg md:hover:shadow-primary/5 transition-all duration-300"
              {...fadeUp(i * 0.1)}
            >
              <div className="hidden md:flex w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary mb-1 group-hover:bg-primary/15 transition-colors duration-200">
                {stat.icon}
              </div>
              <div className="text-2xl md:text-4xl font-bold text-primary tabular-nums leading-none">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest text-center leading-snug">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        {!isMobile ? (
          /* Desktop: 3 kart yan yana */
          <div className="grid grid-cols-3 gap-5 mb-16 md:mb-24">
            {testimonials.map((testimonial, i) => (
              <motion.div key={testimonial.id} {...fadeUp(i * 0.12)}>
                <div className="relative rounded-2xl border border-border bg-card/60 p-6 flex flex-col gap-4 backdrop-blur-sm h-full">
                  <Quote className="w-7 h-7 text-muted-foreground/20 absolute top-5 right-5" />
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed flex-grow pr-6">
                    "{testimonial.content}"
                  </p>
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <StarIcon key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-none mb-0.5">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Mobile: sırayla geçen slider */
          <motion.div className="mb-10" {...fadeUp(0.1)}>
            {/* Kart alanı */}
            <div className="relative max-w-sm mx-auto overflow-hidden" style={{ minHeight: 200 }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={active}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TestimonialCard testimonial={testimonials[active]} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Kontroller */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === active
                        ? "w-5 h-1.5 bg-primary"
                        : "w-1.5 h-1.5 bg-border hover:bg-primary/40"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
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
            className="rounded-full shadow-md hover:shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 px-8 gap-2"
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

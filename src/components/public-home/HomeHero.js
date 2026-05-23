"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/core/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import Image from "next/image";
import { AnimatedParticle } from "./shared";
import { generateParticles } from "./utils/particleUtils";

export default function HomeHero({ onAuthClick }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const particles = generateParticles();

  const MobileView = () => (
    <section className="relative flex justify-center items-center w-full min-h-[88vh] overflow-hidden">
      {/* Merkez glow — grid ile çakışmasın */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/25 dark:bg-primary/12 blur-3xl opacity-70" />
      </div>

      {/* Faint background logo */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        <Image
          src="/images/logo.png"
          alt=""
          width={260}
          height={260}
          className="opacity-[0.06] select-none"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      <div className="w-full px-5 flex flex-col items-center gap-6 py-16">
        {/* Logo + badge */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl scale-110" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
              <Image
                src="/images/logo.png"
                alt="FeedTune Logo"
                width={38}
                height={38}
                className="w-9 h-9"
              />
            </div>
          </div>

          <motion.div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Zap className="w-3 h-3 animate-pulse" />
            {t("home.hero.newFeature")}
          </motion.div>
        </motion.div>

        {/* Title + subtitle */}
        <motion.div
          className="flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            FeedTune
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[300px]">
            {t("home.hero.subtitle")}
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-[280px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button
            className="w-full rounded-full h-11 font-semibold shadow-lg shadow-primary/20 relative overflow-hidden group"
            onClick={onAuthClick}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t("home.hero.getStarted")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80" />
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-full h-11 font-medium border-border/60 bg-background/40 backdrop-blur-sm hover:bg-accent/30 hover:border-primary/30 transition-all"
            asChild
          >
            <Link href="#about">{t("home.hero.learnMore")}</Link>
          </Button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="flex flex-col items-center gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground/50 rounded-full" />
        </motion.div>
      </div>
    </section>
  );

  const DesktopView = () => (
    <section className="min-h-[90vh] flex flex-col justify-center py-16 lg:py-24 overflow-hidden relative">
      {/* Glow — sadece merkez vurgusu, grid ile çakışmasın */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-40 -z-10">
        {particles.map((particle) => (
          <AnimatedParticle key={particle.id} particle={particle} />
        ))}
      </div>

      <div className="container px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center justify-center text-center gap-7">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium shadow-sm"
          >
            <Zap className="h-3.5 w-3.5 animate-pulse" />
            {t("home.hero.newFeature")}
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-400 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          >
            FeedTune
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="max-w-[560px] text-lg md:text-xl text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
          >
            {t("home.hero.subtitle")}
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex flex-row gap-3 items-center pt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 }}
          >
            <Button
              size="lg"
              onClick={onAuthClick}
              className="relative group overflow-hidden rounded-full px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center font-semibold gap-2">
                {t("home.hero.getStarted")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="rounded-full px-8 border-border/60 dark:bg-transparent hover:bg-accent/30 hover:border-primary/30 transition-all duration-300"
            >
              <Link href="#about">{t("home.hero.learnMore")}</Link>
            </Button>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2.5 mt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {(["badges.rss", "badges.youtube", "badges.darkMode", "badges.free", "badges.multiLang"]).map((key) => (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-primary/20 bg-primary/[0.08] text-primary/80"
              >
                {t(`home.hero.${key}`)}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );

  return isMobile ? <MobileView /> : <DesktopView />;
}

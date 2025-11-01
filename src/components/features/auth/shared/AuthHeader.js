"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export function AuthHeader({ particles }) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="relative flex flex-col items-center mb-8 sm:mb-10 mt-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow effect background */}
      <div className="absolute -inset-8 bg-gradient-to-b from-primary/10 via-transparent to-transparent rounded-full blur-2xl -z-10 opacity-50" />

      {/* Logo container */}
      <motion.div
        className="relative mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        {/* Logo glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-lg"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Logo background */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center relative z-10 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm p-2">
          <Image
            src="/images/feedtunelogo.png"
            alt="FeedTune Logo"
            layout="fill"
            objectFit="contain"
            className="text-primary-foreground"
          />
          <div className="absolute inset-0 opacity-60">{particles}</div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-2xl sm:text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        FeedTune
      </motion.h1>

      {/* Tagline */}
      <motion.div
        className="text-xs sm:text-sm text-muted-foreground mt-2 flex items-center gap-1.5 text-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Sparkles className="h-3 w-3 text-primary/60" />
        <span>{t("navigation.tagline")}</span>
        <Sparkles className="h-3 w-3 text-primary/60" />
      </motion.div>
    </motion.div>
  );
}

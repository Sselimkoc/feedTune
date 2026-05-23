"use client";

import { motion } from "framer-motion";

export function AnimatedGrid() {
  return (
    <div className="fixed inset-0 -z-[5] overflow-hidden pointer-events-none select-none">

      {/* ── İnce çizgi grid — açık temada daha belirgin ── */}
      <div
        className="absolute inset-0 opacity-80 dark:opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.09) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.09) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }}
      />

      {/* ── Büyük yavaş spotlight ── */}
      <motion.div
        className="absolute rounded-full opacity-70 dark:opacity-50"
        style={{
          width: 1000,
          height: 1000,
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.14) 0%, transparent 65%)",
          top: "50%",
          left: "50%",
          marginTop: -500,
          marginLeft: -500,
        }}
        animate={{
          x: [-160, 140, 40, -160],
          y: [-80,  80, -130, -80],
        }}
        transition={{
          duration: 50,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        }}
      />

      {/* ── Kenar vignette ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 75% 65% at 50% 50%,
            transparent 20%,
            hsl(var(--background) / 0.55) 65%,
            hsl(var(--background) / 0.95) 100%
          )`,
        }}
      />

      {/* Üst fade */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/80 to-transparent" />
      {/* Alt fade */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />
      {/* Sol fade */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      {/* Sağ fade */}
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

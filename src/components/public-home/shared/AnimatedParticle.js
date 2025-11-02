"use client";

import { motion } from "framer-motion";

export function AnimatedParticle({ particle }) {
  return (
    <motion.div
      key={particle.id}
      className={`absolute rounded-full ${particle.colorClass} ${particle.sizeClass}`}
      initial={{
        opacity: 0,
        x: 0,
        y: 0,
        scale: 0,
      }}
      animate={{
        opacity: [0, 0.7, 0],
        x: (particle.isEven ? -1 : 1) * (100 + particle.index * 20),
        y: (particle.isEven ? -1 : 1) * (10 + particle.index * 4),
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration: 2,
        delay: particle.index * 0.1,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: particle.index * 0.1,
      }}
    />
  );
}

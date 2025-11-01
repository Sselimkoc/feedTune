"use client";

import { motion } from "framer-motion";

export function generateAuthParticles() {
  return Array.from({ length: 12 }).map((_, i) => {
    const sizeClasses = ["w-2 h-2", "w-3 h-3", "w-4 h-4"];
    const sizeIndex = i % 3;
    const colorClass = i % 2 === 0 ? "bg-blue-500/30" : "bg-primary/20";

    return (
      <motion.div
        key={i}
        className={`absolute rounded-full ${colorClass} ${sizeClasses[sizeIndex]}`}
        initial={{
          opacity: 0,
          x: (i % 2 === 0 ? -1 : 1) * (10 + i * 5),
          y: -5 - i * 2,
          scale: 0,
        }}
        animate={{
          opacity: [0, 0.5, 0],
          x: (i % 2 === 0 ? -1 : 1) * (20 + i * 10),
          y: -15 - i * 5,
          scale: [0, 1, 0.5],
        }}
        transition={{
          duration: 2,
          delay: i * 0.2,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: i * 0.1,
        }}
      />
    );
  });
}

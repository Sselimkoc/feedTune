"use client";

import { motion } from "framer-motion";

export function AnimatedSection({
  children,
  className = "",
  initialState = { opacity: 0, y: 32 },
  animateState = { opacity: 1, y: 0 },
  transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  delay = 0,
}) {
  return (
    <motion.div
      className={className}
      initial={initialState}
      whileInView={animateState}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...transition, delay }}
    >
      {children}
    </motion.div>
  );
}

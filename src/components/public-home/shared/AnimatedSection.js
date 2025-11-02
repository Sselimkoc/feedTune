"use client";

import { motion } from "framer-motion";

export function AnimatedSection({
  children,
  className = "",
  initialState = { opacity: 0, y: 20 },
  animateState = { opacity: 1, y: 0 },
  transition = { duration: 0.5 },
  delay = 0,
}) {
  return (
    <motion.div
      className={className}
      initial={initialState}
      whileInView={animateState}
      viewport={{ once: true }}
      transition={{ ...transition, delay }}
    >
      {children}
    </motion.div>
  );
}

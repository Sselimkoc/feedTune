"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

export function FeatureCard({ icon, title, description, index }) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
        className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-shadow duration-300 h-full p-6 flex flex-col"
      >
        <div className="bg-primary/8 rounded-xl w-12 h-12 flex items-center justify-center mb-4 flex-shrink-0 ring-1 ring-primary/10">
          {icon}
        </div>
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm flex-grow leading-relaxed">{description}</p>
      </motion.div>
    </AnimatedSection>
  );
}

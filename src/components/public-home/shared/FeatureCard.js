"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

export function FeatureCard({ icon, title, description, index }) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <motion.div
        whileHover={{ y: -5, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        className="group relative bg-primary/[0.04] border border-primary/10 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/25 hover:bg-primary/[0.07] transition-all duration-300 h-full p-6 flex flex-col overflow-hidden"
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Icon */}
        <div className="relative mb-4 flex-shrink-0 w-fit">
          <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 scale-150 transition-opacity duration-300" />
          <div className="relative w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 z-10">
            {icon}
          </div>
        </div>

        <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors duration-200">{title}</h3>
        <p className="text-muted-foreground text-sm flex-grow leading-relaxed">{description}</p>
      </motion.div>
    </AnimatedSection>
  );
}

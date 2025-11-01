"use client";

import { AnimatedSection } from "./AnimatedSection";

export function StatCard({ icon, value, label, index }) {
  return (
    <AnimatedSection
      className="text-center p-4 md:p-6 rounded-lg bg-card/50 backdrop-blur-sm h-full flex flex-col items-center justify-center"
      delay={index * 0.1}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary mb-3 md:mb-4">
        {icon}
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{value}</h3>
      <p className="text-sm md:text-base text-muted-foreground">{label}</p>
    </AnimatedSection>
  );
}

"use client";

import { AnimatedSection } from "./AnimatedSection";

export function SectionHeader({ title, subtitle }) {
  return (
    <AnimatedSection className="text-center mb-12">
      <div className="w-10 h-1 bg-gradient-to-r from-primary/80 to-primary/40 rounded-full mx-auto mb-4" />
      <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 tracking-tight">{title}</h2>
      <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </AnimatedSection>
  );
}

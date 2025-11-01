"use client";

import { AnimatedSection } from "./AnimatedSection";

export function SectionHeader({ title, subtitle }) {
  return (
    <AnimatedSection className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {subtitle}
      </p>
    </AnimatedSection>
  );
}

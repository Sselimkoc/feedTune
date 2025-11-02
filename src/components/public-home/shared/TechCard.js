"use client";

import { Card, CardContent } from "@/components/core/ui/card";
import { AnimatedSection } from "./AnimatedSection";

export function TechCard({ icon, title, description, tech, index }) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <Card className="flex flex-col items-center bg-card/80 rounded-xl p-6 shadow-md h-full">
        <CardContent className="flex flex-col items-center text-center p-0 h-full">
          <div className="mb-3 flex-shrink-0">{icon}</div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-center mb-2 flex-grow">
            {description}
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0">{tech}</span>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

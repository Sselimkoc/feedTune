"use client";

import { Card, CardContent } from "@/components/core/ui/card";
import { AnimatedSection } from "./AnimatedSection";

export function FeatureCard({ icon, title, description, index }) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <Card className="bg-background rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="bg-muted/50 rounded-lg w-12 h-12 flex items-center justify-center mb-4 flex-shrink-0">
            {icon}
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm flex-grow">{description}</p>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

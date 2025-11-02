"use client";

import { Card, CardContent } from "@/components/core/ui/card";
import { AnimatedSection } from "./AnimatedSection";

export function FeatureShowcaseCard({ feature, index }) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <Card className="bg-card/90 rounded-xl shadow-sm">
        <CardContent className="flex items-start gap-3 p-3 md:p-6">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            {feature.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm md:text-xl mb-1">
              {feature.title}
            </h3>
            <p className="text-xs md:text-base text-muted-foreground">
              {feature.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

"use client";

import { Card, CardContent } from "@/components/core/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/core/ui/avatar";
import { StarIcon } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

export function TestimonialCard({ testimonial, index }) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <Card className="h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <Avatar>
              <AvatarImage src={testimonial.avatar} />
              <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{testimonial.name}</h4>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4 flex-grow">{testimonial.content}</p>
          <div className="flex gap-1 flex-shrink-0">
            {[...Array(testimonial.rating)].map((_, i) => (
              <StarIcon
                key={i}
                className="w-4 h-4 fill-primary text-primary"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

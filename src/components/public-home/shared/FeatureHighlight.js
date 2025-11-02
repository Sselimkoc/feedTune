"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/core/ui/button";
import { SearchIcon } from "lucide-react";

export function FeatureHighlight({ feature, learnMoreText }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto"
    >
      <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
        <h3 className="text-2xl font-bold">{feature.title}</h3>
        <p className="text-muted-foreground">{feature.description}</p>
        <Button variant="outline" size="sm">
          <SearchIcon className="w-4 h-4 mr-2" />
          {learnMoreText}
        </Button>
      </div>
      <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 shadow-xl mx-auto w-full max-w-md">
        <Image
          src={feature.image}
          alt={feature.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 0px, 600px"
          priority={false}
        />
      </div>
    </motion.div>
  );
}

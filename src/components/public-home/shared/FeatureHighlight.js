"use client";

import { motion } from "framer-motion";

export function FeatureHighlight({ feature }) {
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
      </div>
      <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/50 flex flex-col items-center justify-center gap-3 mx-auto w-full max-w-md">
        <div className="p-4 rounded-full bg-primary/10 text-primary">
          {feature.icon}
        </div>
        <span className="text-sm text-muted-foreground font-medium">{feature.title}</span>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";

export function FeedLayout({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-4 space-y-4"
    >
      {children}
    </motion.div>
  );
}

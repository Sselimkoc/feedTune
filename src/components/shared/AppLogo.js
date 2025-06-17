"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function AppLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-16 flex items-center"
    >
      <Link href="/" className="flex items-center gap-2 h-full shrink-0">
        <Image
          src="/images/feedtunelogo.png"
          alt="FeedTune Logo"
          width={24}
          height={24}
          className="w-6 h-6 text-primary"
        />
        <span className="font-bold text-xl">FeedTune</span>
      </Link>
    </motion.div>
  );
}

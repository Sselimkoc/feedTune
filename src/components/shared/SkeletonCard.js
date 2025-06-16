"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * İçerik yüklenirken gösterilen iskelet bileşeni
 * @param {Object} props - Bileşen özellikleri
 * @param {string} props.viewMode - Görünüm modu (grid veya list)
 * @param {string} props.className - Ek CSS sınıfları
 */
export function SkeletonCard({ viewMode = "grid", className }) {
  // Dalgalanma animasyonu
  const shimmer = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear",
      },
    },
  };

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "w-full p-4 overflow-hidden",
          className,
          "border-card/20 border-2"
        )}
      >
        <div className="flex gap-4">
          {/* Thumbnail placeholder */}
          <div className="relative flex-shrink-0 w-48 h-32 rounded-md bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
              initial="initial"
              animate="animate"
              variants={shimmer}
            />
          </div>

          <div className="flex-1 space-y-4">
            {/* Title placeholder */}
            <div className="h-5 w-3/4 bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                initial="initial"
                animate="animate"
                variants={shimmer}
              />
            </div>

            {/* Description placeholder */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted rounded overflow-hidden">
                <motion.div
                  className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                  initial="initial"
                  animate="animate"
                  variants={shimmer}
                />
              </div>
              <div className="h-3 w-4/5 bg-muted rounded overflow-hidden">
                <motion.div
                  className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                  initial="initial"
                  animate="animate"
                  variants={shimmer}
                />
              </div>
            </div>

            {/* Date and actions placeholder */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 w-16 bg-muted rounded overflow-hidden">
                <motion.div
                  className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                  initial="initial"
                  animate="animate"
                  variants={shimmer}
                />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full bg-muted overflow-hidden"
                  >
                    <motion.div
                      className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                      initial="initial"
                      animate="animate"
                      variants={shimmer}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view skeleton
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={cn(
          "w-full h-full overflow-hidden flex flex-col",
          className,
          "border-card/20 border-2"
        )}
      >
        {/* Image placeholder */}
        <div className="aspect-video bg-muted w-full relative overflow-hidden">
          <motion.div
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
            initial="initial"
            animate="animate"
            variants={shimmer}
          />

          {/* Badge placeholder */}
          <div className="absolute top-2 right-2 h-5 w-14 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
              initial="initial"
              animate="animate"
              variants={shimmer}
            />
          </div>

          {/* Feed type badge placeholder */}
          <div className="absolute bottom-2 left-2 h-6 w-24 rounded-lg bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
              initial="initial"
              animate="animate"
              variants={shimmer}
            />
          </div>
        </div>

        <div className="p-3 space-y-3 flex-1 flex flex-col">
          {/* Title placeholder */}
          <div className="space-y-2 flex-1">
            <div className="h-5 w-full bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                initial="initial"
                animate="animate"
                variants={shimmer}
              />
            </div>
            <div className="h-5 w-3/4 bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                initial="initial"
                animate="animate"
                variants={shimmer}
              />
            </div>
          </div>

          {/* Description placeholder */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                initial="initial"
                animate="animate"
                variants={shimmer}
              />
            </div>
            <div className="h-3 w-11/12 bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                initial="initial"
                animate="animate"
                variants={shimmer}
              />
            </div>
          </div>

          {/* Bottom info */}
          <div className="flex justify-between items-center pt-2 mt-auto">
            {/* Date placeholder */}
            <div className="h-3 w-20 bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                initial="initial"
                animate="animate"
                variants={shimmer}
              />
            </div>

            {/* Actions placeholder */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full bg-muted overflow-hidden"
                >
                  <motion.div
                    className="h-full w-full bg-gradient-to-r from-transparent via-card/10 to-transparent"
                    initial="initial"
                    animate="animate"
                    variants={shimmer}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

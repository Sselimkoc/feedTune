"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingState({ viewMode = "grid" }) {
  const { t } = useLanguage();

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.06,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.03,
        staggerDirection: -1,
        duration: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
      y: -10,
      opacity: 0,
      transition: { duration: 0.1, ease: "easeIn" },
    },
  };

  const pulseVariants = {
    initial: { scale: 0.95, opacity: 0.7 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse", 
        duration: 1.2,
        ease: "easeInOut" 
      }
    }
  };

  // Sahte içerik öğeleri (viewMode'a göre sayı ayarla)
  const skeletonItems = Array(viewMode === "grid" ? 6 : 4).fill(null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-6 w-full pt-4"
    >
      {/* Ana yükleme göstergesi */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center mb-8"
      >
        <Card className="w-full max-w-md bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-muted/30">
          <CardContent className="py-8 flex flex-col items-center text-center">
            <motion.div 
              className="relative mb-6 flex items-center justify-center"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "linear",
              }}
            >
              <motion.div
                className="absolute rounded-full h-16 w-16 border-b-2 border-r-2 border-primary/30"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute rounded-full h-12 w-12 border-t-2 border-l-2 border-primary/60"
                animate={{
                  rotate: [360, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "linear",
                }}
              />
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </motion.div>
            
            <motion.p 
              className="text-lg font-medium text-primary/80"
              variants={pulseVariants}
              initial="initial"
              animate="animate"
            >
              {t("feeds.loadingState.description")}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("feeds.loadingState.subdescritpion") || "Lütfen bekleyin..."}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Yükleme iskelet (skeleton) UI */}
      <div
        className={`grid gap-4 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {skeletonItems.map((_, index) => (
          <motion.div
            key={`skeleton-${index}`}
            variants={itemVariants}
            className="bg-card rounded-lg border border-muted/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            {/* Görsel alanı */}
            <div className="relative w-full h-48 bg-gradient-to-r from-muted/80 via-muted/30 to-muted/80 overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
              />
            </div>
            
            {/* İçerik alanı */}
            <div className="p-5 space-y-4">
              {/* Başlık */}
              <div className="space-y-2">
                <div className="h-6 bg-gradient-to-r from-muted/90 via-muted/70 to-muted/90 rounded-md w-4/5" />
                <div className="h-6 bg-gradient-to-r from-muted/90 via-muted/70 to-muted/90 rounded-md w-3/5" />
              </div>
              
              {/* Badge */}
              <div className="flex">
                <div className="h-5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-full w-16" />
              </div>
              
              {/* İçerik */}
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 rounded-md w-full" />
                <div className="h-4 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 rounded-md w-full" />
                <div className="h-4 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 rounded-md w-2/3" />
              </div>
              
              {/* Alt bilgi */}
              <div className="flex justify-between pt-3">
                <div className="h-4 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 rounded-md w-1/4" />
                <div className="h-4 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 rounded-md w-1/4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

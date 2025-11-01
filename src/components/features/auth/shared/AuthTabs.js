"use client";

import { LogIn, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/core/ui/tabs";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export function AuthTabs({ mode, onModeChange, children }) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue={mode} value={mode} onValueChange={onModeChange} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TabsList className="grid w-full h-13 grid-cols-2 mb-6 sm:mb-8 rounded-xl p-1.5 bg-muted/60 backdrop-blur-sm border border-border/30 shadow-sm">
          <TabsTrigger
            value="login"
            className="rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 py-2.5 sm:py-3 relative group data-[state=active]:shadow-md"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-data-[state=active]:scale-110" />
              <span>{t("auth.login")}</span>
            </div>
          </TabsTrigger>
          
          <TabsTrigger
            value="signup"
            className="rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 py-2.5 sm:py-3 relative group data-[state=active]:shadow-md"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-data-[state=active]:scale-110" />
              <span>{t("auth.register")}</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </motion.div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <TabsContent value="login">{children}</TabsContent>
        <TabsContent value="signup">{children}</TabsContent>
      </motion.div>
    </Tabs>
  );
}

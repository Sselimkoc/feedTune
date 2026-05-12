"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { useTranslation } from "react-i18next";

const WELCOME_MESSAGE_COUNT = 20;
const SESSION_KEY = "feedtune-welcome-msg-idx";

function getSessionMessageIndex() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored !== null) return parseInt(stored, 10);
    const idx = Math.floor(Math.random() * WELCOME_MESSAGE_COUNT) + 1;
    sessionStorage.setItem(SESSION_KEY, String(idx));
    return idx;
  } catch {
    return Math.floor(Math.random() * WELCOME_MESSAGE_COUNT) + 1;
  }
}

export function DashboardWelcome({ user, onAddFeed, onRefresh }) {
  const { t, i18n } = useTranslation();

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const userName = user?.email?.split("@")[0] ?? "User";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const dateLabel = new Date().toLocaleDateString(i18n.language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const welcomeMessage = useMemo(() => {
    const idx = getSessionMessageIndex();
    return t(`home.dashboard.welcomeMessages.msg${idx}`);
  }, [t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between gap-4 py-4 border-b border-border"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500/70 dark:text-blue-400/70 mb-1">
          {dateLabel}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {t(`home.dashboard.greeting.${greetingKey}`)},{" "}
          <span className="text-blue-600 dark:text-blue-400">{displayName}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {welcomeMessage}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0" >
        <Button
          onClick={onAddFeed}
          size="sm"
          className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/30 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t("feeds.add")}
        </Button>
        <Button
          onClick={onRefresh}
          variant="ghost"
          size="sm"
          className="h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-blue-500/10 text-xs border border-transparent hover:border-blue-200 dark:hover:border-blue-900/60"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {t("home.dashboard.syncAll")}
        </Button>
      </div>
    </motion.div>
  );
}

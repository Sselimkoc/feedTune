"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function HomeHero({ onAuthClick }) {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto text-center space-y-6 lg:space-y-8 mb-12 lg:mb-16">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
        {t("home.title")}
      </h1>
      <p className="text-lg lg:text-xl text-muted-foreground">
        {t("home.subtitle")}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" onClick={onAuthClick}>
          {t("auth.login")}
        </Button>
        <Button size="lg" variant="outline" onClick={onAuthClick}>
          {t("auth.register")}
        </Button>
      </div>
    </div>
  );
}

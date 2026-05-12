"use client";

import { Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { AnimatedPageBackground } from "@/components/shared/AnimatedPageBackground";
import { useLanguage } from "@/hooks/useLanguage";
import Link from "next/link";

export function PageLoadingState() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedPageBackground />
      <div className="container relative z-10">
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageEmptyState({ title, description, buttonText, buttonLink, onButtonClick }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedPageBackground />
      <div className="container relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {title || t("emptyState.defaultTitle")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {description || t("emptyState.defaultDescription")}
          </p>
          {buttonText && buttonLink && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90">
              <Link href={buttonLink}>{buttonText}</Link>
            </Button>
          )}
          {buttonText && onButtonClick && (
            <Button
              onClick={onButtonClick}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
            >
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageErrorState({ message }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedPageBackground />
      <div className="container relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="text-destructive text-4xl font-bold mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">{t("common.error")}</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {message || t("common.errorDescription")}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
          >
            {t("common.retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rss, Youtube, Loader2 } from "lucide-react";
import { AddRssFeed } from "@/components/Feeds/AddRssFeed";
import { AddYoutubeFeed } from "@/components/Feeds/AddYoutubeFeed";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

function handleError(error, info) {
  console.error("Feed Dialog Error:", error, info);
  const { t } = useLanguage();

  if (error.name === "NetworkError") {
    toast.error(t("errors.networkError"));
  } else if (error.name === "LoadingError") {
    toast.error(t("errors.general"));
  } else {
    toast.error(error.message || t("errors.tryAgain"));
  }
}

function AddFeedErrorBoundary({ children }) {
  const { t } = useLanguage();

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold mb-2">{t("errors.general")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || t("errors.tryAgain")}
          </p>
          <Button onClick={resetErrorBoundary}>{t("common.refresh")}</Button>
        </div>
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

export function AddFeedDialog({
  children,
  onSuccess,
  defaultPlatform = null,
  open,
  onOpenChange,
}) {
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform);
  const [keepAdding, setKeepAdding] = useState(false);
  const { t } = useLanguage();

  // FEED_PLATFORMS'ı dinamik olarak oluştur
  const FEED_PLATFORMS_LOCALIZED = useMemo(
    () => ({
      rss: {
        id: "rss",
        name: t("feeds.addFeed.rss"),
        icon: Rss,
        component: AddRssFeed,
      },
      youtube: {
        id: "youtube",
        name: t("feeds.addFeed.youtube"),
        icon: Youtube,
        component: AddYoutubeFeed,
      },
    }),
    [t]
  );

  const handleSuccess = useCallback(() => {
    if (!keepAdding) {
      onOpenChange?.(false);
    }
    onSuccess?.();
  }, [keepAdding, onSuccess, onOpenChange]);

  const handlePlatformSelect = useCallback((platform) => {
    setSelectedPlatform(platform);
  }, []);

  const ActiveComponent = useMemo(
    () =>
      selectedPlatform
        ? FEED_PLATFORMS_LOCALIZED[selectedPlatform]?.component
        : null,
    [selectedPlatform, FEED_PLATFORMS_LOCALIZED]
  );

  const handleOpenChange = useCallback(
    (open) => {
      onOpenChange?.(open);
      if (!open) {
        setSelectedPlatform(defaultPlatform);
      }
    },
    [defaultPlatform, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            {t("feeds.addFeed.title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {selectedPlatform
              ? selectedPlatform === "rss"
                ? t("feeds.addRssFeed.title")
                : t("feeds.addYoutubeFeed.title")
              : t("feeds.addFeed.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("feeds.addFeed.selectPlatform")}
          </DialogDescription>
        </DialogHeader>

        <AddFeedErrorBoundary>
          <div className="space-y-6 py-4">
            {!ActiveComponent ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(FEED_PLATFORMS_LOCALIZED).map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        className="flex flex-col items-center justify-center p-6 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => handlePlatformSelect(platform.id)}
                      >
                        <Icon className="w-10 h-10 mb-3 text-primary" />
                        <span className="font-medium">{platform.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <ActiveComponent
                  onBack={() => setSelectedPlatform(null)}
                  onSuccess={handleSuccess}
                />
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    id="keep-adding"
                    checked={keepAdding}
                    onCheckedChange={setKeepAdding}
                  />
                  <Label htmlFor="keep-adding">
                    {t("feeds.addFeed.keepAdding")}
                  </Label>
                </div>
              </>
            )}
          </div>
        </AddFeedErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}

AddFeedDialog.propTypes = {
  onSuccess: PropTypes.func,
  defaultPlatform: PropTypes.oneOf(["rss", "youtube"]),
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
};

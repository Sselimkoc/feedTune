"use client";

import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const TRANSLATIONS = {
  addNewFeed: "Feed Ekle",
  selectPlatform: "Platform Seç",
  keepAdding: "Feed eklemeye devam et",
  error: {
    title: "Bir hata oluştu",
    retry: "Tekrar dene",
    generic: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    loadingError: "Feed yüklenirken bir hata oluştu.",
    networkError: "Bağlantı hatası. İnternet bağlantınızı kontrol edin.",
  },
  rss: {
    name: "RSS Feed",
    title: "RSS Feed Ekle",
  },
  youtube: {
    name: "YouTube Kanalı",
    title: "YouTube Kanalı Ekle",
  },
};

const FEED_PLATFORMS = {
  rss: {
    id: "rss",
    name: TRANSLATIONS.rss.name,
    icon: Rss,
    component: AddRssFeed,
  },
  youtube: {
    id: "youtube",
    name: TRANSLATIONS.youtube.name,
    icon: Youtube,
    component: AddYoutubeFeed,
  },
};

function handleError(error, info) {
  console.error("Feed Dialog Error:", error, info);

  if (error.name === "NetworkError") {
    toast.error(TRANSLATIONS.error.networkError);
  } else if (error.name === "LoadingError") {
    toast.error(TRANSLATIONS.error.loadingError);
  } else {
    toast.error(error.message || TRANSLATIONS.error.generic);
  }
}

function AddFeedErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  const handleReset = useCallback(() => {
    setHasError(false);
  }, []);

  return (
    <ErrorBoundary
      fallback={
        <div className="text-center p-4 space-y-4">
          <p className="text-lg font-medium text-destructive">
            {TRANSLATIONS.error.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {TRANSLATIONS.error.generic}
          </p>
          <Button variant="outline" onClick={handleReset} className="mt-4">
            {TRANSLATIONS.error.retry}
          </Button>
        </div>
      }
      onError={(error, info) => {
        setHasError(true);
        handleError(error, info);
      }}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
}

AddFeedErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export function AddFeedDialog({ onSuccess, defaultPlatform, children }) {
  const [state, setState] = useState({
    open: false,
    selectedPlatform: defaultPlatform ? FEED_PLATFORMS[defaultPlatform] : null,
    keepAdding: false,
    isLoading: false,
  });

  const handleClose = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedPlatform: null,
      open: prev.keepAdding,
      isLoading: false,
    }));
    onSuccess?.();
  }, [onSuccess]);

  const handleOpenChange = useCallback((isOpen) => {
    if (!isOpen) {
      setState((prev) => ({
        ...prev,
        selectedPlatform: null,
        keepAdding: false,
        isLoading: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        open: true,
        isLoading: false,
      }));
    }
  }, []);

  const handlePlatformSelect = useCallback((platform) => {
    setState((prev) => ({
      ...prev,
      selectedPlatform: platform,
      isLoading: true,
    }));

    // Simüle edilmiş yükleme durumu - gerçek uygulamada kaldırılabilir
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }, 500);
  }, []);

  const SelectedComponent = useMemo(
    () => state.selectedPlatform?.component || null,
    [state.selectedPlatform]
  );

  return (
    <AddFeedErrorBoundary>
      <Dialog open={state.open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children || (
            <Button
              disabled={state.isLoading}
              aria-label={TRANSLATIONS.addNewFeed}
            >
              {state.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {TRANSLATIONS.addNewFeed}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-labelledby="dialog-title"
        >
          <DialogHeader>
            <DialogTitle id="dialog-title">
              {state.selectedPlatform
                ? state.selectedPlatform.name
                : TRANSLATIONS.selectPlatform}
            </DialogTitle>
          </DialogHeader>
          {!state.selectedPlatform ? (
            <>
              <div
                className="grid grid-cols-2 gap-4"
                role="group"
                aria-label={TRANSLATIONS.selectPlatform}
              >
                {Object.values(FEED_PLATFORMS).map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-24 flex-col gap-2 relative"
                    onClick={() => handlePlatformSelect(platform)}
                    disabled={state.isLoading}
                    aria-label={platform.name}
                  >
                    {state.isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : null}
                    <platform.icon className="h-8 w-8" />
                    {platform.name}
                  </Button>
                ))}
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="keep-adding"
                  checked={state.keepAdding}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({ ...prev, keepAdding: checked }))
                  }
                  aria-label={TRANSLATIONS.keepAdding}
                />
                <Label htmlFor="keep-adding">{TRANSLATIONS.keepAdding}</Label>
              </div>
            </>
          ) : SelectedComponent ? (
            <div>
              <SelectedComponent
                onBack={() =>
                  setState((prev) => ({
                    ...prev,
                    selectedPlatform: null,
                    isLoading: false,
                  }))
                }
                onSuccess={handleClose}
                isLoading={state.isLoading}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AddFeedErrorBoundary>
  );
}

AddFeedDialog.propTypes = {
  onSuccess: PropTypes.func,
  defaultPlatform: PropTypes.oneOf(Object.keys(FEED_PLATFORMS)),
  children: PropTypes.node,
};

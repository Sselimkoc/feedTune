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
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold mb-2">
            {TRANSLATIONS.error.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || TRANSLATIONS.error.generic}
          </p>
          <Button onClick={resetErrorBoundary}>
            {TRANSLATIONS.error.retry}
          </Button>
        </div>
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

export function AddFeedDialog({ children, onSuccess, defaultPlatform = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform);
  const [keepAdding, setKeepAdding] = useState(false);

  const handleSuccess = useCallback(() => {
    if (!keepAdding) {
      setIsOpen(false);
    }
    onSuccess?.();
  }, [keepAdding, onSuccess]);

  const handlePlatformSelect = useCallback((platform) => {
    setSelectedPlatform(platform);
  }, []);

  const ActiveComponent = useMemo(
    () =>
      selectedPlatform ? FEED_PLATFORMS[selectedPlatform]?.component : null,
    [selectedPlatform]
  );

  const handleOpenChange = useCallback(
    (open) => {
      setIsOpen(open);
      if (!open) {
        setSelectedPlatform(defaultPlatform);
      }
    },
    [defaultPlatform]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            {TRANSLATIONS.addNewFeed}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {selectedPlatform
              ? FEED_PLATFORMS[selectedPlatform].name + " Ekle"
              : TRANSLATIONS.addNewFeed}
          </DialogTitle>
          <DialogDescription className="text-center">
            İçerikleri takip etmek için bir kaynak ekleyin.
          </DialogDescription>
        </DialogHeader>

        <AddFeedErrorBoundary>
          <div className="space-y-6 py-4">
            {!ActiveComponent ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(FEED_PLATFORMS).map((platform) => {
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
                  <Label htmlFor="keep-adding">{TRANSLATIONS.keepAdding}</Label>
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
  defaultPlatform: PropTypes.oneOf(Object.keys(FEED_PLATFORMS)),
};

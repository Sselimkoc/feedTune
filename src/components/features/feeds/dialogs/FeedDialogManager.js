"use client";

import { useState, useCallback } from "react";
import { AddFeedDialog } from "./AddFeedDialog";
import { YouTubeSearchDialog } from "./YouTubeSearchDialog";
import { RssPreviewDialog } from "./RssPreviewDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Rss, Youtube, Search, ArrowRight, Plus } from "lucide-react";

/**
 * Dialog mode types
 * @typedef {'default'|'youtube'|'rss'|'add'} DialogMode
 */

/**
 * Component to manage all feed-related dialogs
 */
export function FeedDialogManager({
  isOpen = false,
  onOpenChange = () => {},
  onSuccess = () => {},
}) {
  const { t } = useLanguage();
  /** @type {[DialogMode, function]} */
  const [mode, setMode] = useState("default");

  // Reset state when dialog closes
  const handleOpenChange = useCallback(
    (open) => {
      if (!open) {
        // Small delay to prevent visual glitches during animation
        setTimeout(() => {
          setMode("default");
        }, 300);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  // Handle dialog success
  const handleSuccess = useCallback(() => {
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  }, [onSuccess]);

  // Options for the main dialog
  const options = [
    {
      id: "youtube",
      title: t("feeds.addYouTubeChannel"),
      description: t("feeds.addYouTubeChannelDescription"),
      icon: <Youtube className="h-6 w-6 text-red-500" />,
      action: () => setMode("youtube"),
    },
    {
      id: "rss",
      title: t("feeds.addRssFeed"),
      description: t("feeds.addRssFeedDescription"),
      icon: <Rss className="h-6 w-6 text-blue-500" />,
      action: () => setMode("rss"),
    },
    {
      id: "add",
      title: t("feeds.manuallyAddFeed"),
      description: t("feeds.manuallyAddFeedDescription"),
      icon: <Plus className="h-6 w-6 text-primary" />,
      action: () => setMode("add"),
    },
  ];

  return (
    <>
      {/* Main Option Dialog */}
      <Dialog
        open={isOpen && mode === "default"}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-w-xl w-full p-0 overflow-hidden bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {t("feeds.addNewFeed")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("feeds.selectAddMethod")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {options.map((option) => (
                <Card
                  key={option.id}
                  className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-sm"
                  onClick={option.action}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg bg-muted">
                        {option.icon}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Search Dialog */}
      <YouTubeSearchDialog
        isOpen={isOpen && mode === "youtube"}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />

      {/* RSS Preview Dialog */}
      <RssPreviewDialog
        isOpen={isOpen && mode === "rss"}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />

      {/* Add Feed Dialog */}
      <AddFeedDialog
        isOpen={isOpen && mode === "add"}
        onOpenChange={handleOpenChange}
        onSubmit={async (values) => {
          handleSuccess();
          return true;
        }}
      />
    </>
  );
}

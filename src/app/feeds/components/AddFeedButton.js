"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddFeedDialog } from "@/components/features/feeds/AddFeedDialog";
import { useLanguage } from "@/contexts/LanguageContext";

export function AddFeedButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [defaultPlatform, setDefaultPlatform] = useState(null);

  const handleOpenDialog = () => {
    setDefaultPlatform(null);
    setOpen(true);
  };

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <>
      <AddFeedDialog
        open={open}
        onOpenChange={setOpen}
        defaultPlatform={defaultPlatform}
        onSuccess={handleSuccess}
      />

      <Button
        onClick={handleOpenDialog}
        className="h-9 px-3 gap-1.5"
        aria-label={t("feeds.feedList.addFeed")}
      >
        <PlusCircle className="h-4 w-4" />
        <span className="text-sm">{t("feeds.feedList.addFeed")}</span>
      </Button>
    </>
  );
}

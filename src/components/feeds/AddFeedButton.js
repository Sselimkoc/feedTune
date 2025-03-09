"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddFeedDialog } from "@/components/feeds/AddFeedDialog";
import { useLanguage } from "@/contexts/LanguageContext";

export function AddFeedButton() {
  const { t } = useLanguage();

  return (
    <AddFeedDialog>
      <Button className="h-9 px-3">
        <PlusCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">{t("feeds.feedList.addFeed")}</span>
      </Button>
    </AddFeedDialog>
  );
}

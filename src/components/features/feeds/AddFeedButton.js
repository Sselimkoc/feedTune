"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rss, Youtube, ChevronDown } from "lucide-react";
import { AddFeedDialog } from "@/components/features/feeds/AddFeedDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AddFeedButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [defaultPlatform, setDefaultPlatform] = useState(null);

  const handleOpenDialog = (platform = null) => {
    setDefaultPlatform(platform);
    setOpen(true);
  };

  return (
    <>
      <AddFeedDialog
        open={open}
        onOpenChange={setOpen}
        defaultPlatform={defaultPlatform}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-9 px-3 gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span className="text-sm">{t("feeds.feedList.addFeed")}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleOpenDialog()}
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            <span>Tüm Beslemeler</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleOpenDialog("rss")}
          >
            <Rss className="h-4 w-4 text-orange-500" />
            <span>RSS Beslemesi Ekle</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleOpenDialog("youtube")}
          >
            <Youtube className="h-4 w-4 text-red-500" />
            <span>YouTube Kanalı Ekle</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

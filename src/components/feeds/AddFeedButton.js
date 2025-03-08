"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddFeedDialog } from "./AddFeedDialog";

export function AddFeedButton({
  defaultPlatform,
  variant = "default",
  size = "default",
}) {
  return (
    <AddFeedDialog
      defaultPlatform={defaultPlatform}
      onSuccess={() => {
        // Başarılı ekleme sonrası yapılacak işlemler
      }}
    >
      <Button variant={variant} size={size} className="gap-2 font-medium">
        <PlusCircle className="h-4 w-4" />
        <span>Feed Ekle</span>
      </Button>
    </AddFeedDialog>
  );
}

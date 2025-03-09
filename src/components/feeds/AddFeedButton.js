"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddFeedDialog } from "@/components/feeds/AddFeedDialog";

export function AddFeedButton() {
  return (
    <AddFeedDialog>
      <Button className="h-9 px-3">
        <PlusCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">Feed Ekle</span>
      </Button>
    </AddFeedDialog>
  );
}

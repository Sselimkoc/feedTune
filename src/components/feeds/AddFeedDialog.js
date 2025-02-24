"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rss, Youtube } from "lucide-react";
import { AddRssFeed } from "./AddRssFeed";
import { AddYoutubeFeed } from "./AddYoutubeFeed";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AddFeedDialog() {
  const [open, setOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [keepAdding, setKeepAdding] = useState(false);

  const handleClose = () => {
    setSelectedPlatform(null);
    if (!keepAdding) {
      setOpen(false);
      setKeepAdding(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedPlatform(null);
      setKeepAdding(false);
    }
  };

  const platforms = [
    {
      id: "rss",
      name: "RSS Feed",
      icon: Rss,
      component: AddRssFeed,
    },
    {
      id: "youtube",
      name: "YouTube Channel",
      icon: Youtube,
      component: AddYoutubeFeed,
    },
  ];

  const SelectedComponent = selectedPlatform
    ? platforms.find((p) => p.id === selectedPlatform.id)?.component
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Feed
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedPlatform
              ? "Add " + selectedPlatform.name
              : "Select Platform"}
          </DialogTitle>
        </DialogHeader>
        {!selectedPlatform ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <Button
                  key={platform.id}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => setSelectedPlatform(platform)}
                >
                  <platform.icon className="h-8 w-8" />
                  {platform.name}
                </Button>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="keep-adding"
                checked={keepAdding}
                onCheckedChange={setKeepAdding}
              />
              <Label htmlFor="keep-adding">Keep adding feeds</Label>
            </div>
          </>
        ) : SelectedComponent ? (
          <div>
            <SelectedComponent
              onBack={() => setSelectedPlatform(null)}
              onSuccess={handleClose}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

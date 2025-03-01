"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownAZ, ArrowUpAZ, Clock, Star, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function FilterDialog({
  isOpen,
  onOpenChange,
  filters,
  onApplyFilters,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Reset local filters when dialog opens
  const handleOpenChange = (open) => {
    if (open) {
      setLocalFilters(filters);
    }
    onOpenChange(open);
  };

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      sortBy: "newest",
      showRead: true,
      showUnread: true,
      feedTypes: {
        rss: true,
        youtube: true,
      },
    };
    setLocalFilters(defaultFilters);
    onApplyFilters(defaultFilters);
    onOpenChange(false);
  };

  const updateLocalFilters = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateFeedType = (type, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      feedTypes: {
        ...prev.feedTypes,
        [type]: value,
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrele ve Sırala</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sort" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sort">Sıralama</TabsTrigger>
            <TabsTrigger value="filter">Filtreleme</TabsTrigger>
          </TabsList>

          <TabsContent value="sort" className="space-y-4 pt-4">
            <div className="space-y-4">
              <RadioGroup
                value={localFilters.sortBy}
                onValueChange={(value) => updateLocalFilters("sortBy", value)}
              >
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="newest" id="newest" />
                  <Label htmlFor="newest" className="flex items-center">
                    <ArrowDownAZ className="mr-2 h-4 w-4" />
                    <span>En yeni</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="oldest" id="oldest" />
                  <Label htmlFor="oldest" className="flex items-center">
                    <ArrowUpAZ className="mr-2 h-4 w-4" />
                    <span>En eski</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="unread" id="unread" />
                  <Label htmlFor="unread" className="flex items-center">
                    <EyeOff className="mr-2 h-4 w-4" />
                    <span>Okunmamışlar önce</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="favorites" id="favorites" />
                  <Label htmlFor="favorites" className="flex items-center">
                    <Star className="mr-2 h-4 w-4" />
                    <span>Favoriler önce</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="filter" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Gösterilecek İçerikler</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-read"
                    checked={localFilters.showRead}
                    onCheckedChange={(checked) =>
                      updateLocalFilters("showRead", checked)
                    }
                  />
                  <Label htmlFor="show-read" className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Okunmuş içerikler</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-unread"
                    checked={localFilters.showUnread}
                    onCheckedChange={(checked) =>
                      updateLocalFilters("showUnread", checked)
                    }
                  />
                  <Label htmlFor="show-unread" className="flex items-center">
                    <EyeOff className="mr-2 h-4 w-4" />
                    <span>Okunmamış içerikler</span>
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Besleme Türleri</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-rss"
                    checked={localFilters.feedTypes.rss}
                    onCheckedChange={(checked) =>
                      updateFeedType("rss", checked)
                    }
                  />
                  <Label htmlFor="show-rss">RSS Beslemeleri</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-youtube"
                    checked={localFilters.feedTypes.youtube}
                    onCheckedChange={(checked) =>
                      updateFeedType("youtube", checked)
                    }
                  />
                  <Label htmlFor="show-youtube">YouTube Beslemeleri</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleResetFilters}>
            Sıfırla
          </Button>
          <Button onClick={handleApplyFilters}>Uygula</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { useFeedService } from "@/hooks/features/useFeedService";

export function AddFeedDialog({ isOpen, onOpenChange, onFeedAdded }) {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const feedService = useFeedService();
  const { addFeed } = useFeedActions({ user, feedService });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rssUrl: "",
    youtubeUrl: "",
  });

  const onSubmit = async (values) => {
    if (!values.rssUrl && !values.youtubeUrl) return;

    setIsSubmitting(true);
    try {
      if (values.rssUrl) {
        await addFeed(values.rssUrl, "rss");
      } else if (values.youtubeUrl) {
        await addFeed(values.youtubeUrl, "youtube");
      }

      setFormData({ rssUrl: "", youtubeUrl: "" });
      onFeedAdded?.();
      onOpenChange(false);
    } catch (error) {
      // Hata mesajı useFeedActions tarafından gösteriliyor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("feeds.addFeed.title")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rss">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rss">RSS</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>

          <TabsContent value="rss">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rssUrl">{t("feeds.addFeed.rssUrl")}</Label>
                  <Input
                    id="rssUrl"
                    type="url"
                    placeholder={t("feeds.addFeed.rssUrlPlaceholder")}
                    value={formData.rssUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, rssUrl: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !formData.rssUrl}>
                  {isSubmitting
                    ? t("common.processing")
                    : t("feeds.addFeed.submit")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="youtube">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">
                    {t("feeds.addFeed.youtubeUrl")}
                  </Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    placeholder={t("feeds.addFeed.youtubeUrlPlaceholder")}
                    value={formData.youtubeUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, youtubeUrl: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.youtubeUrl}
                >
                  {isSubmitting
                    ? t("common.processing")
                    : t("feeds.addFeed.submit")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { RssIcon, YoutubeIcon, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedManagement } from "@/hooks/features/useFeedManagement";

// Form şeması
const formSchema = z.object({
  url: z.string().url({ message: "Geçerli bir URL giriniz" }),
  type: z.enum(["rss", "youtube"]),
});

export function AddFeedDialog({ isOpen, onOpenChange, onFeedAdded }) {
  const { t } = useLanguage();
  const { addRssFeed, addYoutubeFeed, isAdding } = useFeedManagement();

  // Form oluşturma
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      type: "rss",
    },
  });

  // Form gönderme işlemi
  const onSubmit = async (values) => {
    try {
      if (values.type === "rss") {
        await addRssFeed(values.url);
      } else {
        await addYoutubeFeed(values.url);
      }

      form.reset();
      onOpenChange(false);

      // Opsiyonel callback
      if (onFeedAdded) {
        onFeedAdded();
      }
    } catch (error) {
      console.error("Feed eklenirken hata:", error);
      // Hata mesajı useFeedManagement tarafından gösteriliyor
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("feeds.addFeedTitle")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs
              defaultValue="rss"
              onValueChange={(value) => form.setValue("type", value)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rss" className="flex items-center gap-2">
                  <RssIcon className="h-4 w-4" />
                  <span>RSS</span>
                </TabsTrigger>
                <TabsTrigger
                  value="youtube"
                  className="flex items-center gap-2"
                >
                  <YoutubeIcon className="h-4 w-4" />
                  <span>YouTube</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rss" className="mt-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("feeds.feedUrl")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/rss"
                          {...field}
                          disabled={isAdding}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="youtube" className="mt-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("feeds.youtubeUrl")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/channel/..."
                          {...field}
                          disabled={isAdding}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isAdding}>
                  {t("common.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("common.add")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

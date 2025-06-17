"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Rss } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/components/ui/use-toast";
import { useFeedService } from "@/hooks/features/useFeedService";

export function FeedCard({ feed, onDelete }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { deleteFeed } = useFeedService();

  const handleDelete = async () => {
    try {
      await deleteFeed(feed.id);
      toast({
        title: t("common.success"),
        description: t("feeds.deleteSuccess"),
      });
      if (onDelete) onDelete(feed.id);
    } catch (error) {
      console.error("Error deleting feed:", error);
      toast({
        title: t("common.error"),
        description: t("feeds.deleteError"),
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rss className="h-4 w-4 text-primary" />
              <span className="truncate">{feed.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {feed.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  asChild
                >
                  <Link
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("feeds.visitWebsite")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                title={t("common.delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {feed.description || t("feeds.noDescription")}
          </p>
          {feed.category && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: feed.category.color }}
              />
              <span className="text-xs text-muted-foreground">
                {feed.category.name}
              </span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{feed.type}</span>
            <span>{new Date(feed.last_fetched).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  ExternalLink,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  MoreVertical,
  Share2,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function FeedCard({
  feed,
  isRead,
  isFavorite,
  isSaved,
  onToggleFavorite,
  onToggleSave,
  onShare,
  isLoading,
}) {
  const { t, language } = useLanguage();
  const dateLocale = language === "tr" ? tr : enUS;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold line-clamp-2">{feed.title}</h3>
            {!isRead && (
              <Badge variant="secondary" className="ml-2">
                {t("feeds.new")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {feed.summary}
          </p>
          <div className="text-xs text-muted-foreground">
            {format(new Date(feed.publishedAt), "PPp", {
              locale: dateLocale,
            })}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFavorite(feed.id)}
                      disabled={isLoading}
                      className={cn("h-8 w-8", isFavorite && "text-yellow-500")}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isFavorite
                      ? t("feeds.removeFavorite")
                      : t("feeds.addFavorite")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleSave(feed.id)}
                      disabled={isLoading}
                      className={cn("h-8 w-8", isSaved && "text-blue-500")}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isSaved
                      ? t("feeds.removeReadLater")
                      : t("feeds.addReadLater")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={buttonVariants}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onShare(feed)}
                    disabled={isLoading}
                    className="h-8 w-8"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("feeds.share")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

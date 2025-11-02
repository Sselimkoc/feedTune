import { Button } from "@/components/core/ui/button";
import { Card, CardContent } from "@/components/core/ui/card";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { getProxiedImageUrl } from "@/services/feedService";

export function FeedSearchResults({ results, onSelectResult, onBack }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1 text-xs h-8 px-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("feeds.addFeed.back")}
        </Button>
        <h3 className="text-sm font-semibold">
          {t("feeds.addFeed.searchResults")}
        </h3>
      </div>

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {results.map((result, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:bg-muted/50 transition-colors border border-border/30"
            onClick={() => onSelectResult(result)}
          >
            <CardContent className="p-2.5">
              <div className="flex items-start gap-2">
                <img
                  src={getProxiedImageUrl(result.thumbnail)}
                  alt={result.title}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs truncate">
                    {result.title}
                  </h4>
                  <p className="text-muted-foreground text-xs line-clamp-1 mt-0.5">
                    {result.description}
                  </p>
                  {result.subscribersFormatted && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {result.subscribersFormatted} {t("feeds.addFeed.subscribers")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

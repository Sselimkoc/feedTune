import { Card, CardContent } from "@/components/core/ui/card";
import { getProxiedImageUrl } from "@/services/feedService";

export function FeedPreviewCard({ previewData, type }) {
  const imageUrl = getProxiedImageUrl(
    previewData.thumbnail || previewData.icon
  );

  return (
    <Card className="border border-border/30 bg-muted/40">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <img
            src={imageUrl}
            alt={previewData.title}
            className={`w-16 h-16 object-cover flex-shrink-0 ${
              type === "rss" ? "rounded-lg" : "rounded-full"
            }`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {previewData.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {previewData.description}
            </p>
            {previewData.subscribersFormatted && (
              <div className="text-xs text-muted-foreground mt-2">
                {previewData.subscribersFormatted} subscribers
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

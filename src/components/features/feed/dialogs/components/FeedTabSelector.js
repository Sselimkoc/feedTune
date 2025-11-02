import { Youtube, Rss } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/core/ui/tabs";
import { useTranslation } from "react-i18next";

export function FeedTabSelector({ activeTab, onTabChange }) {
  const { t } = useTranslation();

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-2 w-full bg-muted/50 rounded-lg p-1 gap-1 border border-border/30 h-auto">
        <TabsTrigger
          value="youtube"
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-md transition-all font-medium text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground"
        >
          <Youtube className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">YouTube</span>
        </TabsTrigger>
        <TabsTrigger
          value="rss"
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-md transition-all font-medium text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground"
        >
          <Rss className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">RSS</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

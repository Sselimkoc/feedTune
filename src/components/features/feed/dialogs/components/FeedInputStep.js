import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/core/ui/form";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";
import { Search, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export function FeedInputStep({ form, activeTab, isLoading, error, onSearch }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  {activeTab === "youtube"
                    ? t("feeds.addFeed.youtubeChannelUrl")
                    : t("feeds.addFeed.rssUrl")}
                </FormLabel>
                <FormControl>
                  <div className="flex gap-1.5">
                    <Input
                      {...field}
                      className="h-10 text-xs bg-background border border-border/50 focus:ring-1 focus:ring-primary rounded-lg px-3"
                      placeholder={
                        activeTab === "youtube"
                          ? t("feeds.addFeed.youtubeUrlOrKeyword") ||
                            "YouTube URL or channel name..."
                          : "https://example.com/feed.xml"
                      }
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 px-4 rounded-lg font-medium text-xs"
                      onClick={onSearch}
                      disabled={!field.value || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {error && (
        <Alert
          variant="destructive"
          className="border-red-400 bg-red-900/10 py-2 px-3"
        >
          <XCircle className="h-3.5 w-3.5" />
          <AlertTitle className="text-xs">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </motion.div>
  );
}

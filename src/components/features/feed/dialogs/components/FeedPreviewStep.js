import { Button } from "@/components/core/ui/button";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FeedPreviewCard } from "./FeedPreviewCard";
import { FeedAdvancedOptions } from "./FeedAdvancedOptions";

export function FeedPreviewStep({
  previewData,
  form,
  isSubmitting,
  onBack,
  onSubmit,
  addFeedMutation,
  currentStep,
  searchResults,
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1 text-sm h-9"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("feeds.addFeed.back")}
        </Button>
        <h3 className="text-lg font-semibold">
          {t("feeds.addFeed.feedPreview")}
        </h3>
      </div>

      <FeedPreviewCard previewData={previewData} type={previewData.type} />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FeedAdvancedOptions form={form} />

        <div className="flex flex-row justify-end gap-3 pt-4 border-t border-border/20">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={addFeedMutation?.isPending}
            className="px-6 py-2 text-sm rounded-lg font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={addFeedMutation?.isPending}
            className="px-6 py-2 text-sm rounded-lg font-medium"
          >
            {addFeedMutation?.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t("feeds.addFeed.add")}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

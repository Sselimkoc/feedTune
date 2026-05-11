import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/core/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FeedPreviewCard } from "./FeedPreviewCard";
import { FeedAdvancedOptions } from "./FeedAdvancedOptions";

function AddProgressBar({ isActive }) {
  const [progress, setProgress] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive) {
      wasActive.current = true;
      setProgress(0);

      const steps = [[300, 25], [600, 50], [500, 65], [800, 78], [1200, 88]];
      const timeouts = [];
      let elapsed = 0;
      steps.forEach(([delay, target]) => {
        elapsed += delay;
        timeouts.push(setTimeout(() => setProgress(target), elapsed));
      });
      return () => timeouts.forEach(clearTimeout);
    } else if (wasActive.current) {
      wasActive.current = false;
      setProgress(100);
      const t = setTimeout(() => setProgress(0), 700);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  if (progress === 0) return null;

  return (
    <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

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

        <div className="space-y-3 pt-4 border-t border-border/20">
          <AddProgressBar isActive={!!addFeedMutation?.isPending} />
          <div className="flex flex-row justify-end gap-3">
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
              <Plus className="mr-2 h-4 w-4" />
              {addFeedMutation?.isPending ? t("feeds.addFeed.adding") : t("feeds.addFeed.add")}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

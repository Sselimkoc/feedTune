"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/core/ui/dialog";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Hooks
import {
  useAddFeedForm,
  useFeedSteps,
  useYoutubeSearch,
  useRssPreview,
} from "@/hooks/features/useAddFeed";

// Components
import {
  FeedTabSelector,
  FeedInputStep,
  FeedSearchResults,
  FeedPreviewStep,
} from "./components";

// Constants
import { DIALOG_STEPS, FEED_TYPES } from "./constants";

// Service
import { mapCategoryToUUID } from "@/services/feedService";

/**
 * Refactored AddFeedDialog Component
 *
 * Modern, modüler ve scalable yapı:
 * - Business logic hooks'larda
 * - UI componentlerde
 * - Service layer'da API çağrıları
 */
export function AddFeedDialog({
  isOpen = false,
  onOpenChange = () => {},
  onSubmit = null,
  addFeedMutation = null,
  isLoading = false,
}) {
  const { t } = useTranslation();

  // Hooks
  const form = useAddFeedForm();
  const feedSteps = useFeedSteps();
  const youtubeSearch = useYoutubeSearch();
  const rssPreview = useRssPreview();

  const [activeTab, setActiveTab] = useState(FEED_TYPES.YOUTUBE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset dialog durumunu kapat
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(FEED_TYPES.YOUTUBE);
      feedSteps.reset();
      form.resetForm();
      youtubeSearch.setError("");
      rssPreview.setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Dialog'u kapat ve form'u reset et (feed eklemesinden sonra)
  useEffect(() => {
    if (isSubmitting && addFeedMutation && !addFeedMutation.isPending) {
      setIsSubmitting(false);
      form.resetForm();
      onOpenChange(false);
    }
  }, [
    addFeedMutation?.isPending,
    isSubmitting,
    form,
    onOpenChange,
    addFeedMutation,
  ]);

  // Tab değişir
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    feedSteps.reset();
    form.setFeedType(tab);
    youtubeSearch.setError("");
    rssPreview.setError("");
  }, []);

  // Preview/Search işlemi
  const handlePreviewOrSearch = async () => {
    const url = form.form.getValues("url");
    if (!url) return;

    try {
      if (activeTab === FEED_TYPES.YOUTUBE) {
        const result = await youtubeSearch.processYoutubeInput(url);

        if (result.type === "preview") {
          form.setFeedData(result.data);
          feedSteps.goToPreview(result.data);
        } else if (result.type === "search") {
          feedSteps.goToSearch(result.data);
        }
      } else if (activeTab === FEED_TYPES.RSS) {
        const result = await rssPreview.handlePreview(url);

        if (result.type === "preview") {
          form.setFeedData(result.data);
          feedSteps.goToPreview(result.data);
        }
      }
    } catch (err) {
      // Hata zaten hook'larda set edildi
      console.error("Feed işlemi hatası:", err);
    }
  };

  // Search sonuçlarından channel/feed seç
  const handleSelectSearchResult = async (result) => {
    try {
      // Seçilen kanalın full detaylarını fetch et
      const fullChannelData = await youtubeSearch.handlePreview(result.url);

      if (fullChannelData.type === "preview") {
        const previewData = fullChannelData.data;
        form.setFeedData(previewData);
        feedSteps.goToPreview(previewData);
      }
    } catch (err) {
      console.error("Failed to fetch channel details:", err);
    }
  };

  // Form submit
  const handleFormSubmit = async (values) => {
    if (!feedSteps.previewData || !addFeedMutation) return;

    const feedData = {
      url: feedSteps.previewData.url || values.url,
      type: activeTab,
      title: values.title || feedSteps.previewData.title,
      category: values.category, // Pass the category name/value, not the UUID
      fetch_full_content: values.fetch_full_content || false,
    };

    setIsSubmitting(true);
    addFeedMutation.mutate(feedData);
  };

  // Geri git
  const handleGoBack = useCallback(() => {
    // Her adımdan bir önceki adıma dön
    if (feedSteps.step === DIALOG_STEPS.PREVIEW) {
      // Preview'den geri → arama sonuçları varsa SEARCH'e, yoksa INPUT'a dön
      if (feedSteps.searchResults.length > 0) {
        feedSteps.goToSearch(feedSteps.searchResults);
      } else {
        feedSteps.goToInput();
      }
    } else if (feedSteps.step === DIALOG_STEPS.SEARCH) {
      // Arama sonuçlarından INPUT'a dön
      feedSteps.goToInput();
    }
  }, [feedSteps]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-background">
        {/* Header */}
        <div className="px-6 pt-4 pb-3 border-b border-border/30 bg-gradient-to-r from-primary/5 via-blue-500/5 to-primary/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground truncate">
                  {t("feeds.addFeed.title")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("feeds.addFeed.description")}
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(100vh-250px)] overflow-y-auto">
          {feedSteps.step === DIALOG_STEPS.INPUT && (
            <div className="space-y-5">
              <FeedTabSelector
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

              <FeedInputStep
                form={form.form}
                activeTab={activeTab}
                isLoading={youtubeSearch.isLoading || rssPreview.isLoading}
                error={
                  activeTab === FEED_TYPES.YOUTUBE
                    ? youtubeSearch.error
                    : rssPreview.error
                }
                onSearch={handlePreviewOrSearch}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {feedSteps.step === DIALOG_STEPS.SEARCH && (
              <FeedSearchResults
                results={feedSteps.searchResults}
                onSelectResult={handleSelectSearchResult}
                onBack={handleGoBack}
              />
            )}

            {feedSteps.step === DIALOG_STEPS.PREVIEW && (
              <FeedPreviewStep
                previewData={feedSteps.previewData}
                form={form.form}
                isSubmitting={isSubmitting}
                onBack={handleGoBack}
                onSubmit={handleFormSubmit}
                currentStep={feedSteps.step}
                searchResults={feedSteps.searchResults}
                addFeedMutation={addFeedMutation}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

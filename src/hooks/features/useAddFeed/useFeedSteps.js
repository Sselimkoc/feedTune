import { DIALOG_STEPS } from "@/components/features/feed/dialogs/constants";
import { useState, useCallback } from "react";

export const useFeedSteps = () => {
  const [step, setStep] = useState(DIALOG_STEPS.INPUT);
  const [previewData, setPreviewData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const goToInput = useCallback(() => {
    setStep(DIALOG_STEPS.INPUT);
    setPreviewData(null);
    setSearchResults([]);
  }, []);

  const goToSearch = useCallback((results) => {
    setSearchResults(results);
    setStep(DIALOG_STEPS.SEARCH);
  }, []);

  const goToPreview = useCallback((data) => {
    setPreviewData(data);
    setStep(DIALOG_STEPS.PREVIEW);
    // searchResults'ı sakla - geri gitmek isterse SEARCH'e dönebilsin
  }, []);

  const reset = useCallback(() => {
    setStep(DIALOG_STEPS.INPUT);
    setPreviewData(null);
    setSearchResults([]);
  }, []);

  return {
    step,
    previewData,
    searchResults,
    goToInput,
    goToSearch,
    goToPreview,
    reset,
    setPreviewData,
  };
};

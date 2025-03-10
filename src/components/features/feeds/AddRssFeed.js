"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/features/useFeeds";
import { useLanguage } from "@/contexts/LanguageContext";

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

export function AddRssFeed({ onBack, onSuccess }) {
  const [formState, setFormState] = useState({
    url: "",
    error: "",
    isSubmitting: false,
  });
  const { addRssFeed, isAddingRssFeed } = useFeeds();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  const validateUrl = (url) => {
    if (!url) return "URL zorunludur";

    // @ karakteri içeren URL'leri kabul et, doğrulama yapmadan geç
    if (url.includes("@")) return "";

    if (!URL_REGEX.test(url)) return "Geçerli bir URL giriniz";
    return "";
  };

  // Debounce fonksiyonu - input değişikliklerini geciktirmek için
  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormState((prev) => ({
      ...prev,
      url,
      error: validateUrl(url),
    }));
  };

  // Debounced input değişikliği - 500ms gecikme ile
  const debouncedUrlChange = debounce(handleUrlChange, 500);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateUrl(formState.url);
    if (error) {
      setFormState((prev) => ({ ...prev, error }));
      toast.error(t("feeds.addRssFeed.urlInvalid"));
      return;
    }

    if (!user?.id) {
      toast.error(t("errors.unauthorized"));
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(
        `/api/proxy?url=${encodeURIComponent(formState.url)}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch feed");
      }

      await addRssFeed({
        url: formState.url,
        userId: user.id,
      });

      setFormState((prev) => ({ ...prev, url: "" }));
      toast.success(t("feeds.addRssFeed.success"));
      onSuccess?.();
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast.error(error.message || t("feeds.addRssFeed.error"));
      setFormState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const isLoading = formState.isSubmitting || isAddingRssFeed;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{t("feeds.addRssFeed.title")}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="url"
            name="url"
            type="text"
            value={formState.url}
            onChange={(e) => {
              setFormState({
                ...formState,
                url: e.target.value,
                error: "",
              });
              debouncedUrlChange(e);
            }}
            placeholder={t("feeds.addRssFeed.urlPlaceholder")}
            disabled={isLoading}
            aria-invalid={!!formState.error}
            className={formState.error ? "border-destructive" : ""}
          />
          {formState.error && (
            <p className="text-xs text-destructive">{formState.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("feeds.addRssFeed.urlPlaceholder")}
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!formState.url || !!formState.error || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("feeds.addRssFeed.checking")}
            </>
          ) : (
            t("feeds.addRssFeed.add")
          )}
        </Button>
      </form>
    </div>
  );
}

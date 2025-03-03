"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/useFeeds";

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

  const validateUrl = (url) => {
    if (!url) return "URL zorunludur";
    if (!URL_REGEX.test(url)) return "Geçerli bir URL giriniz";
    return "";
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormState((prev) => ({
      ...prev,
      url,
      error: validateUrl(url),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateUrl(formState.url);
    if (error) {
      setFormState((prev) => ({ ...prev, error }));
      toast.error(error);
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to add feeds");
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
      toast.success("Feed added successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast.error(error.message || "Failed to fetch RSS feed");
      setFormState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const isLoading = formState.isSubmitting || isAddingRssFeed;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Add RSS Feed</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="url"
            value={formState.url}
            onChange={handleUrlChange}
            placeholder="Enter RSS feed URL"
            disabled={isLoading}
            aria-invalid={!!formState.error}
            className={formState.error ? "border-red-500" : ""}
          />
          {formState.error && (
            <p className="text-sm text-red-500">{formState.error}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !!formState.error}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Feed"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { t } = useLanguage();
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (mode, onSuccess) => {
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (result.success) {
          toast.success(t("auth.registerSuccess"));
          onSuccess?.();
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          toast.success(t("auth.loginSuccess"));
          onSuccess?.();
          // Force a refresh of the current page to update UI
          router.refresh();
        }
      }
    } catch (error) {
      toast.error(error.message || t("errors.general"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
  };
}

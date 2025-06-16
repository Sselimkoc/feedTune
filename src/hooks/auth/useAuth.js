"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/hooks/useLanguage";
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

    // Client-side validation
    if (!email || !password) {
      toast.error(t("auth.loginRequired"));
      setIsLoading(false);
      return { success: false, error: t("auth.loginRequired") };
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error(t("auth.invalidCredentials"));
      setIsLoading(false);
      return { success: false, error: t("auth.invalidCredentials") };
    }
    if (password.length < 6) {
      toast.error(t("auth.weakPassword"));
      setIsLoading(false);
      return { success: false, error: t("auth.weakPassword") };
    }

    try {
      if (mode === "signup") {
        const result = await signUp({ email, password });
        if (result.success) {
          toast.success(t("auth.successSignUp"));
          onSuccess?.();
          return result;
        }
        return result;
      } else {
        const result = await signIn({ email, password });
        if (result.success) {
          toast.success(t("auth.loginSuccess"));
          onSuccess?.();
          // Force a refresh of the current page to update UI
          router.refresh();
          return result;
        }
        return result;
      }
    } catch (error) {
      toast.error(error.message || t("errors.general"));
      return { success: false, error };
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

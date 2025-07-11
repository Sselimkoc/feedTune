"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";

// Export the context hook
export function useAuth() {
  return useAuthStore();
}

// Export the actions hook
export function useAuthActions() {
  const router = useRouter();
  const { signIn, signUp, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Custom toast functions that translate keys
  const toastSuccess = (messageKey) =>
    toast({ title: t("common.success"), description: t(messageKey) });
  const toastError = (messageKey) =>
    toast({
      title: t("common.error"),
      description: t(messageKey),
      variant: "destructive",
    });

  const handleSignIn = async (credentials) => {
    try {
      const { success, error, status } = await signIn({
        ...credentials,
        toastSuccess,
        toastError,
      });

      if (success) {
        router.push("/");
        return { success, error };
      }

      // Handle email verification error
      if (status === "email_not_verified") {
        return {
          success: false,
          error,
          status: "email_not_verified",
          email: credentials.email,
        };
      }

      return { success, error };
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("auth.loginError"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const handleSignUp = async (credentials) => {
    try {
      const { success, error, status } = await signUp({
        ...credentials,
        toastSuccess,
        toastError,
      });

      // Artık yönlendirme yapmıyoruz, sadece sonucu döndürüyoruz
      return { success, error, status };
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("auth.registerError"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const handleSignOut = async () => {
    try {
      const { success, error } = await signOut({ toastSuccess, toastError });
      if (success) {
        router.push("/");
      }
      return { success, error };
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("auth.logoutError"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const { success, error } = await updateProfile(updates, {
        toastSuccess,
        toastError,
      });
      return { success, error };
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("auth.profileUpdateError"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    handleSignIn,
    handleSignUp,
    handleSignOut,
    handleUpdateProfile,
  };
}

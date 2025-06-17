"use client";

import { useAuth as useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Export the context hook
export const useAuth = useAuthContext;

// Export the actions hook
export function useAuthActions() {
  const router = useRouter();
  const { signIn, signUp, signOut, updateProfile } = useAuthContext();
  const { toast } = useToast();

  // Custom toast functions
  const toastSuccess = (message) =>
    toast({ title: message, variant: "default" });
  const toastError = (message) =>
    toast({ title: message, variant: "destructive" });

  const handleSignIn = async (credentials) => {
    try {
      const { success, error } = await signIn({
        ...credentials,
        toastSuccess,
        toastError,
      });
      if (success) {
        router.push("/home");
      }
      return { success, error };
    } catch (error) {
      console.error("Sign in error:", error);
      toastError(
        error.message || "An unexpected error occurred during sign in."
      );
      return { success: false, error };
    }
  };

  const handleSignUp = async (credentials) => {
    try {
      const { success, error } = await signUp({
        ...credentials,
        toastSuccess,
        toastError,
      });
      if (success) {
        router.push("/auth/verify-email");
      }
      return { success, error };
    } catch (error) {
      console.error("Sign up error:", error);
      toastError(
        error.message || "An unexpected error occurred during sign up."
      );
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
      toastError(
        error.message || "An unexpected error occurred during sign out."
      );
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
      toastError(
        error.message || "An unexpected error occurred during profile update."
      );
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

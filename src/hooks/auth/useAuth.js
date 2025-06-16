"use client";

import { useAuth as useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Export the context hook
export const useAuth = useAuthContext;

// Export the actions hook
export function useAuthActions() {
  const router = useRouter();
  const { signIn, signUp, signOut, updateProfile } = useAuthContext();

  const handleSignIn = async (credentials) => {
    try {
      const { success, error } = await signIn(credentials);
      if (success) {
        router.push("/home");
      }
      return { success, error };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error };
    }
  };

  const handleSignUp = async (credentials) => {
    try {
      const { success, error } = await signUp(credentials);
      if (success) {
        router.push("/auth/verify-email");
      }
      return { success, error };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error };
    }
  };

  const handleSignOut = async () => {
    try {
      const { success, error } = await signOut();
      if (success) {
        router.push("/");
      }
      return { success, error };
    } catch (error) {
      console.error("Sign out error:", error);
      return { success: false, error };
    }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const { success, error } = await updateProfile(updates);
      return { success, error };
    } catch (error) {
      console.error("Update profile error:", error);
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

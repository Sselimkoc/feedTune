"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Try to get the session from the URL
        const { error } = await supabase.auth.getSession();

        // If there's no error, the email has been verified
        if (!error) {
          toast({
            title: t("common.success"),
            description: t("auth.emailVerified"),
          });
        }

        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (error) {
        console.error("Error during email verification:", error);
        toast({
          title: t("common.error"),
          description: t("auth.verificationError"),
          variant: "destructive",
        });

        // Redirect to home page after error
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    };

    handleEmailVerification();
  }, [router, toast, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">
          {t("auth.verifyingEmail")}
        </h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-muted-foreground">
          {t("auth.redirecting")}
        </p>
      </div>
    </div>
  );
}

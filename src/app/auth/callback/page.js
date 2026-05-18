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

        const { data, error } = await supabase.auth.getSession();

        if (!error && data?.session) {
          // Already has a session — go directly to app
          toast({
            title: t("common.success"),
            description: t("auth.emailVerified", "Email verified! Welcome."),
          });
          router.replace("/");
        } else {
          // Verified but no active session yet — send to login
          toast({
            title: t("common.success"),
            description: t("auth.emailVerifiedLogin", "Email verified! Please log in."),
          });
          router.replace("/?verified=1");
        }
      } catch (error) {
        console.error("Error during email verification:", error);
        toast({
          title: t("common.error"),
          description: t("auth.verificationError"),
          variant: "destructive",
        });
        router.replace("/");
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

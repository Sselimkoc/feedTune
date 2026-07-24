"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
  
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error && data?.session) {
            toast({
              title: t("common.success"),
              description: t("auth.emailVerified", "Email verified! Welcome."),
            });
            router.replace("/");
            return;
          }
        }

        // No usable tokens in the hash, or setSession failed — check for an existing session
        const { data, error } = await supabase.auth.getSession();

        if (!error && data?.session) {
          toast({
            title: t("common.success"),
            description: t("auth.emailVerified", "Email verified! Welcome."),
          });
          router.replace("/");
        } else {
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

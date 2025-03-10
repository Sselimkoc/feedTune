"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { DialogFooter } from "@/components/ui/dialog";

export function AuthModal({ isOpen, onOpenChange, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { t } = useLanguage();
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (result.success) {
          toast.success(t("auth.registerSuccess"));
          onOpenChange?.(false);
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          toast.success(t("auth.loginSuccess"));
          onOpenChange?.(false);
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

  const handleOpenChange = (open) => {
    if (!open) {
      setEmail("");
      setPassword("");
      setIsLoading(false);
    }
    onOpenChange?.(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "signup" ? t("auth.register") : t("auth.login")}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? t("auth.registerDescription")
              : t("auth.loginDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? t("common.loading")
                : mode === "signup"
                ? t("auth.register")
                : t("auth.login")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              disabled={isLoading}
              className="w-full mt-2"
            >
              {mode === "login"
                ? t("auth.registerPrompt")
                : t("auth.loginPrompt")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/auth/useAuth";

export function AuthModal({ open, onOpenChange, defaultTab = "login" }) {
  const [mode, setMode] = useState(defaultTab);
  const { t } = useLanguage();
  const { isLoading, email, setEmail, password, setPassword, handleSubmit } =
    useAuth();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(mode, () => onOpenChange?.(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? t("auth.login") : t("auth.register")}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? t("auth.loginDescription")
              : t("auth.registerDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              required
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="link"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="px-0"
            >
              {mode === "login"
                ? t("auth.switchToRegister")
                : t("auth.switchToLogin")}
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t("common.loading")
                : mode === "login"
                ? t("auth.loginButton")
                : t("auth.registerButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

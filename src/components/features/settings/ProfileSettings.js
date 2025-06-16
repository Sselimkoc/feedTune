"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export function ProfileSettings() {
  const { t } = useTranslation();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdateProfile = useCallback(async () => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t("errors.passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email || undefined,
        password: formData.password || undefined,
      });

      if (error) throw error;

      toast.success(t("success.profileUpdated"));
      setFormData({ email: "", password: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("errors.profileUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [userId, formData, toast, t]);

  const handleDeleteAccount = useCallback(async () => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    if (!window.confirm(t("settings.profile.confirmDelete"))) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.rpc("delete_user_account", {
        user_id: userId,
      });

      if (error) throw error;

      await supabase.auth.signOut();
      router.push("/auth/login");
      toast.success(t("success.accountDeleted"));
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("errors.accountDeletionFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [userId, router, toast, t]);

  if (isLoadingUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Update */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("settings.profile.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t("settings.profile.emailPlaceholder")}
          />
        </div>

        {/* Password Update */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("settings.profile.newPassword")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={t("settings.profile.passwordPlaceholder")}
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t("settings.profile.confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={t("settings.profile.confirmPasswordPlaceholder")}
          />
        </div>

        {/* Update Button */}
        <Button
          className="w-full"
          onClick={handleUpdateProfile}
          disabled={isLoading}
        >
          {isLoading
            ? t("settings.profile.updating")
            : t("settings.profile.update")}
        </Button>

        <Separator className="my-6" />

        {/* Delete Account */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-destructive">
            {t("settings.profile.dangerZone")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.profile.deleteWarning")}
          </p>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading
              ? t("settings.profile.deleting")
              : t("settings.profile.delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

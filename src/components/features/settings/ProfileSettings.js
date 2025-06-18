"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth, useAuthActions } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/core/ui/use-toast";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Separator } from "@/components/core/ui/separator";
import { useRouter } from "next/navigation";

export function ProfileSettings() {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { handleUpdateProfile: updateProfile, handleSignOut: signOutAction } =
    useAuthActions();
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdateProfileClick = useCallback(async () => {
    if (!userId) {
      toast({
        title: t("common.error"),
        description: t("errors.authRequired"),
        variant: "destructive",
      });
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordsDontMatch"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const updates = {};
    if (formData.password) {
      updates.password = formData.password;
    }

    try {
      const { success } = await updateProfile(updates);

      if (success) {
        toast({
          title: t("common.success"),
          description: t("auth.profileUpdated"),
          variant: "default",
        });
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        // Hata useAuthActions içinde toast ediliyor
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("errors.general"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, formData, updateProfile, toast, t]);

  const handleDeleteAccount = useCallback(async () => {
    if (!userId) {
      toast({
        title: t("common.error"),
        description: t("errors.authRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm(t("settings.profile.deleteWarningConfirm"))) {
      return;
    }

    setIsLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc("delete_user_account", {
        user_id: userId,
      });

      if (rpcError) throw rpcError;

      const { success: signOutSuccess, error: signOutError } =
        await signOutAction();

      if (!signOutSuccess) throw signOutError;

      toast({
        title: t("common.success"),
        description: t("settings.profile.accountDeletedSuccess"),
        variant: "default",
      });
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: t("common.error"),
        description:
          error.message || t("settings.profile.accountDeletionFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, router, signOutAction, toast, t]);

  if (isLoadingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Input - read-only */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("settings.profile.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            readOnly
            className="cursor-not-allowed bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            {t("settings.profile.emailHelp")}
          </p>
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
          onClick={handleUpdateProfileClick}
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

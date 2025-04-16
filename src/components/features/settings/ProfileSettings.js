"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileSettings() {
  const { t } = useLanguage();
  const { user, updateProfile, loading } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    if (user) {
      // Kullanıcı bilgilerini yükle (önce users tablosundan, sonra user_metadata'dan)
      const displayName = user.user_metadata?.display_name || "";
      const avatarUrl = user.user_metadata?.avatar_url || "";

      setDisplayName(displayName);
      setAvatarUrl(avatarUrl);
    }
  }, [user]);

  // Profil güncelleme işlemi
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const result = await updateProfile(displayName, avatarUrl);
      if (result.success) {
        toast.success(t("settings.profile.updateSuccess"));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("settings.profile.updateError"));
    }
  };

  // İnitials (avatar fallback için)
  const getInitials = (name) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile.title")}</CardTitle>
        <CardDescription>{t("settings.profile.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl} alt={displayName || user?.email} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <Label htmlFor="avatarUrl">
                {t("settings.profile.avatarUrl")}
              </Label>
              <Input
                id="avatarUrl"
                placeholder={t("settings.profile.avatarUrlPlaceholder")}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {t("settings.profile.avatarHelp")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              {t("settings.profile.displayName")}
            </Label>
            <Input
              id="displayName"
              placeholder={t("settings.profile.displayNamePlaceholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.profile.email")}</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              {t("settings.profile.emailHelp")}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto mt-4"
            disabled={loading}
          >
            {loading ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

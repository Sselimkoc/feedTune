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

export function AuthModal({ isOpen, onOpenChange, initialMode = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (result.success) {
          toast.success("Hesabınız başarıyla oluşturuldu!");
          onOpenChange?.(false);
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          toast.success("Başarıyla giriş yaptınız!");
          onOpenChange?.(false);
          // Force a refresh of the current page to update UI
          router.refresh();
        }
      }
    } catch (error) {
      toast.error(error.message || "Bir hata oluştu");
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
          <DialogTitle>{isSignUp ? "Hesap Oluştur" : "Giriş Yap"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "FeedTune'a hoş geldiniz! Hemen hesap oluşturun ve içeriklerinizi yönetmeye başlayın."
              : "Hesabınıza giriş yapın ve kaldığınız yerden devam edin."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "İşleniyor..."
                : isSignUp
                ? "Hesap Oluştur"
                : "Giriş Yap"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Zaten hesabınız var mı? Giriş yapın"
                : "Hesabınız yok mu? Hemen oluşturun"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { useTranslation } from "react-i18next";
import { useAuth, useAuthActions } from "@/hooks/auth/useAuth";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/core/ui/use-toast";
import { EmailVerification } from "./EmailVerification";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  UserPlus,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Rss,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function AuthModal({ open, onOpenChange, defaultTab = "login" }) {
  const [mode, setMode] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResend, setIsResend] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();
  const { isLoading } = useAuth();
  const { handleSignIn, handleSignUp } = useAuthActions();
  const { toast } = useToast();

  useEffect(() => {
    if (open && !verifyingEmail) {
      setMode(defaultTab);
    }
  }, [open, defaultTab, verifyingEmail]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signup") {
      const result = await handleSignUp({ email, password });

      if (result?.success) {
        // TEMPORARILY MODIFIED - Handle direct signup without email verification
        if (result.status === "direct_signup") {
          // Direct signup successful, close modal
          onOpenChange?.(false);
        }
        // TEMPORARILY COMMENTED OUT - Email verification flows disabled
        // // Handle different signup scenarios
        // if (result.status === "verification_resent") {
        //   // Email exists but is not verified, show verification screen
        //   setRegisteredEmail(email);
        //   setVerifyingEmail(true);
        //   setIsResend(true);
        // } else if (result.status === "new_signup") {
        //   // New signup, show verification screen
        //   setRegisteredEmail(email);
        //   setVerifyingEmail(true);
        //   setIsResend(false);
        // }
      } else if (result?.status === "email_exists") {
        // Email already exists and is verified, suggest login instead
        setMode("login");
        // Pre-fill the email field but clear password
        setEmail(email);
        setPassword("");
      }
      // For other failure cases, error toasts are already shown by the auth store
    } else {
      const result = await handleSignIn({ email, password });

      if (result?.success) {
        onOpenChange?.(false);
      }
      // TEMPORARILY COMMENTED OUT - Email verification handling disabled
      // else if (result?.status === "email_not_verified") {
      //   // Email exists but is not verified, show verification screen
      //   setRegisteredEmail(result.email || email);
      //   setVerifyingEmail(true);
      //   setIsResend(true);
      // }
    }
  };

  const handleResendEmail = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("auth.verification.emailResent"),
      });
      return true;
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("auth.verification.resendError"),
        variant: "destructive",
      });
      return false;
    }
  };

  const handleGoToLogin = () => {
    setVerifyingEmail(false);
    setMode("login");
    setEmail(registeredEmail);
    setPassword("");
    setIsResend(false);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setTimeout(() => {
        setVerifyingEmail(false);
        if (!registeredEmail) {
          setMode(defaultTab);
        }
        setShowPassword(false);
        setIsResend(false);
      }, 300);
    }
    onOpenChange?.(open);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Particle animation
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const sizeClasses = ["w-2 h-2", "w-3 h-3", "w-4 h-4"];
    const sizeIndex = i % 3;
    const colorClass = i % 2 === 0 ? "bg-blue-500/30" : "bg-primary/20";

    return (
      <motion.div
        key={i}
        className={`absolute rounded-full ${colorClass} ${sizeClasses[sizeIndex]}`}
        initial={{
          opacity: 0,
          x: (i % 2 === 0 ? -1 : 1) * (10 + i * 5),
          y: -5 - i * 2,
          scale: 0,
        }}
        animate={{
          opacity: [0, 0.5, 0],
          x: (i % 2 === 0 ? -1 : 1) * (20 + i * 10),
          y: -15 - i * 5,
          scale: [0, 1, 0.5],
        }}
        transition={{
          duration: 2,
          delay: i * 0.2,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: i * 0.1,
        }}
      />
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {mode === "login" ? t("auth.login") : t("auth.register")}
        </DialogTitle>
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pb-6">
          {verifyingEmail ? (
            <EmailVerification
              email={registeredEmail}
              onLoginClick={handleGoToLogin}
              onResendEmail={handleResendEmail}
              isResend={isResend}
            />
          ) : (
            <div className="p-6">
              {/* Logo and title area */}
              <div className="relative flex flex-col items-center mb-8 mt-2">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    className="w-20 h-20 rounded-full flex items-center justify-center relative z-10 p-2"
                  >
                    <Image
                      src="/images/feedtunelogo.png"
                      alt="FeedTune Logo"
                      layout="fill"
                      objectFit="contain"
                      className="text-primary-foreground"
                    />
                    <div className="absolute inset-0">{particles}</div>
                  </motion.div>
                </div>

                <motion.h1
                  className="text-2xl font-bold mt-4 tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  FeedTune
                </motion.h1>

                <motion.div
                  className="text-sm text-muted-foreground mt-1 flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{t("navigation.tagline")}</span>
                  <Sparkles className="h-3 w-3" />
                </motion.div>
              </div>

              {/* Tab area */}
              <Tabs
                defaultValue={mode}
                value={mode}
                onValueChange={setMode}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full p-1">
                  <TabsTrigger
                    value="login"
                    className="rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {t("auth.login")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("auth.register")}
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("auth.emailPlaceholder")}
                        required
                        className="pl-10"
                        autoComplete="email"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("auth.passwordPlaceholder")}
                        required
                        className="pl-10 pr-10"
                        autoComplete={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    ) : (
                      <>
                        {mode === "login" ? (
                          <>
                            {t("auth.login")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            {t("auth.register")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <span>{t("auth.termsText")}</span>{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link
                        href="/terms"
                        target="_blank"
                        className="inline-flex items-center hover:underline"
                      >
                        {t("auth.termsLink")}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </form>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

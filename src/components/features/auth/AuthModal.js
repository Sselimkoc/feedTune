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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  validateAuthForm,
  getPasswordStrengthText,
  getPasswordStrengthColor,
} from "@/utils/authValidation";
import { LoadingSpinner } from "@/components/core/ui/loading-spinner";

export function AuthModal({ open, onOpenChange, defaultTab = "login" }) {
  const [mode, setMode] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResend, setIsResend] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { t } = useTranslation();
  const { isLoading } = useAuth();
  const { handleSignIn, handleSignUp } = useAuthActions();
  const { toast } = useToast();

  useEffect(() => {
    if (open && !verifyingEmail) {
      setMode(defaultTab);
    }
  }, [open, defaultTab, verifyingEmail]);

  // Real-time validation
  useEffect(() => {
    if (email || password) {
      const validation = validateAuthForm(
        { email, password },
        mode === "signup"
      );
      setValidationErrors(validation.errors);
      setPasswordStrength(validation.strength);
    } else {
      setValidationErrors({});
      setPasswordStrength(0);
    }
  }, [email, password, mode]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate form before submission
    const validation = validateAuthForm({ email, password }, mode === "signup");
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await handleSignUp({ email, password });

        if (result?.success) {
          // Handle direct signup without email verification
          if (result.status === "direct_signup") {
            // Direct signup successful, close modal
            onOpenChange?.(false);
          }
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
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
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
        setIsSubmitting(false);
        setValidationErrors({});
        setPasswordStrength(0);
      }, 300);
    }
    onOpenChange?.(open);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPassword(""); // Clear password when switching modes
    setValidationErrors({}); // Clear validation errors
    setPasswordStrength(0);
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
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden mx-auto">
        <DialogTitle className="sr-only">
          {mode === "login" ? t("auth.login") : t("auth.register")}
        </DialogTitle>
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pb-6 max-h-[90vh] overflow-y-auto">
          {verifyingEmail ? (
            <EmailVerification
              email={registeredEmail}
              onLoginClick={handleGoToLogin}
              onResendEmail={handleResendEmail}
              isResend={isResend}
            />
          ) : (
            <div className="p-4 sm:p-6">
              {/* Logo and title area */}
              <div className="relative flex flex-col items-center mb-6 sm:mb-8 mt-2">
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
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center relative z-10 p-2"
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
                  className="text-xl sm:text-2xl font-bold mt-3 sm:mt-4 tracking-tight text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  FeedTune
                </motion.h1>

                <motion.div
                  className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1 text-center"
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
                onValueChange={handleModeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 rounded-full p-1">
                  <TabsTrigger
                    value="login"
                    className="rounded-full text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-3"
                  >
                    <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {t("auth.login")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-3"
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {t("auth.register")}
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">{t("auth.email")}</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder={t("auth.emailPlaceholder")}
                        required
                        className={`pl-10 h-11 sm:h-10 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                        autoComplete="email"
                        disabled={isSubmitting}
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {validationErrors.email && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-red-500">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{validationErrors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base">{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder={t("auth.passwordPlaceholder")}
                        required
                        className={`pl-10 pr-10 h-11 sm:h-10 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                        autoComplete={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        disabled={isSubmitting}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent touch-manipulation"
                        onClick={togglePasswordVisibility}
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {validationErrors.password && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-red-500">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{validationErrors.password}</span>
                      </div>
                    )}
                    {mode === "signup" && password && (
                      <div className={`text-xs sm:text-sm ${getPasswordStrengthColor(passwordStrength)}`}>
                        Password strength: {getPasswordStrengthText(passwordStrength)}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full h-11 sm:h-10 text-sm sm:text-base font-medium"
                    disabled={isLoading || isSubmitting || Object.keys(validationErrors).some(key => validationErrors[key])}
                  >
                    {isLoading || isSubmitting ? (
                      <LoadingSpinner size="md" color="white" />
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

                  <div className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <span>{t("auth.termsText")}</span>{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary text-xs sm:text-sm"
                      asChild
                    >
                      <Link
                        href="/terms"
                        target="_blank"
                        className="inline-flex items-center hover:underline touch-manipulation"
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

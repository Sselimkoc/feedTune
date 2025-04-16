"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/auth/useAuth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
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

export function AuthModal({ open, onOpenChange, defaultTab = "login" }) {
  const [mode, setMode] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { t } = useLanguage();
  const { isLoading, email, setEmail, password, setPassword, handleSubmit } =
    useAuth();

  useEffect(() => {
    if (open && !verifyingEmail) {
      setMode(defaultTab);
    }
  }, [open, defaultTab, verifyingEmail]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signup") {
      const result = await handleSubmit(mode);
      if (result?.success) {
        setRegisteredEmail(email);
        setVerifyingEmail(true);
      }
    } else {
      await handleSubmit(mode, () => onOpenChange?.(false));
    }
  };

  const handleResendEmail = async () => {
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
      });

      if (error) throw error;

      toast.success(t("auth.verification.emailResent"));
      return true;
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast.error(error.message || t("auth.verification.resendError"));
      return false;
    }
  };

  const handleGoToLogin = () => {
    setVerifyingEmail(false);
    setMode("login");
    setEmail(registeredEmail);
    setPassword("");
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setTimeout(() => {
        setVerifyingEmail(false);
        if (!registeredEmail) {
          setMode(defaultTab);
        }
        setShowPassword(false);
      }, 300);
    }
    onOpenChange?.(open);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Parçacık animasyonu için
  const particles = Array.from({ length: 6 }).map((_, i) => (
    <motion.div
      key={i}
      className={`absolute rounded-full bg-primary/30 w-${2 + (i % 3)} h-${
        2 + (i % 3)
      }`}
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
  ));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pb-6">
          {verifyingEmail ? (
            <EmailVerification
              email={registeredEmail}
              onLoginClick={handleGoToLogin}
              onResendEmail={handleResendEmail}
            />
          ) : (
            <div className="p-6">
              {/* Logo ve başlık alanı */}
              <div className="relative flex flex-col items-center mb-8 mt-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center relative z-10 border border-primary/20 shadow-lg shadow-primary/10"
                  >
                    <Rss className="h-10 w-10 text-primary-foreground" />
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

              {/* Tab alanı */}
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

                <AnimatePresence mode="wait">
                  {mode === "login" ? (
                    <TabsContent value="login" asChild forceMount>
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-4">
                          <h2 className="text-xl font-semibold text-foreground">
                            {t("auth.welcome")}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t("auth.loginDescription")}
                          </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                          <div className="space-y-2.5">
                            <Label
                              htmlFor="email-login"
                              className="text-sm font-medium"
                            >
                              {t("auth.email")}
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email-login"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t("auth.emailPlaceholder")}
                                className="pl-10 rounded-lg border-input/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <Label
                                htmlFor="password-login"
                                className="text-sm font-medium"
                              >
                                {t("auth.password")}
                              </Label>
                              <a
                                href="#"
                                className="text-xs text-primary hover:underline"
                              >
                                {t("auth.forgotPassword")}
                              </a>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password-login"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t("auth.passwordPlaceholder")}
                                className="pl-10 pr-10 rounded-lg border-input/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                                required
                              />
                              <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full mt-6 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary transition-all duration-300 group shadow-md shadow-primary/10"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                {t("common.loading")}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                {t("auth.loginButton")}
                                <motion.div
                                  className="ml-2"
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    ease: "easeInOut",
                                    repeatDelay: 1,
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </motion.div>
                              </div>
                            )}
                          </Button>
                        </form>
                      </motion.div>
                    </TabsContent>
                  ) : (
                    <TabsContent value="signup" asChild forceMount>
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-4">
                          <h2 className="text-xl font-semibold text-foreground">
                            {t("auth.createAccount")}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t("auth.registerDescription")}
                          </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                          <div className="space-y-2.5">
                            <Label
                              htmlFor="email-signup"
                              className="text-sm font-medium"
                            >
                              {t("auth.email")}
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email-signup"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t("auth.emailPlaceholder")}
                                className="pl-10 rounded-lg border-input/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <Label
                              htmlFor="password-signup"
                              className="text-sm font-medium"
                            >
                              {t("auth.password")}
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password-signup"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t("auth.passwordPlaceholder")}
                                className="pl-10 pr-10 rounded-lg border-input/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                                required
                              />
                              <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                            <p className="text-xs text-muted-foreground">
                              {t("auth.termsNotice")}{" "}
                              <a
                                href="#"
                                className="text-primary hover:underline inline-flex items-center font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t("auth.termsLink")}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </p>
                          </div>

                          <Button
                            type="submit"
                            className="w-full mt-6 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md shadow-primary/10"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                {t("common.loading")}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                {t("auth.registerButton")}
                                <motion.div
                                  className="ml-2"
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    ease: "easeInOut",
                                    repeatDelay: 1,
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </motion.div>
                              </div>
                            )}
                          </Button>
                        </form>
                      </motion.div>
                    </TabsContent>
                  )}
                </AnimatePresence>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/core/ui/dialog";
import { useTranslation } from "react-i18next";
import { useAuth, useAuthActions } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/core/ui/use-toast";
import { EmailVerification } from "./EmailVerification";
import {
  validateAuthForm,
  getPasswordStrengthText,
  getPasswordStrengthColor,
} from "@/utils/authValidation";
import { resendVerificationEmail } from "@/utils/authEmailUtils";
import {
  EmailInput,
  PasswordInput,
  AuthTabs,
  AuthHeader,
  AuthForm,
  generateAuthParticles,
} from "./shared";

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
  const particles = generateAuthParticles();
  const passwordStrengthText = getPasswordStrengthText(passwordStrength);
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength);

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
          if (result.status === "direct_signup") {
            onOpenChange?.(false);
          } else if (result.status === "email_verification_needed") {
            // Email verification required
            setVerifyingEmail(true);
            setRegisteredEmail(email);
          }
        } else if (result?.status === "email_exists") {
          setMode("login");
          setEmail(email);
          setPassword("");
        } else if (result?.status === "rate_limit") {
          // Rate limit - toast already shown by store
          console.warn("Rate limit exceeded");
        }
      } else {
        const result = await handleSignIn({ email, password });

        if (result?.success) {
          onOpenChange?.(false);
        } else if (result?.status === "rate_limit") {
          // Rate limit - toast already shown by store
          console.warn("Rate limit exceeded");
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
      await resendVerificationEmail(registeredEmail);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[95vh] p-0 gap-0 overflow-visible mx-auto flex flex-col">
        <DialogTitle className="sr-only">
          {mode === "login" ? t("auth.login") : t("auth.register")}
        </DialogTitle>
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pb-6 overflow-hidden flex-1 flex flex-col">
          {verifyingEmail ? (
            <EmailVerification
              email={registeredEmail}
              onLoginClick={handleGoToLogin}
              onResendEmail={handleResendEmail}
              isResend={isResend}
            />
          ) : (
            <div className="p-4 sm:p-6 flex flex-col">
              <AuthHeader particles={particles} />

              <AuthTabs mode={mode} onModeChange={handleModeChange}>
                <AuthForm
                  mode={mode}
                  email={email}
                  password={password}
                  showPassword={showPassword}
                  onEmailChange={handleEmailChange}
                  onPasswordChange={handlePasswordChange}
                  onTogglePassword={togglePasswordVisibility}
                  onSubmit={handleFormSubmit}
                  validationErrors={validationErrors}
                  isLoading={isLoading}
                  isSubmitting={isSubmitting}
                  passwordStrength={passwordStrength}
                  passwordStrengthText={passwordStrengthText}
                  passwordStrengthColor={passwordStrengthColor}
                />
              </AuthTabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/components/core/ui/loading-spinner";
import { motion } from "framer-motion";
import { EmailInput } from "./EmailInput";
import { PasswordInput } from "./PasswordInput";

export function AuthForm({
  mode,
  email,
  password,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  validationErrors,
  isLoading,
  isSubmitting,
  passwordStrength,
  passwordStrengthText,
  passwordStrengthColor,
}) {
  const { t } = useTranslation();

  const isFormValid =
    !isLoading &&
    !isSubmitting &&
    !Object.keys(validationErrors).some((key) => validationErrors[key]);

  const inputVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-5"
      initial="hidden"
      animate="visible"
    >
      <motion.div custom={0} variants={inputVariants}>
        <EmailInput
          value={email}
          onChange={onEmailChange}
          error={validationErrors.email}
          placeholder={t("auth.emailPlaceholder")}
          label={t("auth.email")}
          disabled={isSubmitting}
        />
      </motion.div>

      <motion.div custom={1} variants={inputVariants}>
        <PasswordInput
          value={password}
          onChange={onPasswordChange}
          error={validationErrors.password}
          placeholder={t("auth.passwordPlaceholder")}
          label={t("auth.password")}
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
          strengthText={passwordStrengthText}
          strengthColor={passwordStrengthColor}
          showStrength={mode === "signup"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          disabled={isSubmitting}
        />
      </motion.div>

      <motion.div custom={2} variants={inputVariants}>
        <Button
          type="submit"
          className="w-full rounded-lg h-11 sm:h-10 text-sm sm:text-base font-semibold relative group overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
          disabled={!isFormValid}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading || isSubmitting ? (
              <LoadingSpinner size="md" color="white" />
            ) : (
              <>
                {mode === "login" ? t("auth.login") : t("auth.register")}
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 group-hover:opacity-90 opacity-100 transition-opacity duration-300 -z-10" />
        </Button>
      </motion.div>

      <motion.div
        custom={3}
        variants={inputVariants}
        className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2"
      >
        <span>{t("auth.termsText")}</span>{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-primary text-xs sm:text-sm font-medium hover:text-primary/80 transition-colors"
          asChild
        >
          <Link
            href="/terms"
            target="_blank"
            className="inline-flex items-center hover:underline touch-manipulation gap-1"
          >
            {t("auth.termsLink")}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </motion.div>
    </motion.form>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, ArrowRight, Check, RefreshCw } from "lucide-react";

// Safe translation helper
const safeTranslate = (t, key, defaultText) => {
  try {
    return t(key);
  } catch (error) {
    console.error(`Translation error for key: ${key}`, error);
    return defaultText;
  }
};

/**
 * Email verification screen component
 */
export function EmailVerification({ email, onLoginClick, onResendEmail }) {
  const { t } = useLanguage();
  const [isResending, setIsResending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handle email resend action
  const handleResendEmail = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      await onResendEmail();
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative p-6 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Title and description */}
        <h2 className="text-2xl font-bold mb-2">
          {safeTranslate(
            t,
            "auth.verification.title",
            "E-posta Adresinizi Doğrulayın"
          )}
        </h2>
        <p className="text-muted-foreground mb-4">
          {safeTranslate(
            t,
            "auth.verification.description",
            "Hesabınızı kullanmaya başlamadan önce e-posta adresinizi doğrulayın"
          )}
        </p>

        {/* Email sent message */}
        <div className="mb-6">
          <p className="font-medium mb-1">
            {safeTranslate(
              t,
              "auth.verification.checkInbox",
              "Lütfen gelen kutunuzu kontrol edin"
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {safeTranslate(
              t,
              "auth.verification.emailSentTo",
              "Doğrulama e-postası gönderildi: "
            )}
            <span className="font-medium text-primary ml-1">{email}</span>
          </p>
        </div>

        {/* Steps */}
        <div className="p-4 rounded-lg bg-muted mb-6">
          <div className="text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                {safeTranslate(
                  t,
                  "auth.verification.step1",
                  "E-postanızı açın ve doğrulama bağlantısına tıklayın"
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                {safeTranslate(
                  t,
                  "auth.verification.step2",
                  "Bağlantıya tıklamak sizi doğrulama sayfasına yönlendirecektir"
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                {safeTranslate(
                  t,
                  "auth.verification.step3",
                  "Doğrulama tamamlandıktan sonra, hesabınıza giriş yapabilirsiniz"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button variant="default" className="w-full" onClick={onLoginClick}>
            {safeTranslate(
              t,
              "auth.verification.goToLogin",
              "Giriş sayfasına git"
            )}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {safeTranslate(
                  t,
                  "auth.verification.resendingEmail",
                  "E-posta gönderiliyor..."
                )}
              </>
            ) : (
              safeTranslate(
                t,
                "auth.verification.resendEmail",
                "Doğrulama e-postasını yeniden gönder"
              )
            )}
          </Button>
        </div>

        {/* Confirmation message */}
        {showConfirmation && (
          <div className="absolute bottom-4 left-0 right-0 mx-auto w-5/6 bg-green-500 text-white py-2 px-4 rounded-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              <span>
                {safeTranslate(
                  t,
                  "auth.verification.emailResent",
                  "Doğrulama e-postası yeniden gönderildi"
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          {safeTranslate(t, "auth.verification.title", "Verify Your Email")}
        </h2>
        <p className="text-muted-foreground mb-4">
          {safeTranslate(
            t,
            "auth.verification.description",
            "Please verify your email address before you can start using your account"
          )}
        </p>

        {/* Email sent message */}
        <div className="mb-6">
          <p className="font-medium mb-1">
            {safeTranslate(
              t,
              "auth.verification.checkInbox",
              "Please check your inbox"
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {safeTranslate(
              t,
              "auth.verification.emailSentTo",
              "Verification email sent to: "
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
                  "Open your email and click the verification link"
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
                  "Clicking the link will redirect you to the verification page"
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
                  "After verification is complete, you can log in to your account"
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
              "Go to login page"
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
                  "Sending email..."
                )}
              </>
            ) : (
              safeTranslate(
                t,
                "auth.verification.resendEmail",
                "Resend verification email"
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
                  "Verification email has been resent"
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

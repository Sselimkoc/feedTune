"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Extract any query parameters from the current URL
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // Create the new URL with the same query parameters
    const redirectUrl = `/auth/callback${
      searchParams.toString() ? "?" + searchParams.toString() : ""
    }`;

    // Redirect to the callback page
    router.replace(redirectUrl);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Redirecting...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-muted-foreground">
          Please wait while we redirect you...
        </p>
      </div>
    </div>
  );
}

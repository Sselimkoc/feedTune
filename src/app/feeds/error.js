"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function FeedsError({ error, reset }) {
  useEffect(() => {
    // Hata loglama
    console.error("Feed sayfası hatası:", error);
  }, [error]);

  return (
    <div className="container py-6 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-8 text-center">
        <div className="bg-card/50 backdrop-blur-sm rounded-lg p-8 shadow-sm border max-w-md">
          <div className="relative flex justify-center mb-6">
            <div className="absolute -inset-4 rounded-full bg-destructive/10 animate-pulse" />
            <AlertCircle className="h-12 w-12 text-destructive relative" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Bir hata oluştu</h3>
          <p className="text-muted-foreground mb-6">
            Feed'leriniz yüklenirken bir sorun oluştu. Lütfen tekrar deneyin
            veya daha sonra tekrar kontrol edin.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full gap-2" variant="default">
              <RefreshCw className="h-4 w-4" />
              <span>Tekrar Dene</span>
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
              variant="outline"
            >
              Ana Sayfaya Dön
            </Button>
          </div>

          {error?.message && (
            <div className="mt-6 p-3 bg-destructive/10 rounded-md text-sm text-destructive/90 text-left">
              <p className="font-medium">Hata detayı:</p>
              <p className="font-mono text-xs mt-1 break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

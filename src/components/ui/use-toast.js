"use client";

import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

export function useToast() {
  const { t } = useLanguage();

  const localToast = {
    // Temel toast fonksiyonu
    toast: toast,

    // Başarılı işlem bildirimi
    success: (message, options = {}) => {
      return toast.success(message, options);
    },

    // Hata bildirimi
    error: (message, options = {}) => {
      return toast.error(message, options);
    },

    // Bilgilendirme bildirimi
    info: (message, options = {}) => {
      return toast.info(message, options);
    },

    // Uyarı bildirimi
    warning: (message, options = {}) => {
      return toast.warning(message, options);
    },

    // Özel bildirim
    custom: (message, options = {}) => {
      return toast(message, options);
    },
  };

  return localToast;
}

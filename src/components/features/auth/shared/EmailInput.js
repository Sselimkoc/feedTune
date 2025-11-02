"use client";

import { Mail, AlertCircle } from "lucide-react";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { motion } from "framer-motion";

export function EmailInput({
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  label,
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor="email" className="text-sm sm:text-base font-medium">
        {label}
      </Label>
      <motion.div
        className="relative group"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        <Input
          id="email"
          type="email"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className={`pl-10 h-11 sm:h-10 rounded-lg border-border/40 transition-all duration-300 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "focus:border-primary/50 focus:ring-primary/20"
          } bg-background/50 backdrop-blur-sm`}
          autoComplete="email"
          disabled={disabled}
        />
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
      </motion.div>
      {error && (
        <motion.div
          className="flex items-center gap-1.5 text-xs sm:text-sm text-red-500"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </motion.div>
      )}
    </div>
  );
}

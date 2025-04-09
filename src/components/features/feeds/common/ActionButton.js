"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const ActionButton = memo(function ActionButton({
  icon,
  label,
  tooltip,
  onClick,
  variant = "outline",
  size = "sm",
  isLoading = false,
  isActive = false,
  className,
  tooltipSide = "bottom",
  tooltipAlign = "center",
  hideLabel = false,
  ...props
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={variant}
              size={size}
              onClick={onClick}
              disabled={isLoading}
              className={cn("gap-1.5", isActive && "text-primary", className)}
              {...props}
            >
              {icon}
              {label && !hideLabel && (
                <span className="hidden sm:inline text-sm">{label}</span>
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} align={tooltipAlign}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

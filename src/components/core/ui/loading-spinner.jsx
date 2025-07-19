import { motion } from "framer-motion";

/**
 * Reusable loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color of the spinner
 * @param {string} props.className - Additional CSS classes
 */
export function LoadingSpinner({
  size = "md",
  color = "primary",
  className = "",
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const colorClasses = {
    primary: "border-primary border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent",
    red: "border-red-500 border-t-transparent",
    green: "border-green-500 border-t-transparent",
    blue: "border-blue-500 border-t-transparent",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 rounded-full animate-spin ${colorClasses[color]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    />
  );
}

/**
 * Loading button component with spinner
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether to show loading state
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.loadingText - Text to show when loading
 * @param {string} props.size - Size of the spinner
 * @param {string} props.className - Additional CSS classes
 */
export function LoadingButton({
  loading = false,
  children,
  loadingText = "Loading...",
  size = "sm",
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner size={size} />}
      {loading ? loadingText : children}
    </button>
  );
}

/**
 * Skeleton loading component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.lines - Number of skeleton lines
 */
export function Skeleton({ className = "", lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
          }}
        />
      ))}
    </div>
  );
}

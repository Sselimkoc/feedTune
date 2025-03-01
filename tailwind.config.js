/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "slide-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-to-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "var(--tw-opacity)", transform: "scale(1)" },
          "50%": {
            opacity: "calc(var(--tw-opacity) * 0.8)",
            transform: "scale(1.05)",
          },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.15s ease-out",
        "accordion-up": "accordion-up 0.15s ease-out",
        "slide-from-right":
          "slide-from-right 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-to-right": "slide-to-right 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        pulse: "pulse 8s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
      },
      transitionDelay: {
        0: "0ms",
        2000: "2000ms",
        4000: "4000ms",
      },
      transitionDuration: {
        0: "0ms",
        200: "200ms",
        400: "400ms",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities, theme, e }) {
      const animationDelayUtilities = Object.entries(
        theme("transitionDelay", {})
      ).map(([key, value]) => {
        return {
          [`.${e(`animation-delay-${key}`)}`]: {
            "animation-delay": value,
          },
        };
      });
      addUtilities(animationDelayUtilities);

      // Add content-visibility utilities for performance
      addUtilities({
        ".content-visibility-auto": {
          "content-visibility": "auto",
        },
        ".content-visibility-hidden": {
          "content-visibility": "hidden",
        },
        ".content-visibility-visible": {
          "content-visibility": "visible",
        },
        // Add will-change utilities
        ".will-change-auto": {
          "will-change": "auto",
        },
        ".will-change-contents": {
          "will-change": "contents",
        },
        ".will-change-scroll-position": {
          "will-change": "scroll-position",
        },
        // Add GPU acceleration utilities
        ".gpu-accelerated": {
          transform: "translateZ(0)",
          "backface-visibility": "hidden",
        },
      });
    },
  ],
};

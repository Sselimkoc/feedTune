import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AppProvider } from "@/providers/AppProvider";
import { AppLayout } from "@/components/core/layout/AppLayout";
import { Toaster } from "@/components/core/ui/toaster";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * Dynamic background pattern (SVG noise)
 */
const noiseBg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;

export const metadata = {
  title: "FeedTune - RSS & YouTube Feed Reader",
  description:
    "Modern RSS and YouTube feed reader with AI-powered content curation",
  metadataBase: new URL("http://localhost:3000"),
};

/**
 * Root Layout Component
 * Main layout wrapper for entire application
 * Includes all necessary providers
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${inter.variable} font-sans h-full antialiased`}
        style={{
          "--primary-rgb": "var(--primary)",
          "--background-rgb": "var(--background)",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AppProvider>
              {/* Dynamic background */}
              <div className="fixed inset-0 -z-10 overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950" />

                {/* Triangle patterns */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-no-repeat bg-[length:100%_100%] opacity-[0.07] dark:opacity-[0.03] animate-[pulse_8s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-no-repeat bg-[length:100%_100%] opacity-[0.07] dark:opacity-[0.03] animate-[pulse_8s_ease-in-out_infinite] animation-delay-4000 rotate-180" />
                </div>

                {/* Subtle noise texture */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: `url("${noiseBg}")` }}
                />
              </div>

              <AppLayout>
                <div className="glass rounded-xl p-6 min-h-[calc(100vh-2rem)]">
                  {children}
                </div>
              </AppLayout>
              <Toaster />
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

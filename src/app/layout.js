import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AppProvider } from "@/providers/AppProvider";
import { AppLayout } from "@/components/core/layout/AppLayout";
import { Toaster } from "@/components/core/ui/toaster";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
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

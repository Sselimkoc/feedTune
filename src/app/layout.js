import "./globals.css";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AppProvider } from "../providers/AppProvider";
import { Toaster } from "@/components/core/ui/toaster";
import { AppLayout } from "../components/core/layout/AppLayout";
import { ThemeProvider } from "../providers/ThemeProvider";
import { LanguageProvider } from "../providers/LanguageProvider";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "FeedTune - RSS & YouTube Feed Reader",
  description: "Modern RSS and YouTube feed reader with AI-powered content curation",
  metadataBase: new URL("http://localhost:3000"),
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const language = cookieStore.get("language")?.value || "en";

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} scroll-smooth`}
    >
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
          <LanguageProvider initialLanguage={language}>
            <AppProvider>
              <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
              </div>
              <AppLayout>
                <div className="glass rounded-xl p-6">{children}</div>
              </AppLayout>
              <Toaster />
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

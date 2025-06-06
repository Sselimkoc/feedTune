import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ThemeProvider } from "@/components/features/theme/themeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/components/features/providers/QueryProvider";
import { LogoMigrationProvider } from "@/components/features/providers/LogoMigrationProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import dynamic from "next/dynamic";

// Debug araçlarını yükle - Sadece ana debug yükleyici aktif
const DebugLoader = dynamic(
  () =>
    process.env.NODE_ENV === "development"
      ? import("@/components/dev/DebugLoader").then((mod) => mod.default)
      : Promise.resolve(() => null),
  { ssr: false }
);

// // Ana debug paneli - sadece bu aktif
// const DevDebugPanel = dynamic(
//   () =>
//     process.env.NODE_ENV === "development"
//       ? import("@/components/dev/DebugPanel").then((mod) => mod.default)
//       : Promise.resolve(() => null),
//   { ssr: false }
// );

// Yeni debug runner paneli
const DevDebugRunnerPanel = dynamic(
  () =>
    process.env.NODE_ENV === "development"
      ? import("@/components/dev/DebugRunnerPanel").then((mod) => mod.default)
      : Promise.resolve(() => null),
  { ssr: false }
);

// // Feed onarım paneli - yeni eklenen
// const FeedSelfFixPanel = dynamic(
//   () =>
//     process.env.NODE_ENV === "development"
//       ? import("@/components/dev/FeedSelfFixPanel").then((mod) => mod.default)
//       : Promise.resolve(() => null),
//   { ssr: false }
// );

// Diğer debug araçları devre dışı (yorum haline getirilerek)
// Not: Diğer debug araçlarına ihtiyaç duyarsanız, aşağıdaki satırları yorum durumundan çıkarabilirsiniz
/*
const DevFeedDebugger = dynamic(
  () =>
    process.env.NODE_ENV === "development"
      ? import("@/components/dev/FeedDebugPanel").then((mod) => mod.default)
      : Promise.resolve(() => null),
  { ssr: false }
);

const DevDbTestPanel = dynamic(
  () =>
    process.env.NODE_ENV === "development"
      ? import("@/components/dev/DbTestPanel")
      : Promise.resolve(() => null),
  { ssr: false }
);


*/
const DevFeedDebugInfo = dynamic(
  () =>
    process.env.NODE_ENV === "development"
      ? import("@/components/dev/FeedDebugInfo").then((mod) => mod.default)
      : Promise.resolve(() => null),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "FeedTune - RSS Feed Reader",
  description: "Modern and user-friendly RSS feed reader",
};

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
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <LogoMigrationProvider>
                <LanguageProvider>
                  {/* Dinamik arka plan */}
                  <div className="fixed inset-0 -z-10 overflow-hidden">
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950" />

                    {/* Triangle patterns */}
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-no-repeat bg-[length:100%_100%] opacity-[0.07] dark:opacity-[0.03] animate-[pulse_8s_ease-in-out_infinite]" />
                      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-no-repeat bg-[length:100%_100%] opacity-[0.07] dark:opacity-[0.03] animate-[pulse_8s_ease-in-out_infinite] animation-delay-4000 rotate-180" />
                    </div>

                    {/* Subtle noise texture */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
                  </div>

                  {/* Ana içerik */}
                  <AppLayout>
                    <div className="glass rounded-xl p-6 min-h-[calc(100vh-2rem)]">
                      {children}
                    </div>
                  </AppLayout>

                  <Toaster
                    position="top-center"
                    richColors
                    toastOptions={{
                      className: "glass",
                      style: {
                        borderRadius: "0.75rem",
                        padding: "1rem",
                      },
                    }}
                  />

                  {/* Sadece ana debug araçları aktif */}
                  <DebugLoader />
                  {/* <DevDebugPanel /> */}
                  <DevDebugRunnerPanel />
                  {/* <FeedSelfFixPanel /> */}

                  {/* Diğer debug panelleri devre dışı
                  <DevFeedDebugger />
                  <DevDbTestPanel />
                  */}
                  <DevFeedDebugInfo />
                </LanguageProvider>
              </LogoMigrationProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

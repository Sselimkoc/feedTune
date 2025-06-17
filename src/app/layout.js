import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/providers/AuthProvider";
import { AppProvider } from "@/providers/AppProvider";
import { AppLayout } from "@/components/layouts/AppLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "FeedTune - RSS Feed Reader",
  description: "Modern and user-friendly RSS feed reader",
  metadataBase: new URL("http://localhost:3000"),
};

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies });

  try {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access a protected route
  if (!session) {
      let pathname = "/";
      const nextUrl = cookies().get("NEXT_URL")?.value;

      try {
        if (nextUrl) {
          pathname = new URL(nextUrl, "http://localhost").pathname;
        }
      } catch (e) {
        console.error("URL parsing error:", e);
        pathname = "/";
      }

    const protectedRoutes = [
      "/dashboard",
      "/settings",
      "/profile",
      "/feed",
      "/tunes",
    ];

    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      redirect("/n");
    }
  }

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
              <AuthProvider>
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
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
                  </div>

                  <AppLayout>
                    <div className="glass rounded-xl p-6 min-h-[calc(100vh-2rem)]">
                      {children}
                    </div>
                  </AppLayout>
                  <Toaster />
                </AppProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  } catch (error) {
    console.error("Auth check error:", error);
    // Hata durumunda varsayılan olarak public route'a yönlendir
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
            <AuthProvider>
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
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
                  </div>

                  <AppLayout>
                    <div className="glass rounded-xl p-6 min-h-[calc(100vh-2rem)]">
                      {children}
                    </div>
                  </AppLayout>
                <Toaster />
              </AppProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
  }
}

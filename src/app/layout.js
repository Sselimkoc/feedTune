import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navigation } from "@/components/layout/navigation";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FeedTune - RSS Feed Reader",
  description: "Modern and user-friendly RSS feed reader",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-full antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <div className="flex h-full">
                <Navigation />
                <main className="flex-1 ml-64 p-4">{children}</main>
              </div>
              <Toaster position="top-center" richColors />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

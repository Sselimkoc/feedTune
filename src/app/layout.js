import { Navigation } from "@/components/layout/navigation";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/lib/theme-script";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FeedTune - RSS Feed Reader",
  description: "Modern and user-friendly RSS feed reader",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <ThemeProvider>
          <div className="flex h-full">
            <Navigation />
            <div className="flex-1 ml-64">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

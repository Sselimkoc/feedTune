export const metadata = {
  title: "FeedTune - Your Personal Feed Reader",
  description: "Organize and read your favorite feeds in one place",
  metadataBase: new URL("https://feedtune.app"),
  openGraph: {
    title: "FeedTune - Your Personal Feed Reader",
    description: "Organize and read your favorite feeds in one place",
    url: "https://feedtune.app",
    siteName: "FeedTune",
    images: [
      {
        url: "https://feedtune.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeedTune - Your Personal Feed Reader",
    description: "Organize and read your favorite feeds in one place",
    images: ["https://feedtune.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "your-google-site-verification",
    yandex: "your-yandex-verification",
  },
};

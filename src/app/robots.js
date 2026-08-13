const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://feedtune.selimkoc.dev";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/feeds",
        "/favorites",
        "/read-later",
        "/settings",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

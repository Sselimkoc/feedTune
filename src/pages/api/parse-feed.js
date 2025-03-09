import Parser from "rss-parser";
import axios from "axios";
import { JSDOM } from "jsdom";

// RSS Parser'ı yapılandır
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media", { keepArray: true }],
      ["media:thumbnail", "thumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: "URL parameter is required" });
  }

  try {
    // RSS feed'i ayrıştır
    const feed = await parser.parseURL(url);

    // Favicon URL'sini bulmak için site HTML'ini çek
    let favicon = null;
    try {
      // Site URL'sini belirle
      const siteUrl = feed.link || new URL(url).origin;

      // Site HTML'ini çek
      const response = await axios.get(siteUrl);
      const html = response.data;

      // HTML'i ayrıştır
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Favicon link'lerini ara
      const links = document.querySelectorAll('link[rel*="icon"]');

      if (links.length > 0) {
        // En büyük favicon'u bul
        let maxSize = 0;
        links.forEach((link) => {
          const sizes = link.getAttribute("sizes");
          if (sizes) {
            const size = parseInt(sizes.split("x")[0]);
            if (size > maxSize) {
              maxSize = size;
              favicon = link.getAttribute("href");
            }
          } else if (!favicon) {
            favicon = link.getAttribute("href");
          }
        });

        // Favicon URL'sini mutlak URL'ye çevir
        if (favicon && !favicon.startsWith("http")) {
          if (favicon.startsWith("//")) {
            favicon = `https:${favicon}`;
          } else if (favicon.startsWith("/")) {
            favicon = `${new URL(siteUrl).origin}${favicon}`;
          } else {
            favicon = `${siteUrl}/${favicon}`;
          }
        }
      }

      // Favicon bulunamadıysa, varsayılan favicon URL'lerini dene
      if (!favicon) {
        const origin = new URL(siteUrl).origin;
        favicon = `${origin}/favicon.ico`;
      }

      // Favicon URL'sini feed nesnesine ekle
      if (favicon) {
        if (!feed.image) feed.image = {};
        feed.image.url = favicon;
      }
    } catch (error) {
      console.error("Error fetching favicon:", error);
      // Favicon çekilemese bile devam et
    }

    return res.status(200).json(feed);
  } catch (error) {
    console.error("Error parsing feed:", error);
    return res
      .status(500)
      .json({ message: "Failed to parse feed", error: error.message });
  }
}

"use client";

import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { colorAnalysis } from "@/lib/colorAnalysis";

export function useFeedAnalysis(feed) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [colors, setColors] = useState(null);
  const { setCustomColor, updateColorWeight } = useThemeStore();

  useEffect(() => {
    if (!feed) return;

    const analyzeColors = async () => {
      setIsAnalyzing(true);
      try {
        let extractedColors = {};

        // RSS feed analizi
        if (feed.type === "rss") {
          // Favicon analizi
          const faviconUrl = new URL("/favicon.ico", feed.url).href;
          try {
            const response = await fetch(faviconUrl);
            const blob = await response.blob();
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });

            const faviconColor = await colorAnalysis.getDominantColor(base64);
            if (faviconColor) {
              extractedColors.favicon = faviconColor.hex();
            }
          } catch (error) {
            console.warn("Favicon analysis failed:", error);
          }

          // Meta tag analizi
          try {
            const response = await fetch(feed.url);
            const html = await response.text();
            const metaColors = colorAnalysis.extractMetaColors(html);

            if (metaColors.themeColor) {
              extractedColors.theme = metaColors.themeColor;
            }
          } catch (error) {
            console.warn("Meta tag analysis failed:", error);
          }
        }

        // YouTube feed analizi
        if (feed.type === "youtube") {
          // Kanal banner ve avatar analizi
          try {
            const channelId = feed.url.split("/channel/")[1]?.split("?")[0];
            if (channelId) {
              const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=${channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
              );
              const data = await response.json();

              if (data.items?.[0]?.brandingSettings?.image?.bannerExternalUrl) {
                const bannerUrl =
                  data.items[0].brandingSettings.image.bannerExternalUrl;
                const response = await fetch(bannerUrl);
                const blob = await response.blob();
                const base64 = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });

                const bannerColor = await colorAnalysis.getDominantColor(
                  base64
                );
                if (bannerColor) {
                  extractedColors.banner = bannerColor.hex();
                }
              }
            }
          } catch (error) {
            console.warn("YouTube channel analysis failed:", error);
          }
        }

        // Renk harmonisi oluştur
        if (Object.keys(extractedColors).length > 0) {
          const colors = Object.values(extractedColors);
          const weights = colors.map(() => 1 / colors.length);
          const blendedColor = colorAnalysis.blendColors(colors, weights);
          const harmony = colorAnalysis.generateColorHarmony(blendedColor);

          setColors(harmony);
          setCustomColor(feed.id, harmony.primary);
          updateColorWeight(feed.id, 1);
        }
      } catch (error) {
        console.error("Color analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeColors();
  }, [feed]);

  return {
    isAnalyzing,
    colors,
  };
}

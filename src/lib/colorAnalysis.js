import chroma from "chroma-js";

// Renk analizi fonksiyonları
export const colorAnalysis = {
  // Dominant renk çıkarımı (base64 image data)
  getDominantColor: async (imageData) => {
    try {
      const img = new Image();
      img.src = imageData;
      await img.decode();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let colorCounts = {};
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const rgb = `${r},${g},${b}`;
        colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
      }

      const dominantRGB = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)[0][0]
        .split(",")
        .map(Number);

      return chroma(dominantRGB);
    } catch (error) {
      console.error("Error analyzing image:", error);
      return null;
    }
  },

  // Renk harmonisi oluşturma
  generateColorHarmony: (baseColor) => {
    const color = chroma(baseColor);
    return {
      primary: color.hex(),
      accent: color.set("hsl.h", "+120").hex(),
      background: color.luminance(0.95).hex(),
      text: color.luminance(0.15).hex(),
    };
  },

  // Renk karışımı (weights: 0-1 arası ağırlıklar)
  blendColors: (colors, weights) => {
    if (colors.length !== weights.length) {
      throw new Error("Colors and weights arrays must have the same length");
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map((w) => w / totalWeight);

    const lab = colors.reduce(
      (acc, color, i) => {
        const [l, a, b] = chroma(color).lab();
        return [
          acc[0] + l * normalizedWeights[i],
          acc[1] + a * normalizedWeights[i],
          acc[2] + b * normalizedWeights[i],
        ];
      },
      [0, 0, 0]
    );

    return chroma.lab(...lab).hex();
  },

  // Kontrast kontrolü ve düzeltme
  ensureContrast: (background, foreground, minRatio = 4.5) => {
    const bg = chroma(background);
    let fg = chroma(foreground);

    const getContrastRatio = (color1, color2) => {
      const l1 = color1.luminance();
      const l2 = color2.luminance();
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    let contrast = getContrastRatio(bg, fg);
    let attempts = 0;
    const maxAttempts = 10;

    while (contrast < minRatio && attempts < maxAttempts) {
      fg = fg.luminance(fg.luminance() < bg.luminance() ? 0.1 : 0.9);
      contrast = getContrastRatio(bg, fg);
      attempts++;
    }

    return fg.hex();
  },

  // Meta tag'lerden renk çıkarımı
  extractMetaColors: (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    return {
      themeColor: doc.querySelector('meta[name="theme-color"]')?.content,
      ogThemeColor: doc.querySelector('meta[property="og:theme-color"]')
        ?.content,
      msapplicationTileColor: doc.querySelector(
        'meta[name="msapplication-TileColor"]'
      )?.content,
    };
  },
};

// Renk paleti oluşturma
export const generatePalette = (baseColor) => {
  const color = chroma(baseColor);

  return {
    50: color.luminance(0.95).hex(),
    100: color.luminance(0.9).hex(),
    200: color.luminance(0.8).hex(),
    300: color.luminance(0.7).hex(),
    400: color.luminance(0.6).hex(),
    500: color.luminance(0.5).hex(),
    600: color.luminance(0.4).hex(),
    700: color.luminance(0.3).hex(),
    800: color.luminance(0.2).hex(),
    900: color.luminance(0.1).hex(),
  };
};

const FETCH_TIMEOUT_MS = 4000;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/**
 * Feed sitesinin favicon'unu çeker.
 * Önce HTML <link rel="icon"> etiketlerini dener, yoksa Google Favicon API'ye düşer.
 */
export async function fetchFeedFavicon(siteUrl) {
  let origin;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return null;
  }

  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(origin, {
      signal,
      headers: { "User-Agent": "FeedTune/1.0 (feed reader)" },
    });
    const html = await res.text();

    // apple-touch-icon daha yüksek kaliteli
    const appleMatch = html.match(
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i
    );
    const iconMatch = html.match(
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i
    );

    const href = appleMatch?.[1] || iconMatch?.[1];
    if (href) {
      return new URL(href, origin).href;
    }
  } catch {
    // timeout veya network hatası — Google API'ye düş
  } finally {
    clear();
  }

  // Fallback: Google Favicon API (fetch gerektirmez, direkt URL)
  try {
    const hostname = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}

/**
 * Makale URL'sinden og:image meta etiketini çeker.
 */
export async function fetchOgImage(articleUrl) {
  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(articleUrl, {
      signal,
      headers: { "User-Agent": "FeedTune/1.0 (feed reader)" },
    });
    const html = await res.text();

    // property="og:image" content="..." veya ters sıra
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (match?.[1]) {
      return new URL(match[1], articleUrl).href;
    }
    return null;
  } catch {
    return null;
  } finally {
    clear();
  }
}

/**
 * Thumbnail'i olmayan itemlar için OG image'ları paralel olarak çeker.
 * items dizisini in-place günceller.
 */
export async function enrichItemsWithOgImages(items, concurrency = 5) {
  const missing = items.filter((item) => !item.thumbnail && item.url);
  if (missing.length === 0) return;

  for (let i = 0; i < missing.length; i += concurrency) {
    const batch = missing.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map(async (item) => {
        const ogImage = await fetchOgImage(item.url);
        if (ogImage) item.thumbnail = ogImage;
      })
    );
  }
}

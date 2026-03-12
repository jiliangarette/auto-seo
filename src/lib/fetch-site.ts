/**
 * Fetch a site's HTML through a CORS proxy.
 * Falls back gracefully if the proxy is unavailable.
 */
export async function fetchSiteHtml(url: string): Promise<{ html: string; finalUrl: string; ok: boolean }> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  // Try multiple CORS proxies in order
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy(normalizedUrl), {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const html = await res.text();
        return { html, finalUrl: normalizedUrl, ok: true };
      }
    } catch {
      // Try next proxy
    }
  }

  // Direct fetch as last resort (works for same-origin or CORS-enabled sites)
  try {
    const res = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    const html = await res.text();
    return { html, finalUrl: res.url, ok: true };
  } catch {
    return { html: '', finalUrl: normalizedUrl, ok: false };
  }
}

/**
 * Parse HTML string into a Document using DOMParser.
 */
export function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

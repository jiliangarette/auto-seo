import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch a site's HTML via our Supabase Edge Function proxy.
 * Falls back to public CORS proxies, then direct fetch.
 */
export async function fetchSiteHtml(url: string): Promise<{ html: string; finalUrl: string; ok: boolean }> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  // 1. Our own Supabase Edge Function (most reliable — no CORS issues)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/fetch-site`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ url: normalizedUrl }),
      signal: AbortSignal.timeout(20000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.html) {
        return { html: data.html, finalUrl: data.finalUrl || normalizedUrl, ok: true };
      }
    }
  } catch {
    // Fall through to public proxies
  }

  // 2. Public CORS proxies as fallback
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

  // 3. Direct fetch as last resort (same-origin or CORS-enabled sites)
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

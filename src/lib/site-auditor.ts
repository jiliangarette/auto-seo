import { openai } from '@/integrations/openai/client';
import type { AuditIssue } from '@/types/database';

export interface SiteAuditResult {
  issues: AuditIssue[];
  siteData: SiteData;
  summary: {
    critical: number;
    warning: number;
    info: number;
    score: number;
  };
}

export interface SiteData {
  url: string;
  finalUrl: string;
  statusCode: number;
  loadTimeMs: number;
  contentLength: number;
  isHttps: boolean;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasCanonical: boolean;
  canonicalUrl: string;
  hasRobotsMeta: boolean;
  robotsContent: string;
  hasViewport: boolean;
  hasCharset: boolean;
  hasOgTags: boolean;
  hasTwitterCards: boolean;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  wordCount: number;
  hasHreflang: boolean;
  hasSitemap: boolean;
  htmlSize: number;
  cssLinks: number;
  jsScripts: number;
  inlineStyles: number;
  brokenMetaTags: string[];
}

async function fetchSiteData(inputUrl: string): Promise<SiteData> {
  const normalizedUrl = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
  const startTime = performance.now();

  const response = await fetch(normalizedUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });

  const loadTimeMs = Math.round(performance.now() - startTime);
  const html = await response.text();
  const contentLength = html.length;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent?.trim() ?? '';
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';

  const h1Tags = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim() ?? '').filter(Boolean);
  const h2Tags = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim() ?? '').filter(Boolean);
  const h3Tags = Array.from(doc.querySelectorAll('h3')).map(el => el.textContent?.trim() ?? '').filter(Boolean);

  const images = doc.querySelectorAll('img');
  const imageCount = images.length;
  const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt')?.trim()).length;

  const allLinks = doc.querySelectorAll('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;
  const urlObj = new URL(response.url);
  allLinks.forEach(link => {
    const href = link.getAttribute('href') ?? '';
    if (href.startsWith('/') || href.startsWith('#') || href.includes(urlObj.hostname)) {
      internalLinks++;
    } else if (href.startsWith('http')) {
      externalLinks++;
    }
  });

  const canonical = doc.querySelector('link[rel="canonical"]');
  const hasCanonical = !!canonical;
  const canonicalUrl = canonical?.getAttribute('href') ?? '';

  const robotsMeta = doc.querySelector('meta[name="robots"]');
  const hasRobotsMeta = !!robotsMeta;
  const robotsContent = robotsMeta?.getAttribute('content') ?? '';

  const hasViewport = !!doc.querySelector('meta[name="viewport"]');
  const hasCharset = !!doc.querySelector('meta[charset]') || html.includes('charset=');

  const hasOgTags = !!doc.querySelector('meta[property^="og:"]');
  const hasTwitterCards = !!doc.querySelector('meta[name^="twitter:"]');

  const structuredDataScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const hasStructuredData = structuredDataScripts.length > 0;
  const structuredDataTypes: string[] = [];
  structuredDataScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent ?? '{}');
      if (data['@type']) structuredDataTypes.push(data['@type']);
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach((item: Record<string, string>) => {
          if (item['@type']) structuredDataTypes.push(item['@type']);
        });
      }
    } catch { /* skip invalid JSON-LD */ }
  });

  const bodyText = doc.body?.textContent ?? '';
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;

  const hasHreflang = !!doc.querySelector('link[hreflang]');

  const cssLinks = doc.querySelectorAll('link[rel="stylesheet"]').length;
  const jsScripts = doc.querySelectorAll('script[src]').length;
  const inlineStyles = doc.querySelectorAll('[style]').length;

  const brokenMetaTags: string[] = [];
  if (!title) brokenMetaTags.push('Missing title tag');
  if (title.length > 60) brokenMetaTags.push(`Title too long (${title.length} chars)`);
  if (title.length > 0 && title.length < 30) brokenMetaTags.push(`Title too short (${title.length} chars)`);
  if (!metaDesc) brokenMetaTags.push('Missing meta description');
  if (metaDesc.length > 160) brokenMetaTags.push(`Meta description too long (${metaDesc.length} chars)`);

  let hasSitemap = false;
  try {
    const sitemapUrl = `${urlObj.origin}/sitemap.xml`;
    const sitemapRes = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) });
    hasSitemap = sitemapRes.ok && (await sitemapRes.text()).includes('<urlset');
  } catch { /* sitemap not found */ }

  return {
    url: normalizedUrl,
    finalUrl: response.url,
    statusCode: response.status,
    loadTimeMs,
    contentLength,
    isHttps: response.url.startsWith('https'),
    title,
    metaDescription: metaDesc,
    h1Tags,
    h2Tags,
    h3Tags,
    imageCount,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    hasCanonical,
    canonicalUrl,
    hasRobotsMeta,
    robotsContent,
    hasViewport,
    hasCharset,
    hasOgTags,
    hasTwitterCards,
    hasStructuredData,
    structuredDataTypes,
    wordCount,
    hasHreflang,
    hasSitemap,
    htmlSize: new Blob([html]).size,
    cssLinks,
    jsScripts,
    inlineStyles,
    brokenMetaTags,
  };
}

const SYSTEM_PROMPT = `You are a technical SEO auditor. You are given REAL data fetched from a live website. Analyze the actual data provided — do NOT guess or make up issues that contradict the data.

Based on the site data, return a JSON object:

{
  "issues": [
    {
      "category": "<page-speed|mobile|meta-tags|structured-data|internal-linking|security|accessibility|content>",
      "severity": "<critical|warning|info>",
      "title": "<short issue title>",
      "description": "<what the issue is — reference actual data>",
      "recommendation": "<specific actionable fix>"
    }
  ],
  "summary": {
    "critical": <count>,
    "warning": <count>,
    "info": <count>,
    "score": <overall SEO score 0-100 based on findings>
  }
}

Rules:
- If isHttps is true, do NOT report SSL/HTTPS issues
- If hasViewport is true, do NOT report missing viewport
- If title exists and is proper length, do NOT report title issues
- Only report issues that are actually supported by the data
- Be specific — reference actual values (e.g., "Title is 73 characters, exceeds 60 char limit")
- Generate 8-15 issues based on what you actually find
- Return ONLY valid JSON`;

export async function auditSite(url: string): Promise<SiteAuditResult> {
  const siteData = await fetchSiteData(url);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this REAL site data and provide an accurate SEO audit:\n\n${JSON.stringify(siteData, null, 2)}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  const parsed = JSON.parse(text) as SiteAuditResult;
  parsed.siteData = siteData;
  return parsed;
}

import { openai } from '@/integrations/openai/client';
import { fetchSiteHtml, parseHtml } from '@/lib/fetch-site';
import { auditSite, type SiteAuditResult } from '@/lib/site-auditor';
import { generateSEOContent, type GeneratedContent } from '@/lib/content-generator';

export type OneClickStage = 'fetching' | 'auditing' | 'keywords' | 'calendar' | 'writing' | 'done' | 'error';

export interface KeywordResult {
  keyword: string;
  searchIntent: string;
  difficulty: 'low' | 'medium' | 'high';
  opportunity: string;
}

export interface CalendarEntry {
  day: number;
  title: string;
  keyword: string;
  type: 'blog' | 'guide' | 'listicle' | 'comparison' | 'case-study';
  priority: 'high' | 'medium' | 'low';
}

export interface OneClickResult {
  url: string;
  audit: SiteAuditResult | null;
  keywords: KeywordResult[];
  calendar: CalendarEntry[];
  article: GeneratedContent | null;
  errors: string[];
}

type ProgressCallback = (stage: OneClickStage, message: string) => void;

async function extractKeywords(html: string, url: string): Promise<KeywordResult[]> {
  const doc = parseHtml(html);
  const title = doc.querySelector('title')?.textContent?.trim() ?? '';
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const h1s = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim()).filter(Boolean);
  const h2s = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim()).filter(Boolean);
  const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 3000) ?? '';

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `You are an SEO keyword researcher. Analyze the site content and find 10-15 keyword opportunities. Return JSON:
{
  "keywords": [
    {
      "keyword": "<target keyword phrase>",
      "searchIntent": "<informational|transactional|navigational|commercial>",
      "difficulty": "<low|medium|high>",
      "opportunity": "<why this keyword is a good opportunity>"
    }
  ]
}
Focus on keywords the site could realistically rank for. Mix head terms and long-tail. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Site: ${url}\nTitle: ${title}\nMeta: ${metaDesc}\nH1s: ${h1s.join(', ')}\nH2s: ${h2s.join(', ')}\nContent: ${bodyText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return [];
  const parsed = JSON.parse(text);
  return parsed.keywords ?? [];
}

async function generateCalendar(keywords: KeywordResult[], url: string): Promise<CalendarEntry[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `You are an SEO content strategist. Create a 30-day content calendar based on keyword opportunities. Return JSON:
{
  "calendar": [
    {
      "day": <1-30>,
      "title": "<article title>",
      "keyword": "<target keyword>",
      "type": "<blog|guide|listicle|comparison|case-study>",
      "priority": "<high|medium|low>"
    }
  ]
}
Plan 2-3 posts per week (8-12 total). High-priority = best opportunity keywords first. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Create a 30-day content calendar for ${url} using these keyword opportunities:\n\n${JSON.stringify(keywords, null, 2)}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return [];
  const parsed = JSON.parse(text);
  return parsed.calendar ?? [];
}

export async function runOneClick(
  inputUrl: string,
  onProgress: ProgressCallback,
): Promise<OneClickResult> {
  const normalizedUrl = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
  const result: OneClickResult = {
    url: normalizedUrl,
    audit: null,
    keywords: [],
    calendar: [],
    article: null,
    errors: [],
  };

  // Stage 1: Fetch site HTML
  onProgress('fetching', 'Fetching your website...');
  let html = '';
  try {
    const fetched = await fetchSiteHtml(normalizedUrl);
    if (!fetched.ok || !fetched.html) throw new Error('Could not fetch site');
    html = fetched.html;
  } catch (err) {
    result.errors.push(`Fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    onProgress('error', 'Could not fetch your website');
    return result;
  }

  // Stage 2: Run SEO audit
  onProgress('auditing', 'Running full SEO audit...');
  try {
    result.audit = await auditSite(inputUrl);
  } catch (err) {
    result.errors.push(`Audit failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Stage 3: Extract keywords
  onProgress('keywords', 'Finding keyword opportunities...');
  try {
    result.keywords = await extractKeywords(html, normalizedUrl);
  } catch (err) {
    result.errors.push(`Keywords failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Stage 4: Generate calendar
  onProgress('calendar', 'Planning your 30-day content calendar...');
  try {
    if (result.keywords.length > 0) {
      result.calendar = await generateCalendar(result.keywords, normalizedUrl);
    }
  } catch (err) {
    result.errors.push(`Calendar failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Stage 5: Write first article
  onProgress('writing', 'Writing your first SEO article...');
  try {
    const topKeyword = result.keywords[0];
    result.article = await generateSEOContent({
      mode: 'url-audit',
      siteUrl: inputUrl,
      topic: topKeyword?.keyword ?? undefined,
      keywords: result.keywords.slice(0, 5).map(k => k.keyword),
      tone: 'professional',
      length: 'long',
    });
  } catch (err) {
    result.errors.push(`Article failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  onProgress('done', 'All done!');
  return result;
}

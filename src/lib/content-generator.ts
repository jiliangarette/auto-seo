import { openai } from '@/integrations/openai/client';

export interface GeneratedContent {
  title: string;
  metaDescription: string;
  content: string;
  seoScore: number;
  keywordsUsed: string[];
  outline: string[];
  wordCount: number;
}

export type GenerateMode = 'topic' | 'url-audit' | 'competitor';

export interface GenerateOptions {
  mode: GenerateMode;
  topic?: string;
  keywords?: string[];
  tone: string;
  length: 'short' | 'medium' | 'long';
  siteUrl?: string;
  competitorUrl?: string;
}

async function extractSiteContext(url: string): Promise<string> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  try {
    const res = await fetch(normalizedUrl, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent?.trim() ?? '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const h1s = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim()).filter(Boolean);
    const h2s = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim()).filter(Boolean);
    const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 2000) ?? '';

    return `Site: ${normalizedUrl}\nTitle: ${title}\nMeta: ${metaDesc}\nH1s: ${h1s.join(', ')}\nH2s: ${h2s.join(', ')}\nContent preview: ${bodyText}`;
  } catch {
    return `Site: ${normalizedUrl} (could not fetch — generate based on URL context)`;
  }
}

export async function generateSEOContent(options: GenerateOptions): Promise<GeneratedContent> {
  const { mode, topic, keywords, tone, length, siteUrl, competitorUrl } = options;
  const wordCount = length === 'short' ? 300 : length === 'medium' ? 600 : 1200;

  let userPrompt = '';

  if (mode === 'url-audit' && siteUrl) {
    const context = await extractSiteContext(siteUrl);
    userPrompt = `Analyze this website and write an SEO-optimized blog post that addresses gaps and opportunities found on the site. Automatically identify the best keywords based on the site's content and niche.\n\nSite data:\n${context}\n\n${topic ? `Additional focus: ${topic}` : 'Choose the most impactful topic based on the site analysis.'}`;
  } else if (mode === 'competitor' && competitorUrl) {
    const context = await extractSiteContext(competitorUrl);
    userPrompt = `Analyze this competitor's content and write a BETTER, more comprehensive SEO-optimized article that outranks them. Identify their target keywords and improve upon their content.\n\nCompetitor data:\n${context}\n\n${topic ? `Focus on: ${topic}` : 'Target the same primary topic but make it more comprehensive.'}`;
  } else {
    userPrompt = `Write SEO-optimized content about: ${topic}\n\nTarget keywords: ${(keywords ?? []).join(', ')}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert SEO content writer. Generate SEO-optimized content and return JSON:

{
  "title": "<SEO-optimized title tag, 50-60 chars>",
  "metaDescription": "<compelling meta description, 150-160 chars>",
  "content": "<the full article in markdown format>",
  "seoScore": <estimated SEO score 0-100>,
  "keywordsUsed": ["<keywords actually used in content>"],
  "outline": ["<H2 heading 1>", "<H2 heading 2>"],
  "wordCount": <actual word count>
}

Guidelines:
- Use target keywords naturally (2-3% density)
- Include H2/H3 headings with clear structure
- Write in ${tone} tone
- Target approximately ${wordCount} words
- Make content actionable and valuable
- Return ONLY valid JSON.`,
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  return JSON.parse(text) as GeneratedContent;
}

import { openai } from '@/integrations/openai/client';

interface MetaTagInput {
  pageTitle: string;
  description: string;
  keywords: string;
  pageType: string;
}

interface MetaTagResult {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  twitterCard: string;
  canonicalHint: string;
  keywords: string;
  htmlSnippet: string;
}

export async function generateMetaTags(input: MetaTagInput): Promise<MetaTagResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO expert. Generate optimized HTML meta tags. Return JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Generate SEO meta tags for:
Page title: ${input.pageTitle}
Description: ${input.description}
Keywords: ${input.keywords}
Page type: ${input.pageType}

Return JSON with these fields:
- title (optimized, max 60 chars)
- metaDescription (optimized, max 160 chars)
- ogTitle
- ogDescription
- ogType (website, article, product, etc.)
- twitterCard (summary or summary_large_image)
- canonicalHint (advice on canonical URL)
- keywords (comma-separated, optimized)
- htmlSnippet (complete HTML meta tags block ready to paste)`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as MetaTagResult;
}

import { openai } from '@/integrations/openai/client';

export interface GeneratedContent {
  title: string;
  metaDescription: string;
  content: string;
  seoScore: number;
  keywordsUsed: string[];
}

export async function generateSEOContent({
  topic,
  keywords,
  tone,
  length,
}: {
  topic: string;
  keywords: string[];
  tone: string;
  length: 'short' | 'medium' | 'long';
}): Promise<GeneratedContent> {
  const wordCount = length === 'short' ? 300 : length === 'medium' ? 600 : 1200;

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
  "keywordsUsed": ["<keywords actually used in content>"]
}

Guidelines:
- Use target keywords naturally (2-3% density)
- Include H2/H3 headings
- Write in ${tone} tone
- Target approximately ${wordCount} words
- Include internal linking suggestions as [link text](suggested-url)
- Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Write SEO-optimized content about: ${topic}\n\nTarget keywords: ${keywords.join(', ')}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  return JSON.parse(text) as GeneratedContent;
}

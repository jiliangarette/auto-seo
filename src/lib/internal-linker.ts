import { openai } from '@/integrations/openai/client';

interface LinkSuggestion {
  anchorText: string;
  targetPage: string;
  context: string;
  reason: string;
}

interface LinkingResult {
  suggestions: LinkSuggestion[];
  updatedContent: string;
}

export async function suggestInternalLinks(
  article: string,
  existingPages: string[]
): Promise<LinkingResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO expert specializing in internal linking. Analyze the article and suggest internal links to existing pages. Return JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Article content:
${article}

Existing pages on the site:
${existingPages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Return JSON with:
- suggestions: array of { anchorText, targetPage, context (sentence where anchor appears), reason }
- updatedContent: the full article with internal links added as HTML <a> tags pointing to the target pages`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as LinkingResult;
}

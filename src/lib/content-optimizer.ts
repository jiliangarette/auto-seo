import { openai } from '@/integrations/openai/client';

interface OptimizationResult {
  overallScore: number;
  keywordDensity: { current: number; recommended: number; status: string };
  readability: { score: number; level: string; suggestions: string[] };
  headingStructure: { hasH1: boolean; headingCount: number; suggestions: string[] };
  wordCount: { current: number; recommended: number; status: string };
  actionItems: { priority: 'high' | 'medium' | 'low'; action: string }[];
  optimizedContent: string;
}

export async function optimizeContent(
  content: string,
  targetKeyword: string
): Promise<OptimizationResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO content optimization expert. Analyze content and provide specific improvements. Return JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Analyze and optimize this content for the keyword "${targetKeyword}":

${content}

Return JSON with:
- overallScore: 1-100
- keywordDensity: { current (%), recommended (%), status }
- readability: { score (1-100), level (easy/moderate/difficult), suggestions[] }
- headingStructure: { hasH1 (bool), headingCount, suggestions[] }
- wordCount: { current, recommended, status }
- actionItems: [{ priority (high/medium/low), action }] — max 8 items
- optimizedContent: the full content rewritten with improvements applied`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as OptimizationResult;
}

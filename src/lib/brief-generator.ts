import { openai } from '@/integrations/openai/client';

interface ContentBrief {
  keyword: string;
  audience: string;
  title: string;
  outline: { heading: string; points: string[] }[];
  wordCountTarget: number;
  tone: string;
  competitorAngles: string[];
  questionsToAnswer: string[];
  internalLinkOpportunities: string[];
  callToAction: string;
}

export async function generateContentBrief(
  keyword: string,
  audience: string
): Promise<ContentBrief> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO content strategist. Generate detailed content briefs. Return JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Generate a content brief for:
Keyword: "${keyword}"
Target audience: "${audience}"

Return JSON:
- keyword, audience
- title: suggested article title
- outline: [{ heading, points[] }] — full article structure with 4-8 sections
- wordCountTarget: recommended word count
- tone: recommended tone
- competitorAngles: what top competitors cover (3-5 items)
- questionsToAnswer: questions the article should address (4-6)
- internalLinkOpportunities: related topics to link to (3-5)
- callToAction: suggested CTA`,
      },
    ],
  });

  const text = response.choices[0].message.content ?? '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as ContentBrief;
}

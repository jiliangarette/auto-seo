import { openai } from '@/integrations/openai/client';

interface TopicArea {
  topic: string;
  coverage: number; // 0-100
  articlesFound: string[];
  uncoveredSubtopics: string[];
  recommendedArticles: string[];
}

export interface TopicAuthorityResult {
  overallAuthority: number;
  niche: string;
  topics: TopicArea[];
  totalCoverage: number;
  topPriorities: string[];
}

export async function mapTopicAuthority(
  niche: string,
  existingContent: string[]
): Promise<TopicAuthorityResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: 'You are a topical authority expert. Map content coverage and identify gaps. Return JSON only.',
      },
      {
        role: 'user',
        content: `Map topical authority for niche: "${niche}"

Existing content/articles:
${existingContent.join('\n')}

Return JSON:
- overallAuthority: 0-100 (how well this niche is covered)
- niche: the niche analyzed
- topics: [{ topic (subtopic name), coverage (0-100), articlesFound: [matching existing articles], uncoveredSubtopics: [], recommendedArticles: [2-3 article titles to write] }]
- totalCoverage: overall % of niche covered
- topPriorities: [top 5 articles to write next to build authority]

Identify 5-10 topic areas within the niche.`,
      },
    ],
    temperature: 0.5,
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as TopicAuthorityResult;
}

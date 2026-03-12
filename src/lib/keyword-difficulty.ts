import { openai } from '@/integrations/openai/client';

interface DifficultyResult {
  keyword: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  competition: string;
  domainAuthorityNeeded: string;
  contentQualityRequired: string;
  opportunityScore: number;
  reasoning: string;
}

export async function estimateKeywordDifficulty(
  keyword: string,
  searchVolume?: number | null
): Promise<DifficultyResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO expert. Estimate keyword ranking difficulty. Return JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Estimate the SEO ranking difficulty for: "${keyword}"${searchVolume ? ` (estimated search volume: ${searchVolume})` : ''}

Return JSON:
- keyword: the keyword
- difficulty: "easy", "medium", or "hard"
- score: 1-100 (100 = hardest)
- competition: brief description of competition level
- domainAuthorityNeeded: estimated DA needed to rank
- contentQualityRequired: what kind of content is needed
- opportunityScore: 1-100 (high = good opportunity, considers volume vs difficulty)
- reasoning: 1-2 sentence explanation`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as DifficultyResult;
}

export async function batchEstimateDifficulty(
  keywords: { keyword: string; searchVolume?: number | null }[]
): Promise<DifficultyResult[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO expert. Estimate keyword ranking difficulty for multiple keywords. Return a JSON array only, no markdown.',
      },
      {
        role: 'user',
        content: `Estimate difficulty for these keywords:
${keywords.map((k, i) => `${i + 1}. "${k.keyword}"${k.searchVolume ? ` (volume: ${k.searchVolume})` : ''}`).join('\n')}

Return a JSON array where each item has:
- keyword, difficulty ("easy"/"medium"/"hard"), score (1-100), competition, domainAuthorityNeeded, contentQualityRequired, opportunityScore (1-100), reasoning`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? '[]';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as DifficultyResult[];
}

import { openai } from '@/integrations/openai/client';

interface SerpOverlapResult {
  sharedKeywords: { keyword: string; yourPosition: string; competitorPosition: string }[];
  uniqueToYou: string[];
  uniqueToCompetitor: string[];
  overlapPercentage: number;
}

interface ContentGap {
  keyword: string;
  competitorUrl: string;
  estimatedVolume: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
}

interface ContentFrequency {
  competitor: string;
  estimatedPostsPerMonth: number;
  topTopics: string[];
  contentTypes: string[];
  consistency: 'high' | 'medium' | 'low';
}

interface PositioningData {
  competitor: string;
  contentQuality: number;
  technicalSeo: number;
  contentVolume: number;
  backlinks: number;
  overallScore: number;
}

export interface CompetitiveResearchResult {
  serpOverlap: SerpOverlapResult;
  contentGaps: ContentGap[];
  contentFrequency: ContentFrequency[];
  positioning: PositioningData[];
}

export async function analyzeCompetitiveResearch(
  yourUrl: string,
  yourKeywords: string[],
  competitors: string[]
): Promise<CompetitiveResearchResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: 'You are a competitive SEO analyst. Analyze competitive landscape and return JSON only.',
      },
      {
        role: 'user',
        content: `Analyze competitive SEO landscape:

Your site: ${yourUrl}
Your keywords: ${yourKeywords.join(', ')}
Competitors: ${competitors.join(', ')}

Return JSON with:
- serpOverlap: { sharedKeywords: [{ keyword, yourPosition, competitorPosition }], uniqueToYou: [], uniqueToCompetitor: [], overlapPercentage }
- contentGaps: [{ keyword, competitorUrl, estimatedVolume, difficulty (easy/medium/hard), priority (high/medium/low) }] — max 10
- contentFrequency: [{ competitor, estimatedPostsPerMonth, topTopics: [], contentTypes: [], consistency (high/medium/low) }]
- positioning: [{ competitor, contentQuality (0-100), technicalSeo (0-100), contentVolume (0-100), backlinks (0-100), overallScore (0-100) }] — include "You" as first entry`,
      },
    ],
    temperature: 0.5,
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as CompetitiveResearchResult;
}

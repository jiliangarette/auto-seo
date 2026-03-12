import { openai } from '@/integrations/openai/client';

interface ScoringResult {
  overallScore: number;
  headingStructure: {
    score: number;
    issues: string[];
    hierarchy: string[];
  };
  keywordPlacement: {
    score: number;
    inTitle: boolean;
    inMeta: boolean;
    inFirstParagraph: boolean;
    inHeadings: boolean;
    density: number;
  };
  contentQuality: {
    score: number;
    wordCount: number;
    readabilityLevel: string;
    suggestions: string[];
  };
  checklist: { item: string; passed: boolean; priority: 'high' | 'medium' | 'low' }[];
}

export type { ScoringResult };

export async function scoreContent(
  content: string,
  targetKeyword: string
): Promise<ScoringResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an SEO content scoring expert. Score content against SERP best practices. Return JSON only.',
      },
      {
        role: 'user',
        content: `Score this content for the target keyword "${targetKeyword}":

${content.slice(0, 4000)}

Return JSON:
- overallScore: 0-100
- headingStructure: { score (0-100), issues: [], hierarchy: [H1, H2, etc found] }
- keywordPlacement: { score (0-100), inTitle (bool), inMeta (bool), inFirstParagraph (bool), inHeadings (bool), density (%) }
- contentQuality: { score (0-100), wordCount, readabilityLevel, suggestions: [] max 5 }
- checklist: [{ item, passed (bool), priority (high/medium/low) }] — 8-12 actionable items`,
      },
    ],
    temperature: 0.5,
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as ScoringResult;
}

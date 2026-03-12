import { openai } from '@/integrations/openai/client';

interface BacklinkAssessment {
  url: string;
  quality: 'excellent' | 'good' | 'moderate' | 'low' | 'toxic';
  estimatedDA: number;
  relevance: number;
  risk: 'safe' | 'caution' | 'toxic';
  reason: string;
}

interface AcquisitionOpportunity {
  type: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedImpact: 'high' | 'medium' | 'low';
}

export interface BacklinkQualityResult {
  assessments: BacklinkAssessment[];
  overallScore: number;
  toxicCount: number;
  disavowList: string[];
  opportunities: AcquisitionOpportunity[];
}

export async function analyzeBacklinkQuality(
  backlinks: { sourceUrl: string; anchorText: string }[],
  siteNiche: string
): Promise<BacklinkQualityResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: 'You are a backlink quality analyst. Assess backlink profiles and identify risks. Return JSON only.',
      },
      {
        role: 'user',
        content: `Analyze backlink quality for a site in the "${siteNiche}" niche:

Backlinks:
${backlinks.map((b) => `${b.sourceUrl} (anchor: ${b.anchorText || 'none'})`).join('\n')}

Return JSON:
- assessments: [{ url, quality (excellent/good/moderate/low/toxic), estimatedDA (0-100), relevance (0-100), risk (safe/caution/toxic), reason }]
- overallScore: 0-100 (overall backlink profile health)
- toxicCount: number of toxic/risky backlinks
- disavowList: [URLs to include in Google disavow file]
- opportunities: [{ type, description, difficulty (easy/medium/hard), expectedImpact (high/medium/low) }] — 5 backlink acquisition opportunities`,
      },
    ],
    temperature: 0.5,
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as BacklinkQualityResult;
}

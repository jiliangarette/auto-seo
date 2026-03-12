import { openai } from '@/integrations/openai/client';

export interface CompetitorComparisonResult {
  comparison: {
    yourSite: { strengths: string[]; weaknesses: string[] };
    competitor: { strengths: string[]; weaknesses: string[] };
    keywordOverlap: string[];
    keywordGaps: string[];
    contentQuality: { yours: number; theirs: number };
    technicalSEO: { yours: number; theirs: number };
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  score: number;
}

const SYSTEM_PROMPT = `You are an SEO competitive analysis expert. Compare two websites and return a JSON object:

{
  "comparison": {
    "yourSite": { "strengths": ["..."], "weaknesses": ["..."] },
    "competitor": { "strengths": ["..."], "weaknesses": ["..."] },
    "keywordOverlap": ["keywords both target"],
    "keywordGaps": ["keywords competitor ranks for but you don't"],
    "contentQuality": { "yours": <0-100>, "theirs": <0-100> },
    "technicalSEO": { "yours": <0-100>, "theirs": <0-100> }
  },
  "strengths": ["your advantages over competitor"],
  "weaknesses": ["areas where competitor beats you"],
  "opportunities": ["actionable recommendations to outrank competitor"],
  "score": <competitive position score 0-100, higher = you're winning>
}

Be specific and actionable. Return ONLY valid JSON.`;

export async function analyzeCompetitor(
  yourUrl: string,
  competitorUrl: string,
  competitorName: string,
): Promise<CompetitorComparisonResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Compare these two websites from an SEO perspective:\n\nYour site: ${yourUrl}\nCompetitor: ${competitorName} (${competitorUrl})\n\nAnalyze their likely SEO strategies, content approaches, and competitive positioning.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  return JSON.parse(text) as CompetitorComparisonResult;
}

import { openai } from '@/integrations/openai/client';

interface SpeedAuditResult {
  url: string;
  overallScore: number;
  metrics: {
    lcp: { value: string; score: 'good' | 'needs-improvement' | 'poor'; suggestion: string };
    fid: { value: string; score: 'good' | 'needs-improvement' | 'poor'; suggestion: string };
    cls: { value: string; score: 'good' | 'needs-improvement' | 'poor'; suggestion: string };
    ttfb: { value: string; score: 'good' | 'needs-improvement' | 'poor'; suggestion: string };
  };
  recommendations: { priority: 'high' | 'medium' | 'low'; category: string; action: string; impact: string }[];
}

export async function auditPageSpeed(url: string): Promise<SpeedAuditResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a web performance expert. Analyze the given URL and estimate Core Web Vitals and performance metrics based on common patterns for that type of site. Return JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Estimate Core Web Vitals and performance for: ${url}

Return JSON:
- url
- overallScore: 1-100
- metrics:
  - lcp: { value (e.g. "2.5s"), score ("good"/"needs-improvement"/"poor"), suggestion }
  - fid: { value (e.g. "100ms"), score, suggestion }
  - cls: { value (e.g. "0.1"), score, suggestion }
  - ttfb: { value (e.g. "800ms"), score, suggestion }
- recommendations: [{ priority ("high"/"medium"/"low"), category, action, impact }] — 5-8 items`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as SpeedAuditResult;
}

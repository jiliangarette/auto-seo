import { openai } from '@/integrations/openai/client';
import type { AuditIssue } from '@/types/database';

export interface SiteAuditResult {
  issues: AuditIssue[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
}

const SYSTEM_PROMPT = `You are a technical SEO auditor. Perform a comprehensive SEO audit of the given website URL and return a JSON object:

{
  "issues": [
    {
      "category": "<page-speed|mobile|meta-tags|structured-data|internal-linking|security|accessibility|content>",
      "severity": "<critical|warning|info>",
      "title": "<short issue title>",
      "description": "<what the issue is>",
      "recommendation": "<specific actionable fix>"
    }
  ],
  "summary": {
    "critical": <count>,
    "warning": <count>,
    "info": <count>
  }
}

Generate 10-20 realistic issues across all categories. Be specific and actionable. Return ONLY valid JSON.`;

export async function auditSite(url: string): Promise<SiteAuditResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Perform a comprehensive technical SEO audit for: ${url}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  return JSON.parse(text) as SiteAuditResult;
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface OutreachTarget {
  site: string;
  contactType: string;
  relevanceScore: number;
  emailTemplate: string;
  subjectLine: string;
  status: 'pending' | 'sent' | 'replied' | 'success';
}

interface OutreachResult {
  domain: string;
  niche: string;
  summary: string;
  targets: OutreachTarget[];
  campaignTips: string[];
  successMetrics: { metric: string; benchmark: string }[];
}

const statusColors: Record<string, string> = {
  pending: 'text-muted-foreground',
  sent: 'text-yellow-400',
  replied: 'text-blue-400',
  success: 'text-green-400',
};

export default function LinkBuildingOutreach() {
  const [domain, setDomain] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);

  const generate = async () => {
    if (!domain.trim() || !niche.trim()) { toast.error('Enter domain and niche'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a link building outreach expert. Return JSON only.' },
          { role: 'user', content: `Generate link building outreach campaign for:\nDomain: ${domain}\nNiche: ${niche}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "niche": "${niche}",\n  "summary": "campaign overview",\n  "targets": [\n    { "site": "target site", "contactType": "blogger|editor|webmaster", "relevanceScore": number(1-10), "emailTemplate": "personalized outreach email", "subjectLine": "email subject", "status": "pending" }\n  ],\n  "campaignTips": ["tip 1", "tip 2"],\n  "successMetrics": [\n    { "metric": "metric name", "benchmark": "expected value" }\n  ]\n}\n\nGenerate 5 outreach targets with personalized emails, 4 tips, and 3 success metrics.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Outreach campaign generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Link Building Outreach
          </h1>
          <p className="text-muted-foreground">Generate personalized outreach campaigns for link building</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Your domain (e.g., example.com)" />
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Your niche (e.g., SaaS marketing)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Generate Outreach Campaign
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Outreach Campaign: {result.domain}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Outreach Targets ({result.targets.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.targets.map((t, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{t.site}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{t.contactType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-primary">Relevance: {t.relevanceScore}/10</span>
                          <span className={`text-[9px] ${statusColors[t.status]}`}>{t.status}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-primary/80 font-medium mb-1">Subject: {t.subjectLine}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{t.emailTemplate}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Campaign Tips</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {result.campaignTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Success Metrics</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.successMetrics.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2">
                        <span className="text-xs font-medium">{m.metric}</span>
                        <span className="text-xs text-primary">{m.benchmark}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

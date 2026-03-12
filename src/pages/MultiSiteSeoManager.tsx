import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface SiteMetrics {
  domain: string;
  seoScore: number;
  organicTraffic: string;
  topKeywords: number;
  backlinks: number;
  issues: number;
  trend: 'up' | 'down' | 'stable';
}

interface MultiSiteResult {
  summary: string;
  sites: SiteMetrics[];
  benchmarks: { metric: string; best: string; worst: string; average: string }[];
  crossDomainOpportunities: string[];
  priorityActions: { domain: string; action: string; impact: string }[];
}

const trendColors: Record<string, string> = { up: 'text-green-400', down: 'text-red-400', stable: 'text-yellow-400' };

export default function MultiSiteSeoManager() {
  const [domains, setDomains] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MultiSiteResult | null>(null);

  const analyze = async () => {
    if (!domains.trim()) { toast.error('Enter domains'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a multi-site SEO management expert. Return JSON only.' },
          { role: 'user', content: `Analyze multi-site SEO:\nDomains: ${domains}\n\nReturn JSON:\n{\n  "summary": "multi-site overview",\n  "sites": [\n    { "domain": "domain.com", "seoScore": number(0-100), "organicTraffic": "monthly estimate", "topKeywords": number, "backlinks": number, "issues": number, "trend": "up"|"down"|"stable" }\n  ],\n  "benchmarks": [\n    { "metric": "metric name", "best": "best performing", "worst": "worst performing", "average": "average value" }\n  ],\n  "crossDomainOpportunities": ["opportunity 1", "opportunity 2"],\n  "priorityActions": [\n    { "domain": "domain.com", "action": "what to do", "impact": "expected impact" }\n  ]\n}\n\nGenerate metrics for each domain, 4 benchmarks, 3 opportunities, and 4 priority actions.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Multi-site analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="size-6" />
            Multi-Site SEO Manager
          </h1>
          <p className="text-muted-foreground">Manage and compare SEO across multiple domains</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="Domains (comma-separated, e.g., site1.com, site2.com, site3.com)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LayoutGrid className="size-4" />}
              Analyze All Sites
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Multi-Site Dashboard ({result.sites.length} sites)</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.sites.map((s, idx) => (
                <Card key={idx} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">{s.domain}</span>
                      <span className={`text-[9px] ${trendColors[s.trend]}`}>{s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '~'}</span>
                    </div>
                    <p className={`text-2xl font-bold ${s.seoScore >= 70 ? 'text-green-400' : s.seoScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{s.seoScore}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-muted-foreground">
                      <span>Traffic: {s.organicTraffic}</span>
                      <span>Keywords: {s.topKeywords}</span>
                      <span>Backlinks: {s.backlinks}</span>
                      <span className={s.issues > 10 ? 'text-red-400' : ''}>Issues: {s.issues}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Benchmarks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.benchmarks.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5 text-[10px]">
                      <span className="text-xs font-medium">{b.metric}</span>
                      <span className="text-green-400">Best: {b.best}</span>
                      <span className="text-muted-foreground">Avg: {b.average}</span>
                      <span className="text-red-400">Worst: {b.worst}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Priority Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.priorityActions.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary">{a.domain}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.action}</p>
                      <p className="text-[10px] text-green-400 mt-1">{a.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

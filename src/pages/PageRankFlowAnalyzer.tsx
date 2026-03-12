import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Code2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageNode {
  url: string;
  pageRankScore: number;
  internalLinks: number;
  externalLinks: number;
  linkEquity: 'high' | 'medium' | 'low';
  issue: string;
}

interface FlowResult {
  domain: string;
  summary: string;
  overallHealth: number;
  pages: PageNode[];
  bottlenecks: { page: string; issue: string; fix: string }[];
  consolidationTargets: { page: string; reason: string; action: string }[];
  optimizations: string[];
}

export default function PageRankFlowAnalyzer() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowResult | null>(null);

  const analyze = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an internal linking and PageRank flow expert. Return JSON only.' },
          { role: 'user', content: `Analyze PageRank flow for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "PageRank flow analysis overview",\n  "overallHealth": number(0-100),\n  "pages": [\n    { "url": "page URL", "pageRankScore": number(0-10), "internalLinks": number, "externalLinks": number, "linkEquity": "high"|"medium"|"low", "issue": "any PageRank flow issue" }\n  ],\n  "bottlenecks": [\n    { "page": "bottleneck page", "issue": "what's blocking flow", "fix": "how to fix" }\n  ],\n  "consolidationTargets": [\n    { "page": "page to consolidate", "reason": "why consolidate", "action": "what to do" }\n  ],\n  "optimizations": ["optimization 1", "optimization 2"]\n}\n\nGenerate 8 pages, 3 bottlenecks, 3 consolidation targets, and 4 optimizations.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('PageRank analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const equityColors: Record<string, string> = { high: 'text-green-400', medium: 'text-yellow-400', low: 'text-red-400' };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="size-6" />
            PageRank Flow Analyzer
          </h1>
          <p className="text-muted-foreground">Analyze internal PageRank distribution and identify bottlenecks</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain to analyze (e.g., example.com)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Code2 className="size-4" />}
              Analyze PageRank Flow
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.domain} PageRank Flow</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${result.overallHealth >= 70 ? 'text-green-400' : result.overallHealth >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{result.overallHealth}</p>
                    <p className="text-[9px] text-muted-foreground">Flow Health</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Page Nodes ({result.pages.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.pages.map((p, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate flex-1">{p.url}</span>
                        <span className={`text-[9px] ${equityColors[p.linkEquity]}`}>{p.linkEquity} equity</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>PR: {p.pageRankScore}/10</span>
                        <span>Internal: {p.internalLinks}</span>
                        <span>External: {p.externalLinks}</span>
                      </div>
                      {p.issue && <p className="text-[10px] text-yellow-400 mt-1">{p.issue}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Bottlenecks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.bottlenecks.map((b, idx) => (
                    <div key={idx} className="rounded-md border border-red-500/20 p-2.5">
                      <p className="text-xs font-medium">{b.page}</p>
                      <p className="text-[10px] text-red-400 mt-1">{b.issue}</p>
                      <p className="text-[10px] text-primary/80 mt-1">{b.fix}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Consolidation Targets</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.consolidationTargets.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-medium">{c.page}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
                      <p className="text-[10px] text-primary/80 mt-1">{c.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Optimizations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.optimizations.map((o, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{o}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

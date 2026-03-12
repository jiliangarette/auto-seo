import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface NewsResult {
  headline: string;
  summary: string;
  googleNewsEligibility: { criterion: string; status: string; recommendation: string }[];
  discoverEligibility: { factor: string; score: number; tip: string }[];
  structuredData: string;
  ampReadiness: { check: string; passed: boolean; fix: string }[];
  headlineVariations: { headline: string; clickRate: number }[];
}

export default function NewsSeoOptimizer() {
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NewsResult | null>(null);

  const optimize = async () => {
    if (!headline.trim()) { toast.error('Enter article headline'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a news SEO expert. Return JSON only.' },
          { role: 'user', content: `Optimize news article SEO:\nHeadline: ${headline}\n\nReturn JSON:\n{\n  "headline": "${headline}",\n  "summary": "news SEO analysis overview",\n  "googleNewsEligibility": [\n    { "criterion": "criterion name", "status": "pass/fail/warning", "recommendation": "what to do" }\n  ],\n  "discoverEligibility": [\n    { "factor": "factor name", "score": number(0-100), "tip": "improvement tip" }\n  ],\n  "structuredData": "NewsArticle schema markup as JSON-LD string",\n  "ampReadiness": [\n    { "check": "check name", "passed": true/false, "fix": "how to fix if not passed" }\n  ],\n  "headlineVariations": [\n    { "headline": "SEO-optimized headline variation", "clickRate": number(0-100) }\n  ]\n}\n\nGenerate 5 Google News criteria, 4 Discover factors, 5 AMP checks, and 5 headline variations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('News SEO optimized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            News SEO Optimizer
          </h1>
          <p className="text-muted-foreground">Optimize articles for Google News, Discover, and AMP</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Article headline (e.g., Tech Giants Report Record Q4 Earnings)" />
            <Button onClick={optimize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Optimize News SEO
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.headline}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Google News Eligibility</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.googleNewsEligibility.map((g, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{g.criterion}</span>
                        <span className={`text-[10px] font-bold ${g.status === 'pass' ? 'text-green-400' : g.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>{g.status.toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{g.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Discover Eligibility</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.discoverEligibility.map((d, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{d.factor}</span>
                        <span className={`text-[10px] font-bold ${d.score >= 70 ? 'text-green-400' : d.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{d.score}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{d.tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Headline Variations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.headlineVariations.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-medium">{h.headline}</span>
                      <span className={`text-xs font-bold ${h.clickRate >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{h.clickRate}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">AMP Readiness</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.ampReadiness.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{a.check}</span>
                        <span className={`text-[10px] font-bold ${a.passed ? 'text-green-400' : 'text-red-400'}`}>{a.passed ? 'PASS' : 'FAIL'}</span>
                      </div>
                      {!a.passed && <p className="text-[10px] text-muted-foreground mt-1">{a.fix}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">NewsArticle Schema Markup</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-[10px] text-muted-foreground bg-muted/20 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">{result.structuredData}</pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

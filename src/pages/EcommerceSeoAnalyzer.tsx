import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tags } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCheck {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  fix: string;
}

interface EcomResult {
  url: string;
  summary: string;
  overallScore: number;
  productChecks: ProductCheck[];
  categoryOptimizations: { category: string; suggestion: string }[];
  merchantReadiness: { requirement: string; status: string; action: string }[];
  recommendations: string[];
}

const statusColors: Record<string, string> = { pass: 'text-green-400', warning: 'text-yellow-400', fail: 'text-red-400' };

export default function EcommerceSeoAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EcomResult | null>(null);

  const analyze = async () => {
    if (!url.trim()) { toast.error('Enter URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an e-commerce SEO expert. Return JSON only.' },
          { role: 'user', content: `Analyze e-commerce SEO for: ${url}\n\nReturn JSON:\n{\n  "url": "${url}",\n  "summary": "e-commerce SEO overview",\n  "overallScore": number(0-100),\n  "productChecks": [\n    { "check": "check name", "status": "pass"|"warning"|"fail", "details": "what was found", "fix": "how to fix" }\n  ],\n  "categoryOptimizations": [\n    { "category": "category page type", "suggestion": "optimization suggestion" }\n  ],\n  "merchantReadiness": [\n    { "requirement": "merchant center requirement", "status": "ready|partial|missing", "action": "what to do" }\n  ],\n  "recommendations": ["rec 1", "rec 2"]\n}\n\nGenerate 8 product checks, 4 category optimizations, 4 merchant requirements, and 4 recommendations.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('E-commerce analysis complete');
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
            <Tags className="size-6" />
            E-commerce SEO Analyzer
          </h1>
          <p className="text-muted-foreground">Audit product pages, schema, and merchant center readiness</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Product or store URL (e.g., shop.example.com/product)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
              Analyze E-commerce SEO
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">E-commerce SEO Report</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <p className={`text-3xl font-bold ${result.overallScore >= 70 ? 'text-green-400' : result.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{result.overallScore}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Product Page Checks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.productChecks.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] ${statusColors[c.status]}`}>{c.status === 'pass' ? '✓' : c.status === 'warning' ? '!' : '✗'}</span>
                        <span className="text-xs font-medium">{c.check}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{c.details}</p>
                      {c.status !== 'pass' && <p className="text-[10px] text-primary/80 mt-1">{c.fix}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Category Optimizations</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.categoryOptimizations.map((c, idx) => (
                      <div key={idx} className="rounded-md border border-border/50 p-2.5">
                        <p className="text-xs font-medium">{c.category}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{c.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Merchant Center Readiness</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.merchantReadiness.map((m, idx) => (
                      <div key={idx} className="rounded-md border border-border/50 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{m.requirement}</span>
                          <span className={`text-[9px] ${m.status === 'ready' ? 'text-green-400' : m.status === 'partial' ? 'text-yellow-400' : 'text-red-400'}`}>{m.status}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{m.action}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.recommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{r}</span>
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

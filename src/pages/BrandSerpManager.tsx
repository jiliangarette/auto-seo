import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface SerpResult {
  position: number;
  title: string;
  url: string;
  type: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  owned: boolean;
}

interface BrandSerpResult {
  brand: string;
  summary: string;
  overallSentiment: string;
  ownedPercentage: number;
  results: SerpResult[];
  negativeResults: { url: string; issue: string; action: string }[];
  optimizationPlan: string[];
}

const sentimentColors: Record<string, string> = {
  positive: 'text-green-400',
  neutral: 'text-muted-foreground',
  negative: 'text-red-400',
};

export default function BrandSerpManager() {
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<BrandSerpResult | null>(null);

  const audit = async () => {
    if (!brand.trim()) { toast.error('Enter brand name'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a brand SERP optimization expert. Return JSON only.' },
          { role: 'user', content: `Audit branded SERP for: ${brand}\n\nReturn JSON:\n{\n  "brand": "${brand}",\n  "summary": "brand SERP audit overview",\n  "overallSentiment": "mostly positive|mixed|concerning",\n  "ownedPercentage": number,\n  "results": [\n    { "position": number, "title": "result title", "url": "url", "type": "website|social|review|news|directory|competitor", "sentiment": "positive"|"neutral"|"negative", "owned": boolean }\n  ],\n  "negativeResults": [\n    { "url": "negative result URL", "issue": "what's wrong", "action": "how to address" }\n  ],\n  "optimizationPlan": ["step 1", "step 2", "step 3"]\n}\n\nGenerate 10 SERP results for the brand query. Include a mix of owned and unowned results.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Brand SERP audited');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="size-6" />
            Brand SERP Manager
          </h1>
          <p className="text-muted-foreground">Audit and optimize your brand's Google search results</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name (e.g., Acme Corp)" />
            <Button onClick={audit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              Audit Brand SERP
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">"{result.brand}" SERP Audit</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{result.ownedPercentage}%</p>
                    <p className="text-[9px] text-muted-foreground">Owned Results</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">SERP Results (Page 1)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.results.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-bold text-muted-foreground w-6">#{r.position}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.url}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{r.type}</span>
                      <span className={`text-[9px] ${sentimentColors[r.sentiment] ?? ''}`}>{r.sentiment}</span>
                      {r.owned && <span className="text-[8px] px-1 py-0.5 rounded bg-green-950/30 text-green-400">owned</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {result.negativeResults.length > 0 && (
              <Card className="border-red-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Negative Results to Address</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.negativeResults.map((n, idx) => (
                      <div key={idx} className="rounded-md border border-red-500/20 p-2.5">
                        <p className="text-xs font-mono text-muted-foreground truncate">{n.url}</p>
                        <p className="text-xs text-red-400 mt-1">{n.issue}</p>
                        <p className="text-[10px] text-primary/80 mt-1">{n.action}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">SERP Domination Plan</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.optimizationPlan.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
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

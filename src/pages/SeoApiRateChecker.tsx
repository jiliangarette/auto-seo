import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface ApiEndpoint {
  endpoint: string;
  responseTime: string;
  rateLimit: string;
  crawlBudgetImpact: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface ApiResult {
  domain: string;
  summary: string;
  overallEfficiency: number;
  endpoints: ApiEndpoint[];
  rateLimitRecommendations: string[];
  performanceOptimizations: { area: string; current: string; optimized: string; benefit: string }[];
}

const impactColors: Record<string, string> = {
  low: 'text-green-400 bg-green-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  high: 'text-red-400 bg-red-950/30',
};

export default function SeoApiRateChecker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<ApiResult | null>(null);

  const check = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an API performance and crawl budget expert. Return JSON only.' },
          { role: 'user', content: `Analyze API rate limits and crawl budget for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "API rate analysis overview",\n  "overallEfficiency": number(0-100),\n  "endpoints": [\n    { "endpoint": "API endpoint path", "responseTime": "avg response time", "rateLimit": "current rate limit", "crawlBudgetImpact": "low"|"medium"|"high", "recommendation": "optimization tip" }\n  ],\n  "rateLimitRecommendations": ["recommendation 1", "recommendation 2"],\n  "performanceOptimizations": [\n    { "area": "optimization area", "current": "current state", "optimized": "target state", "benefit": "expected benefit" }\n  ]\n}\n\nGenerate 6 endpoints, 4 rate limit recommendations, and 4 performance optimizations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('API rate check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            SEO API Rate Checker
          </h1>
          <p className="text-muted-foreground">Analyze API rate limits and crawl budget impact</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain or API base URL (e.g., api.example.com)" />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Check API Rates
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.domain} API Analysis</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${result.overallEfficiency >= 70 ? 'text-green-400' : result.overallEfficiency >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{result.overallEfficiency}%</p>
                    <p className="text-[9px] text-muted-foreground">Efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Endpoints ({result.endpoints.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.endpoints.map((e, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-medium">{e.endpoint}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${impactColors[e.crawlBudgetImpact]}`}>{e.crawlBudgetImpact} impact</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Response: {e.responseTime}</span>
                        <span>Limit: {e.rateLimit}</span>
                      </div>
                      <p className="text-[10px] text-primary/80 mt-1">{e.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Optimizations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.performanceOptimizations.map((p, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-medium">{p.area}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-red-400">{p.current}</span>
                        <span className="text-primary">→</span>
                        <span className="text-green-400">{p.optimized}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{p.benefit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Rate Limit Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.rateLimitRecommendations.map((r, idx) => (
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

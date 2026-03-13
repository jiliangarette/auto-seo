import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface KeywordVolatility {
  keyword: string;
  volatilityScore: number;
  positionSwings: number;
  trend: 'stable' | 'volatile' | 'highly_volatile';
  topMovers: { domain: string; change: number }[];
}

interface VolatilityResult {
  summary: string;
  overallScore: number;
  keywords: KeywordVolatility[];
  alerts: { message: string; severity: 'info' | 'warning' | 'critical' }[];
  benchmarks: { industry: string; avgVolatility: number }[];
}

const trendColors: Record<string, string> = {
  stable: 'text-green-400',
  volatile: 'text-yellow-400',
  highly_volatile: 'text-red-400',
};

export default function SerpVolatilityMonitor() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VolatilityResult | null>(null);

  const monitor = async () => {
    if (!keywords.trim()) { toast.error('Enter keywords to monitor'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a SERP volatility analyst. Return JSON only.' },
          { role: 'user', content: `Monitor SERP volatility for:\n${keywords}\n\nReturn JSON:\n{\n  "summary": "volatility analysis overview",\n  "overallScore": number(0-100, higher = more volatile),\n  "keywords": [\n    {\n      "keyword": "keyword",\n      "volatilityScore": number(0-100),\n      "positionSwings": number,\n      "trend": "stable"|"volatile"|"highly_volatile",\n      "topMovers": [{ "domain": "domain.com", "change": number }]\n    }\n  ],\n  "alerts": [\n    { "message": "alert description", "severity": "info"|"warning"|"critical" }\n  ],\n  "benchmarks": [\n    { "industry": "industry name", "avgVolatility": number }\n  ]\n}\n\nAnalyze each keyword and generate realistic volatility data with algorithm update correlations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Volatility analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Monitoring failed');
    } finally {
      setLoading(false);
    }
  };

  const severityColors: Record<string, string> = {
    info: 'border-blue-500/20 text-blue-400',
    warning: 'border-yellow-500/20 text-yellow-400',
    critical: 'border-red-500/20 text-red-400',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            SERP Volatility Monitor
          </h1>
          <p className="text-muted-foreground">Monitor ranking fluctuations and algorithm update alerts</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to monitor (one per line)&#10;best crm software&#10;project management tools&#10;email marketing platform"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
            <Button onClick={monitor} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Monitor Volatility
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">Overall Volatility</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${result.overallScore > 70 ? 'text-red-400' : result.overallScore > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {result.overallScore}
                    </p>
                    <p className="text-[9px] text-muted-foreground">/ 100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.alerts.length > 0 && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.alerts.map((alert, idx) => (
                      <div key={idx} className={`text-xs rounded-md border p-2 ${severityColors[alert.severity] ?? ''}`}>
                        <span className="font-medium uppercase text-[9px] mr-2">[{alert.severity}]</span>
                        {alert.message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Keyword Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.keywords.map((kw, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{kw.keyword}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${trendColors[kw.trend] ?? ''}`}>
                            {kw.trend.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold">{kw.volatilityScore}/100</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 mb-2">
                        <div
                          className={`h-full rounded-full ${kw.volatilityScore > 70 ? 'bg-red-400' : kw.volatilityScore > 40 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${kw.volatilityScore}%` }}
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {kw.topMovers.map((m, mIdx) => (
                          <span key={mIdx} className="text-[10px] text-muted-foreground">
                            {m.domain} <span className={m.change > 0 ? 'text-green-400' : 'text-red-400'}>{m.change > 0 ? '+' : ''}{m.change}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Industry Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                  {result.benchmarks.map((b, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2 text-center">
                      <p className="text-lg font-bold">{b.avgVolatility}</p>
                      <p className="text-[10px] text-muted-foreground">{b.industry}</p>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface ForecastResult {
  site: string;
  summary: string;
  growth: { month: string; traffic: number; ranking: number; confidence: number }[];
  scenarios: { name: string; description: string; projectedTraffic: string; probability: string }[];
  seasonal: { quarter: string; trend: string; adjustment: string; tip: string }[];
  milestones: { milestone: string; timeline: string; requirement: string }[];
}

export default function SeoForecastingTool() {
  const [site, setSite] = useState('');
  const [currentTraffic, setCurrentTraffic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);

  const forecast = async () => {
    if (!site.trim()) { toast.error('Enter site URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO forecasting analyst. Return JSON only.' },
          { role: 'user', content: `Forecast SEO growth:\nSite: ${site}\nCurrent monthly traffic: ${currentTraffic || 'unknown'}\n\nReturn JSON:\n{\n  "site": "${site}",\n  "summary": "forecast overview",\n  "growth": [\n    { "month": "Month Year", "traffic": number, "ranking": number, "confidence": number(0-100) }\n  ],\n  "scenarios": [\n    { "name": "scenario name", "description": "what this involves", "projectedTraffic": "traffic estimate", "probability": "likelihood %" }\n  ],\n  "seasonal": [\n    { "quarter": "Q1/Q2/Q3/Q4", "trend": "up/down/stable", "adjustment": "% change", "tip": "what to do" }\n  ],\n  "milestones": [\n    { "milestone": "goal", "timeline": "when achievable", "requirement": "what's needed" }\n  ]\n}\n\nGenerate 6 months of growth data, 3 scenarios, 4 quarterly trends, and 4 milestones.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Forecast generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Forecasting failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/20">
            <BarChart3 className="size-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SEO Forecasting</h1>
            <p className="text-xs text-muted-foreground">Project traffic growth with AI-powered scenario modeling</p>
          </div>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="pt-5 pb-5 space-y-3">
            <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="Site URL (e.g., mybusiness.com)" className="bg-background/50 border-border/40" />
            <Input value={currentTraffic} onChange={(e) => setCurrentTraffic(e.target.value)} placeholder="Current monthly traffic (e.g., 5000) — optional" className="bg-background/50 border-border/40" />
            <Button onClick={forecast} disabled={loading} className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              {loading ? 'Forecasting...' : 'Generate Forecast'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-sky-500/20 bg-sky-500/5">
              <CardContent className="pt-4 pb-4">
                <h2 className="text-sm font-bold">{result.site}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Growth Trajectory</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.growth.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5 bg-background/30">
                      <span className="text-xs font-medium">{g.month}</span>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-muted-foreground">{g.traffic.toLocaleString()} visits</span>
                        <span className="text-sky-400">Rank #{g.ranking}</span>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-12 rounded-full bg-muted/30 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${g.confidence}%` }} />
                          </div>
                          <span className="text-muted-foreground">{g.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Scenarios</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.scenarios.map((s, idx) => (
                    <div key={idx} className="rounded-lg border border-border/30 p-3 bg-background/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{s.name}</span>
                        <span className="text-[10px] text-sky-400">{s.probability}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{s.description}</p>
                      <p className="text-[11px] text-foreground/70 mt-1">Projected: {s.projectedTraffic}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Seasonal Trends</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.seasonal.map((s, idx) => (
                      <div key={idx} className="rounded-lg border border-border/30 p-2.5 bg-background/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{s.quarter}</span>
                          <span className={`text-[10px] font-bold ${s.trend === 'up' ? 'text-emerald-400' : s.trend === 'down' ? 'text-red-400' : 'text-amber-400'}`}>{s.adjustment}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{s.tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Milestones</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.milestones.map((m, idx) => (
                      <div key={idx} className="rounded-lg border border-border/30 p-2.5 bg-background/30">
                        <p className="text-xs font-medium">{m.milestone}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="text-sky-400">{m.timeline}</span>
                          <span>{m.requirement}</span>
                        </div>
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

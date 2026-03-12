import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MonthForecast {
  month: string;
  conservative: number;
  moderate: number;
  aggressive: number;
}

interface ForecastResult {
  summary: string;
  currentTraffic: number;
  forecasts: MonthForecast[];
  requirements: { contentPerMonth: number; backlinksPerMonth: number; technicalFixes: number };
  milestones: { target: string; scenario: string; eta: string }[];
}

export default function SeoForecaster() {
  const [traffic, setTraffic] = useState('');
  const [target, setTarget] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);

  const forecast = async () => {
    if (!traffic.trim()) { toast.error('Enter current monthly traffic'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO growth forecasting expert. Return JSON only.' },
          { role: 'user', content: `Generate 12-month SEO traffic forecast:\nCurrent monthly traffic: ${traffic}\nGrowth target: ${target || '2x current'}\nNiche: ${niche || 'general'}\n\nReturn JSON:\n{\n  "summary": "forecast overview",\n  "currentTraffic": ${parseInt(traffic) || 5000},\n  "forecasts": [\n    { "month": "Month 1", "conservative": number, "moderate": number, "aggressive": number }\n  ],\n  "requirements": { "contentPerMonth": number, "backlinksPerMonth": number, "technicalFixes": number },\n  "milestones": [\n    { "target": "milestone description", "scenario": "conservative|moderate|aggressive", "eta": "Month X" }\n  ]\n}\n\nGenerate 12 months of forecasts and 3-4 milestones.` },
        ],
        temperature: 0.5,
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

  const exportForecast = () => {
    if (!result) return;
    const lines = ['Month,Conservative,Moderate,Aggressive'];
    result.forecasts.forEach((f) => {
      lines.push(`"${f.month}",${f.conservative},${f.moderate},${f.aggressive}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Forecast copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            SEO Forecaster
          </h1>
          <p className="text-muted-foreground">12-month traffic forecast with scenario modeling</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input value={traffic} onChange={(e) => setTraffic(e.target.value)} placeholder="Current monthly traffic" />
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Growth target (e.g., 2x)" />
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche (optional)" />
            </div>
            <Button onClick={forecast} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Generate Forecast
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Required Monthly Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-border/50 p-2 text-center">
                    <p className="text-lg font-bold">{result.requirements.contentPerMonth}</p>
                    <p className="text-[10px] text-muted-foreground">Content Pieces/mo</p>
                  </div>
                  <div className="rounded-md border border-border/50 p-2 text-center">
                    <p className="text-lg font-bold">{result.requirements.backlinksPerMonth}</p>
                    <p className="text-[10px] text-muted-foreground">Backlinks/mo</p>
                  </div>
                  <div className="rounded-md border border-border/50 p-2 text-center">
                    <p className="text-lg font-bold">{result.requirements.technicalFixes}</p>
                    <p className="text-[10px] text-muted-foreground">Technical Fixes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">12-Month Traffic Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground px-2">
                    <span className="w-16">Month</span>
                    <span className="flex-1 text-center text-blue-400">Conservative</span>
                    <span className="flex-1 text-center text-yellow-400">Moderate</span>
                    <span className="flex-1 text-center text-green-400">Aggressive</span>
                  </div>
                  {result.forecasts.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground w-16">{f.month}</span>
                      <div className="flex-1 text-center">
                        <span className="text-xs font-medium text-blue-400">{f.conservative.toLocaleString()}</span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs font-medium text-yellow-400">{f.moderate.toLocaleString()}</span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs font-medium text-green-400">{f.aggressive.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2">
                      <span className="text-xs font-bold text-primary">{m.eta}</span>
                      <span className="text-xs flex-1">{m.target}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{m.scenario}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportForecast} className="gap-1.5">
              <Copy className="size-3.5" /> Export Forecast
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

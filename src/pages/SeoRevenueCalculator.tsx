import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface Scenario {
  name: string;
  trafficIncrease: string;
  conversionLift: string;
  projectedRevenue: string;
  roi: string;
  timeline: string;
}

interface GrowthMonth {
  month: string;
  traffic: string;
  revenue: string;
  cumulative: string;
}

interface RevenueResult {
  summary: string;
  currentRevenue: string;
  projectedRevenue: string;
  scenarios: Scenario[];
  monthlyGrowth: GrowthMonth[];
  recommendations: string[];
}

export default function SeoRevenueCalculator() {
  const [traffic, setTraffic] = useState('');
  const [convRate, setConvRate] = useState('');
  const [aov, setAov] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RevenueResult | null>(null);

  const calculate = async () => {
    if (!traffic.trim() || !convRate.trim() || !aov.trim()) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO revenue projection expert. Return JSON only.' },
          { role: 'user', content: `Calculate SEO revenue projections:\nMonthly Traffic: ${traffic}\nConversion Rate: ${convRate}%\nAverage Order Value: $${aov}\n\nReturn JSON:\n{\n  "summary": "revenue projection overview",\n  "currentRevenue": "current monthly revenue estimate",\n  "projectedRevenue": "projected monthly revenue after SEO improvements",\n  "scenarios": [\n    { "name": "Conservative|Moderate|Aggressive", "trafficIncrease": "% increase", "conversionLift": "% lift", "projectedRevenue": "monthly revenue", "roi": "expected ROI", "timeline": "time to achieve" }\n  ],\n  "monthlyGrowth": [\n    { "month": "Month 1", "traffic": "traffic estimate", "revenue": "monthly revenue", "cumulative": "cumulative revenue" }\n  ],\n  "recommendations": ["rec 1", "rec 2", "rec 3"]\n}\n\nGenerate 3 scenarios, 6 months of growth projections, and 4 recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Revenue projected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            SEO Revenue Calculator
          </h1>
          <p className="text-muted-foreground">Project revenue from SEO improvements</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={traffic} onChange={(e) => setTraffic(e.target.value)} placeholder="Monthly organic traffic (e.g., 10000)" type="number" />
            <Input value={convRate} onChange={(e) => setConvRate(e.target.value)} placeholder="Conversion rate % (e.g., 2.5)" type="number" />
            <Input value={aov} onChange={(e) => setAov(e.target.value)} placeholder="Average order value $ (e.g., 85)" type="number" />
            <Button onClick={calculate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Calculate Revenue
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">Revenue Projection</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current: {result.currentRevenue}</p>
                    <p className="text-lg font-bold text-green-400">{result.projectedRevenue}</p>
                    <p className="text-[9px] text-muted-foreground">Projected Monthly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.scenarios.map((s, idx) => (
                <Card key={idx} className={idx === 1 ? 'border-primary/30' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-primary">{s.projectedRevenue}</p>
                    <div className="space-y-1 mt-2 text-[10px] text-muted-foreground">
                      <p>Traffic: +{s.trafficIncrease}</p>
                      <p>Conversion: +{s.conversionLift}</p>
                      <p>ROI: {s.roi}</p>
                      <p>Timeline: {s.timeline}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Growth Projections</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.monthlyGrowth.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-bold text-primary">{m.month}</span>
                      <span className="text-[10px] text-muted-foreground">{m.traffic} visits</span>
                      <span className="text-xs font-medium">{m.revenue}</span>
                      <span className="text-[10px] text-green-400">{m.cumulative} total</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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

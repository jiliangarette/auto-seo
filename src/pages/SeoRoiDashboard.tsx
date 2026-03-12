import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MonthData {
  month: string;
  traffic: number;
  conversions: number;
  revenue: number;
  seoCost: number;
  roi: number;
}

interface RoiResult {
  summary: string;
  totalRoi: number;
  cpa: number;
  months: MonthData[];
  projections: { nextQuarter: string; trend: string };
}

export default function SeoRoiDashboard() {
  const [traffic, setTraffic] = useState('');
  const [convRate, setConvRate] = useState('');
  const [revenue, setRevenue] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoiResult | null>(null);

  const calculate = async () => {
    if (!traffic.trim()) { toast.error('Enter monthly traffic'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO analytics expert. Return JSON only.' },
          { role: 'user', content: `Calculate SEO ROI:\nMonthly organic traffic: ${traffic}\nConversion rate: ${convRate || '2%'}\nAvg revenue per conversion: $${revenue || '50'}\nMonthly SEO cost: $${cost || '2000'}\n\nReturn JSON:\n{\n  "summary": "ROI analysis overview",\n  "totalRoi": number (percentage),\n  "cpa": number (cost per acquisition in dollars),\n  "months": [\n    { "month": "Month Year", "traffic": number, "conversions": number, "revenue": number, "seoCost": number, "roi": number }\n  ],\n  "projections": { "nextQuarter": "projected growth summary", "trend": "up"|"stable"|"down" }\n}\n\nGenerate 6 months of data showing realistic growth trends.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('ROI calculated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!result) return;
    const lines = ['Month,Traffic,Conversions,Revenue,SEO Cost,ROI %'];
    result.months.forEach((m) => {
      lines.push(`"${m.month}",${m.traffic},${m.conversions},$${m.revenue},$${m.seoCost},${m.roi}%`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('ROI report copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            SEO ROI Dashboard
          </h1>
          <p className="text-muted-foreground">Calculate ROI with cost-per-acquisition and trend projections</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input value={traffic} onChange={(e) => setTraffic(e.target.value)} placeholder="Monthly organic traffic (e.g., 10000)" />
              <Input value={convRate} onChange={(e) => setConvRate(e.target.value)} placeholder="Conversion rate (e.g., 2%)" />
              <Input value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="Avg revenue per conversion ($)" />
              <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Monthly SEO cost ($)" />
            </div>
            <Button onClick={calculate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Calculate ROI
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-primary/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-primary">{result.totalRoi}%</p>
                  <p className="text-[10px] text-muted-foreground">Total ROI</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">${result.cpa.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Cost Per Acquisition</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.projections.trend === 'up' ? 'text-green-400' : result.projections.trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {result.projections.trend === 'up' ? 'Upward' : result.projections.trend === 'down' ? 'Downward' : 'Stable'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Trend</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">{result.projections.nextQuarter}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.months.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{m.month}</span>
                      <div className="flex-1 grid grid-cols-4 gap-2 text-xs text-center">
                        <div>
                          <p className="font-medium">{m.traffic.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">Traffic</p>
                        </div>
                        <div>
                          <p className="font-medium">{m.conversions}</p>
                          <p className="text-[9px] text-muted-foreground">Conversions</p>
                        </div>
                        <div>
                          <p className="font-medium text-green-400">${m.revenue.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">Revenue</p>
                        </div>
                        <div>
                          <p className={`font-medium ${m.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{m.roi}%</p>
                          <p className="text-[9px] text-muted-foreground">ROI</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportReport} className="gap-1.5">
              <Copy className="size-3.5" /> Export ROI Report
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

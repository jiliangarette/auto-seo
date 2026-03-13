import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface RoiResult {
  campaign: string;
  summary: string;
  cpcEstimates: { keyword: string; cpc: string; monthlyClicks: number; cost: string }[];
  channelAttribution: { channel: string; revenue: string; roi: string; share: number }[];
  monthlyTrends: { month: string; spend: string; revenue: string; roi: string }[];
  projections: { metric: string; current: string; projected: string; change: string }[];
}

export default function SeoRoiDashboard() {
  const [campaign, setCampaign] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoiResult | null>(null);

  const analyze = async () => {
    if (!campaign.trim() || !budget.trim()) { toast.error('Enter campaign and budget'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO ROI analyst. Return JSON only.' },
          { role: 'user', content: `Analyze SEO ROI:\nCampaign: ${campaign}\nMonthly Budget: ${budget}\n\nReturn JSON:\n{\n  "campaign": "${campaign}",\n  "summary": "ROI analysis overview",\n  "cpcEstimates": [\n    { "keyword": "keyword", "cpc": "$X.XX", "monthlyClicks": number, "cost": "$X" }\n  ],\n  "channelAttribution": [\n    { "channel": "channel name", "revenue": "$X", "roi": "X%", "share": number(0-100) }\n  ],\n  "monthlyTrends": [\n    { "month": "Month", "spend": "$X", "revenue": "$X", "roi": "X%" }\n  ],\n  "projections": [\n    { "metric": "metric name", "current": "value", "projected": "value", "change": "+X%" }\n  ]\n}\n\nGenerate 6 keywords, 4 channels, 6 months of trends, and 4 projections.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('ROI analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            SEO ROI Dashboard
          </h1>
          <p className="text-muted-foreground">Calculate and visualize SEO campaign return on investment</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Campaign name (e.g., Q1 Content Marketing)" />
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Monthly budget (e.g., $5,000)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Analyze ROI
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.campaign}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">CPC Estimates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.cpcEstimates.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-medium">{c.keyword}</span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-primary">{c.cpc}/click</span>
                        <span className="text-muted-foreground">{c.monthlyClicks} clicks</span>
                        <span className="font-bold">{c.cost}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Channel Attribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.channelAttribution.map((ch, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{ch.channel}</span>
                        <span className={`text-xs font-bold ${parseFloat(ch.roi) > 100 ? 'text-green-400' : 'text-yellow-400'}`}>{ch.roi} ROI</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>Revenue: {ch.revenue}</span>
                        <span>Share: {ch.share}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Trends</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.monthlyTrends.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-medium">{m.month}</span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-muted-foreground">Spend: {m.spend}</span>
                        <span className="text-primary">Rev: {m.revenue}</span>
                        <span className="font-bold">{m.roi}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Projections</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.projections.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-medium">{p.metric}</span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-muted-foreground">{p.current}</span>
                        <span className="text-primary">{p.projected}</span>
                        <span className="font-bold text-green-400">{p.change}</span>
                      </div>
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

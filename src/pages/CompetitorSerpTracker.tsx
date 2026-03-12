import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface PositionData {
  keyword: string;
  yourPosition: number | null;
  competitors: { domain: string; position: number; change: number }[];
}

interface TrackerResult {
  keywords: PositionData[];
  competitorDomains: string[];
  alerts: { keyword: string; competitor: string; change: string }[];
  summary: string;
}

export default function CompetitorSerpTracker() {
  const [keywords, setKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackerResult | null>(null);

  const track = async () => {
    if (!keywords.trim()) { toast.error('Enter keywords'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a SERP tracking expert. Return JSON only.' },
          { role: 'user', content: `Track competitor SERP positions for:\nKeywords:\n${keywords}\nCompetitors:\n${competitors || 'auto-detect top competitors'}\n\nReturn JSON:\n{\n  "keywords": [\n    {\n      "keyword": "keyword",\n      "yourPosition": number|null,\n      "competitors": [\n        { "domain": "competitor.com", "position": number(1-100), "change": number (positive=up, negative=down) }\n      ]\n    }\n  ],\n  "competitorDomains": ["competitor1.com", "competitor2.com"],\n  "alerts": [\n    { "keyword": "keyword", "competitor": "domain", "change": "moved up 5 positions" }\n  ],\n  "summary": "overview"\n}\n\nTrack 3-4 competitor domains across all keywords. Generate 3-4 alerts for significant changes.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('SERP positions tracked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  const changeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="size-3 text-green-400" />;
    if (change < 0) return <TrendingDown className="size-3 text-red-400" />;
    return <Minus className="size-3 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            Competitor SERP Tracker
          </h1>
          <p className="text-muted-foreground">Track competitor positions with change alerts and trends</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to track (one per line)&#10;best project management software&#10;crm for small business&#10;email marketing platform"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
            <textarea
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Competitor domains (optional, one per line)&#10;competitor1.com&#10;competitor2.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
            />
            <Button onClick={track} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Track Positions
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

            {result.alerts.length > 0 && (
              <Card className="border-yellow-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Position Change Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.alerts.map((alert, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs rounded-md border border-yellow-500/20 p-2">
                        <TrendingUp className="size-3.5 text-yellow-400 shrink-0" />
                        <span className="font-medium">{alert.keyword}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-muted-foreground">{alert.competitor}: {alert.change}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.keywords.map((kw, kwIdx) => (
              <Card key={kwIdx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{kw.keyword}</CardTitle>
                    {kw.yourPosition && (
                      <span className="text-xs font-medium text-primary">You: #{kw.yourPosition}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {kw.competitors.sort((a, b) => a.position - b.position).map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-6">#{comp.position}</span>
                          <span className="text-sm">{comp.domain}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {changeIcon(comp.change)}
                          <span className={`text-xs font-medium ${comp.change > 0 ? 'text-green-400' : comp.change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {comp.change > 0 ? `+${comp.change}` : comp.change === 0 ? '—' : comp.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

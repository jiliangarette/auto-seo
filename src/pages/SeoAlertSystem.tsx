import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface AlertResult {
  site: string;
  summary: string;
  alerts: { metric: string; severity: string; current: string; threshold: string; change: string }[];
  rankingDrops: { keyword: string; previousRank: number; currentRank: number; change: number; page: string }[];
  crawlErrors: { url: string; errorType: string; severity: string; fix: string }[];
  actions: { alert: string; priority: string; action: string; deadline: string }[];
}

export default function SeoAlertSystem() {
  const [site, setSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AlertResult | null>(null);

  const analyze = async () => {
    if (!site.trim()) { toast.error('Enter site URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO monitoring expert. Return JSON only.' },
          { role: 'user', content: `Generate SEO alerts for: ${site}\n\nReturn JSON:\n{\n  "site": "${site}",\n  "summary": "alert system overview",\n  "alerts": [\n    { "metric": "metric name", "severity": "critical/warning/info", "current": "current value", "threshold": "threshold value", "change": "change description" }\n  ],\n  "rankingDrops": [\n    { "keyword": "keyword", "previousRank": number, "currentRank": number, "change": number, "page": "affected page" }\n  ],\n  "crawlErrors": [\n    { "url": "url path", "errorType": "error type", "severity": "high/medium/low", "fix": "how to fix" }\n  ],\n  "actions": [\n    { "alert": "alert name", "priority": "urgent/high/medium/low", "action": "recommended action", "deadline": "suggested timeframe" }\n  ]\n}\n\nGenerate 5 alerts, 5 ranking drops, 4 crawl errors, and 5 actions.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Alerts generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Alert generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="size-6" />
            SEO Alert System
          </h1>
          <p className="text-muted-foreground">Monitor SEO metrics and get alerted on critical changes</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="Site URL (e.g., example.com)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Generate Alerts
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.site}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Active Alerts</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.alerts.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{a.metric}</span>
                        <span className={`text-[10px] font-bold ${a.severity === 'critical' ? 'text-red-400' : a.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>{a.severity.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>Current: {a.current}</span>
                        <span>Threshold: {a.threshold}</span>
                        <span>{a.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ranking Drops</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.rankingDrops.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div>
                        <span className="text-xs font-medium">{r.keyword}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{r.page}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">#{r.previousRank}</span>
                        <span>→</span>
                        <span className="text-red-400 font-bold">#{r.currentRank}</span>
                        <span className="text-red-400">({r.change > 0 ? '+' : ''}{r.change})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Crawl Errors</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.crawlErrors.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{c.url}</span>
                        <span className={`text-[10px] font-bold ${c.severity === 'high' ? 'text-red-400' : c.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{c.errorType}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{c.fix}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.actions.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{a.alert}</span>
                        <span className={`text-[10px] font-bold ${a.priority === 'urgent' ? 'text-red-400' : a.priority === 'high' ? 'text-orange-400' : a.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{a.priority.toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{a.action}</p>
                      <p className="text-[10px] text-primary/80 mt-0.5">{a.deadline}</p>
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

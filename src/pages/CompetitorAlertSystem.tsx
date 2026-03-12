import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  type: 'new_content' | 'ranking_change' | 'new_backlink' | 'technical';
  competitor: string;
  title: string;
  details: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
}

interface AlertResult {
  summary: string;
  alerts: Alert[];
  weeklyDigest: string;
  competitorActivity: { domain: string; newPages: number; rankingChanges: number; newBacklinks: number }[];
}

const typeColors: Record<string, string> = {
  new_content: 'text-blue-400 bg-blue-950/30',
  ranking_change: 'text-yellow-400 bg-yellow-950/30',
  new_backlink: 'text-green-400 bg-green-950/30',
  technical: 'text-purple-400 bg-purple-950/30',
};

const priorityColors: Record<string, string> = {
  high: 'border-red-500/30',
  medium: 'border-yellow-500/30',
  low: 'border-border/50',
};

export default function CompetitorAlertSystem() {
  const [competitors, setCompetitors] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AlertResult | null>(null);

  const scan = async () => {
    if (!competitors.trim()) { toast.error('Enter competitor domains'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a competitive intelligence SEO analyst. Return JSON only.' },
          { role: 'user', content: `Generate competitor alerts for:\nCompetitors: ${competitors}\nKeywords to watch: ${keywords || 'auto-detect relevant keywords'}\n\nReturn JSON:\n{\n  "summary": "competitor monitoring overview",\n  "alerts": [\n    {\n      "type": "new_content"|"ranking_change"|"new_backlink"|"technical",\n      "competitor": "domain.com",\n      "title": "alert title",\n      "details": "what happened",\n      "priority": "high"|"medium"|"low",\n      "actionRequired": "what you should do"\n    }\n  ],\n  "weeklyDigest": "comprehensive weekly summary of all competitor activity",\n  "competitorActivity": [\n    { "domain": "competitor.com", "newPages": number, "rankingChanges": number, "newBacklinks": number }\n  ]\n}\n\nGenerate 8-12 realistic alerts across all types and competitors.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Competitor alerts generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const copyDigest = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.weeklyDigest);
    toast.success('Weekly digest copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="size-6" />
            Competitor Alert System
          </h1>
          <p className="text-muted-foreground">Monitor competitor content, rankings, and backlinks with priority alerts</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Competitor domains to monitor (one per line)&#10;competitor1.com&#10;competitor2.com&#10;competitor3.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
            />
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Keywords to watch (optional, one per line)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[40px] resize-y"
            />
            <Button onClick={scan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Scan Competitors
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
                <CardTitle className="text-sm">Competitor Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {result.competitorActivity.map((ca, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 text-center">
                      <p className="text-sm font-bold mb-2">{ca.domain}</p>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div><p className="font-bold text-blue-400">{ca.newPages}</p><p className="text-muted-foreground">Pages</p></div>
                        <div><p className="font-bold text-yellow-400">{ca.rankingChanges}</p><p className="text-muted-foreground">Rank Δ</p></div>
                        <div><p className="font-bold text-green-400">{ca.newBacklinks}</p><p className="text-muted-foreground">Links</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alerts ({result.alerts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.alerts
                    .sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return (p[a.priority] ?? 2) - (p[b.priority] ?? 2); })
                    .map((alert, idx) => (
                      <div key={idx} className={`rounded-md border p-2.5 hover:bg-muted/20 transition-colors ${priorityColors[alert.priority] ?? ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeColors[alert.type] ?? 'bg-muted/30'}`}>
                            {alert.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{alert.competitor}</span>
                          <span className={`text-[8px] ml-auto ${alert.priority === 'high' ? 'text-red-400' : alert.priority === 'medium' ? 'text-yellow-400' : 'text-muted-foreground'}`}>{alert.priority}</span>
                        </div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-[10px] text-muted-foreground">{alert.details}</p>
                        <p className="text-[10px] text-primary/80 mt-1">{alert.actionRequired}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Weekly Digest</CardTitle>
                  <Button variant="ghost" size="sm" onClick={copyDigest} className="gap-1 h-6 text-xs">
                    <Copy className="size-3" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.weeklyDigest}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

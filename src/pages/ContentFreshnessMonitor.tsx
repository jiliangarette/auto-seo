import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FreshnessItem {
  url: string;
  title: string;
  ageStatus: 'fresh' | 'aging' | 'stale' | 'outdated';
  lastUpdated: string;
  relevanceScore: number;
  refreshPriority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

interface FreshnessResult {
  domain: string;
  summary: string;
  overallFreshness: number;
  items: FreshnessItem[];
  schedule: { period: string; action: string; pages: number }[];
}

const statusColors: Record<string, string> = {
  fresh: 'text-green-400',
  aging: 'text-yellow-400',
  stale: 'text-orange-400',
  outdated: 'text-red-400',
};

export default function ContentFreshnessMonitor() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreshnessResult | null>(null);

  const analyze = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content freshness analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze content freshness for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "freshness overview",\n  "overallFreshness": number(0-100),\n  "items": [\n    { "url": "page URL", "title": "page title", "ageStatus": "fresh"|"aging"|"stale"|"outdated", "lastUpdated": "estimated date", "relevanceScore": number(0-100), "refreshPriority": "critical"|"high"|"medium"|"low", "recommendation": "what to update" }\n  ],\n  "schedule": [\n    { "period": "this week|this month|next quarter", "action": "what to do", "pages": number }\n  ]\n}\n\nGenerate 8 content items and 3 schedule entries.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Freshness analysis complete');
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
            <Clock className="size-6" />
            Content Freshness Monitor
          </h1>
          <p className="text-muted-foreground">Monitor content staleness and schedule refreshes</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain to monitor (e.g., example.com)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />}
              Analyze Freshness
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.domain} Freshness Report</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${result.overallFreshness > 70 ? 'text-green-400' : result.overallFreshness > 40 ? 'text-yellow-400' : 'text-red-400'}`}>{result.overallFreshness}%</p>
                    <p className="text-[9px] text-muted-foreground">Overall Freshness</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Content Items ({result.items.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate flex-1">{item.title}</span>
                        <span className={`text-[9px] font-medium ml-2 ${statusColors[item.ageStatus]}`}>{item.ageStatus}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] text-muted-foreground">Updated: {item.lastUpdated}</span>
                        <span className="text-[9px] text-muted-foreground">Relevance: {item.relevanceScore}%</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${item.refreshPriority === 'critical' ? 'bg-red-950/30 text-red-400' : item.refreshPriority === 'high' ? 'bg-orange-950/30 text-orange-400' : item.refreshPriority === 'medium' ? 'bg-yellow-950/30 text-yellow-400' : 'bg-muted/30 text-muted-foreground'}`}>{item.refreshPriority}</span>
                      </div>
                      <p className="text-[10px] text-primary/80 mt-1">{item.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Refresh Schedule</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.schedule.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <div>
                        <span className="text-xs font-bold text-primary">{s.period}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.action}</p>
                      </div>
                      <span className="text-sm font-bold">{s.pages} pages</span>
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

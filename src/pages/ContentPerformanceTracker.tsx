import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ContentPerf {
  url: string;
  title: string;
  traffic: number;
  ranking: number;
  conversions: number;
  trend: 'up' | 'stable' | 'down';
  category: 'top' | 'average' | 'underperforming';
  optimization: string;
}

interface PerfResult {
  summary: string;
  content: ContentPerf[];
  insights: string[];
  priorities: { url: string; action: string; expectedImpact: string }[];
}

const categoryColors: Record<string, string> = {
  top: 'text-green-400 bg-green-950/30',
  average: 'text-yellow-400 bg-yellow-950/30',
  underperforming: 'text-red-400 bg-red-950/30',
};

export default function ContentPerformanceTracker() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<PerfResult | null>(null);

  const track = async () => {
    if (!urls.trim()) { toast.error('Enter content URLs'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content performance analyst. Return JSON only.' },
          { role: 'user', content: `Track content performance for:\n${urls}\n\nReturn JSON:\n{\n  "summary": "performance overview",\n  "content": [\n    {\n      "url": "URL",\n      "title": "page title",\n      "traffic": number,\n      "ranking": number,\n      "conversions": number,\n      "trend": "up"|"stable"|"down",\n      "category": "top"|"average"|"underperforming",\n      "optimization": "specific improvement suggestion"\n    }\n  ],\n  "insights": ["insight 1", "insight 2"],\n  "priorities": [\n    { "url": "URL", "action": "what to do", "expectedImpact": "projected improvement" }\n  ]\n}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Performance tracked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!result) return;
    const lines = ['URL,Title,Traffic,Ranking,Conversions,Trend,Category,Optimization'];
    result.content.forEach((c) => {
      lines.push(`"${c.url}","${c.title}",${c.traffic},${c.ranking},${c.conversions},"${c.trend}","${c.category}","${c.optimization}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Performance data copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            Content Performance Tracker
          </h1>
          <p className="text-muted-foreground">Track content KPIs with trends and optimization priorities</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter content URLs to track (one per line)&#10;https://example.com/blog/post-1&#10;https://example.com/guides/guide-1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
            <Button onClick={track} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Track Performance
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

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Performance ({result.content.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.content.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${categoryColors[c.category] ?? 'bg-muted/30'}`}>{c.category}</span>
                        <span className="text-sm font-medium truncate flex-1">{c.title}</span>
                        <span className={`text-xs ${c.trend === 'up' ? 'text-green-400' : c.trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {c.trend === 'up' ? '↑' : c.trend === 'down' ? '↓' : '→'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-muted-foreground">
                        <span>Traffic: {c.traffic.toLocaleString()}</span>
                        <span>Rank: #{c.ranking}</span>
                        <span>Conv: {c.conversions}</span>
                      </div>
                      <p className="text-[10px] text-primary/80 mt-1">{c.optimization}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimization Priorities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.priorities.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-md border border-border/50 p-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <div className="min-w-0">
                        <p className="font-medium">{p.action}</p>
                        <p className="text-[10px] text-green-400/70">{p.expectedImpact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportData} className="gap-1.5">
              <Copy className="size-3.5" /> Export Data
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

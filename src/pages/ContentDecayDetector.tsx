import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DecayItem {
  url: string;
  title: string;
  decayRate: number;
  peakTraffic: number;
  currentTraffic: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  estimatedRecovery: number;
}

interface DecayResult {
  summary: string;
  items: DecayItem[];
  totalTrafficLost: number;
  recoverableTraffic: number;
}

const priorityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-950/30',
  high: 'text-orange-400 bg-orange-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-green-400 bg-green-950/30',
};

export default function ContentDecayDetector() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecayResult | null>(null);

  const detect = async () => {
    if (!urls.trim()) { toast.error('Enter URLs to analyze'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a content performance analyst. Return JSON only.' },
          { role: 'user', content: `Analyze content decay for these URLs:\n${urls}\n\nReturn JSON:\n{\n  "summary": "content decay analysis overview",\n  "items": [\n    {\n      "url": "page URL",\n      "title": "page title",\n      "decayRate": number (percentage decline),\n      "peakTraffic": number (monthly visits at peak),\n      "currentTraffic": number (current monthly visits),\n      "priority": "critical"|"high"|"medium"|"low",\n      "recommendation": "specific refresh action",\n      "estimatedRecovery": number (percentage of lost traffic recoverable)\n    }\n  ],\n  "totalTrafficLost": number,\n  "recoverableTraffic": number\n}\n\nAnalyze each URL and generate realistic decay metrics and refresh recommendations.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content decay analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!result) return;
    const lines = ['URL,Title,Decay Rate,Peak Traffic,Current Traffic,Priority,Recommendation'];
    result.items.forEach((i) => {
      lines.push(`"${i.url}","${i.title}",${i.decayRate}%,${i.peakTraffic},${i.currentTraffic},"${i.priority}","${i.recommendation}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Decay report copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="size-6" />
            Content Decay Detector
          </h1>
          <p className="text-muted-foreground">Detect content losing rankings and get refresh recommendations</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter URLs to analyze (one per line)&#10;https://example.com/blog/old-post&#10;https://example.com/guide/2024-trends"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
            <Button onClick={detect} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />}
              Detect Decay
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-red-500/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.totalTrafficLost.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Traffic Lost</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.recoverableTraffic.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Recoverable Traffic</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Decaying Content ({result.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.items
                    .sort((a, b) => b.decayRate - a.decayRate)
                    .map((item, idx) => (
                      <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${priorityColors[item.priority] ?? 'bg-muted/30'}`}>{item.priority}</span>
                          <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                          <span className="text-xs font-bold text-red-400">-{item.decayRate}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span>Peak: {item.peakTraffic.toLocaleString()}/mo</span>
                          <span>Now: {item.currentTraffic.toLocaleString()}/mo</span>
                          <span className="text-green-400">Recovery: ~{item.estimatedRecovery}%</span>
                        </div>
                        <p className="text-xs text-primary/80">{item.recommendation}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportReport} className="gap-1.5">
              <Copy className="size-3.5" /> Export Decay Report
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

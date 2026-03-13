import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface Widget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'action';
  value: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
  priority: 'high' | 'medium' | 'low';
}

interface DashboardResult {
  domain: string;
  summary: string;
  widgets: Widget[];
  quickActions: { label: string; description: string }[];
  layout: string;
}

const trendIcons: Record<string, string> = { up: '+', down: '-', stable: '~' };
const trendColors: Record<string, string> = { up: 'text-green-400', down: 'text-red-400', stable: 'text-yellow-400' };

export default function SeoDashboardWidgets() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DashboardResult | null>(null);

  const generate = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO dashboard design expert. Return JSON only.' },
          { role: 'user', content: `Generate an SEO dashboard widget layout for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "dashboard overview",\n  "widgets": [\n    { "id": "w1", "title": "widget title", "type": "metric"|"chart"|"list"|"action", "value": "display value", "description": "what this shows", "trend": "up"|"down"|"stable", "priority": "high"|"medium"|"low" }\n  ],\n  "quickActions": [\n    { "label": "action name", "description": "what it does" }\n  ],\n  "layout": "recommended layout description"\n}\n\nGenerate 8 widgets covering: organic traffic, keyword rankings, backlinks, page speed, content score, crawl errors, top pages, and competitor gap.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Dashboard generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="size-6" />
            SEO Dashboard Widgets
          </h1>
          <p className="text-muted-foreground">Customizable widget-based SEO dashboard</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain (e.g., example.com)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LayoutGrid className="size-4" />}
              Generate Dashboard
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.domain} Dashboard</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                <p className="text-[10px] text-primary/60 mt-1">{result.layout}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {result.widgets.map((w) => (
                <Card key={w.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{w.type}</span>
                      <span className={`text-xs font-bold ${trendColors[w.trend] ?? ''}`}>{trendIcons[w.trend]}</span>
                    </div>
                    <p className="text-lg font-bold">{w.value}</p>
                    <p className="text-xs font-medium mt-1">{w.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{w.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.quickActions.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors cursor-pointer">
                      <p className="text-xs font-medium">{a.label}</p>
                      <p className="text-[10px] text-muted-foreground">{a.description}</p>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2, Copy, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarItem {
  day: number;
  date: string;
  title: string;
  type: 'blog' | 'video' | 'social' | 'email' | 'infographic' | 'podcast';
  keyword: string;
  notes: string;
}

interface CalendarResult {
  month: string;
  items: CalendarItem[];
  typeMix: { type: string; count: number; percentage: number }[];
  summary: string;
}

const typeColors: Record<string, string> = {
  blog: 'text-blue-400 bg-blue-950/30',
  video: 'text-red-400 bg-red-950/30',
  social: 'text-purple-400 bg-purple-950/30',
  email: 'text-green-400 bg-green-950/30',
  infographic: 'text-orange-400 bg-orange-950/30',
  podcast: 'text-pink-400 bg-pink-950/30',
};

export default function ContentCalendarAi() {
  const [siteUrl, setSiteUrl] = useSiteUrlInput();
  const [goals, setGoals] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalendarResult | null>(null);

  const generate = async () => {
    if (!goals.trim()) { toast.error('Enter content goals'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content marketing strategist. Return JSON only.' },
          { role: 'user', content: `Generate a 30-day content calendar:\nSite: ${siteUrl || 'not specified'}\nGoals: ${goals}\nKeywords: ${keywords || 'general'}\n\nReturn JSON:\n{\n  "month": "Month Year",\n  "items": [\n    { "day": 1, "date": "2026-04-01", "title": "content title", "type": "blog"|"video"|"social"|"email"|"infographic"|"podcast", "keyword": "target keyword", "notes": "brief notes" }\n  ],\n  "typeMix": [\n    { "type": "Blog Posts", "count": number, "percentage": number }\n  ],\n  "summary": "calendar strategy overview"\n}\n\nGenerate 15-20 content items spread across 30 days with a balanced type mix.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content calendar generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const lines = ['Date,Title,Type,Keyword,Notes'];
    result.items.forEach((i) => {
      lines.push(`"${i.date}","${i.title}","${i.type}","${i.keyword}","${i.notes}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('CSV copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
            <CalendarDays className="size-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Content Calendar AI</h1>
            <p className="text-xs text-muted-foreground">AI-generated 30-day content calendar with type mix recommendations</p>
          </div>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="yoursite.com" className="h-11 pl-9 bg-background/50 border-border/30" />
              </div>
            </div>
            <Input value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Content goals (e.g., increase organic traffic, build authority)" className="h-11 bg-background/50 border-border/30" />
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Target keywords (optional, comma-separated)" className="h-11 bg-background/50 border-border/30" />
            <Button onClick={generate} disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Generate Calendar
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-border/30 bg-card/40">
              <CardContent className="pt-4">
                <h2 className="text-lg font-bold">{result.month}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Type Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
                  {result.typeMix.map((tm, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{tm.type}</span>
                        <span className="text-muted-foreground">{tm.count} ({tm.percentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${tm.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Calendar Items ({result.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border border-border/30 p-3 bg-background/30 hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{item.date}</span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${typeColors[item.type] ?? 'bg-muted/30 text-muted-foreground'}`}>{item.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.keyword} · {item.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportCsv} className="gap-1.5">
              <Copy className="size-3.5" /> Export as CSV
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

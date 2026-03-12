import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Loader2, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface TrackedPage {
  title: string;
  url: string;
  publishDate: string;
  contentType: 'blog' | 'landing' | 'product' | 'resource' | 'news';
  status: 'new' | 'updated' | 'unchanged';
  wordCount: number;
}

interface ContentDistribution {
  type: string;
  count: number;
  percentage: number;
}

interface TrendingTopic {
  topic: string;
  frequency: number;
  trend: 'rising' | 'stable' | 'declining';
}

interface TrackerResult {
  competitor: string;
  publishingFrequency: string;
  totalPagesTracked: number;
  pages: TrackedPage[];
  distribution: ContentDistribution[];
  trendingTopics: TrendingTopic[];
  summary: string;
}

const statusColors: Record<string, string> = {
  new: 'text-green-400 bg-green-950/30',
  updated: 'text-yellow-400 bg-yellow-950/30',
  unchanged: 'text-muted-foreground bg-muted/30',
};

const typeColors: Record<string, string> = {
  blog: 'text-blue-400 bg-blue-950/30',
  landing: 'text-purple-400 bg-purple-950/30',
  product: 'text-orange-400 bg-orange-950/30',
  resource: 'text-green-400 bg-green-950/30',
  news: 'text-red-400 bg-red-950/30',
};

const trendColors: Record<string, string> = {
  rising: 'text-green-400',
  stable: 'text-yellow-400',
  declining: 'text-red-400',
};

export default function CompetitorContentTracker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackerResult | null>(null);

  const track = async () => {
    if (!domain.trim()) { toast.error('Enter competitor domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a competitive intelligence expert. Return JSON only.' },
          { role: 'user', content: `Track content activity for competitor domain: ${domain}\n\nReturn JSON:\n{\n  "competitor": "domain",\n  "publishingFrequency": "e.g. 3 posts/week",\n  "totalPagesTracked": number,\n  "pages": [\n    { "title": "Page title", "url": "full url", "publishDate": "2026-03-10", "contentType": "blog"|"landing"|"product"|"resource"|"news", "status": "new"|"updated"|"unchanged", "wordCount": number }\n  ],\n  "distribution": [\n    { "type": "Blog Posts", "count": number, "percentage": number }\n  ],\n  "trendingTopics": [\n    { "topic": "topic name", "frequency": number, "trend": "rising"|"stable"|"declining" }\n  ],\n  "summary": "overview"\n}\n\nGenerate 10-12 tracked pages, 4-5 distribution items, and 6-8 trending topics.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Competitor content tracked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="size-6" />
            Competitor Content Tracker
          </h1>
          <p className="text-muted-foreground">Monitor publishing frequency, new pages, and trending topics</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Competitor domain (e.g., competitor.com)" />
            <Button onClick={track} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              Track Content
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalPagesTracked}</p>
                  <p className="text-[10px] text-muted-foreground">Pages Tracked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-primary">{result.publishingFrequency}</p>
                  <p className="text-[10px] text-muted-foreground">Publishing Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.pages.filter((p) => p.status === 'new').length}</p>
                  <p className="text-[10px] text-muted-foreground">New Pages</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><BarChart3 className="size-3.5" /> Content Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.distribution.map((d, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>{d.type}</span>
                          <span className="text-muted-foreground">{d.count} ({d.percentage}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/30">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${d.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="size-3.5" /> Trending Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.trendingTopics.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{t.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t.frequency}x</span>
                          <span className={`text-[9px] font-medium ${trendColors[t.trend]}`}>{t.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><FileText className="size-3.5" /> Tracked Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.pages.map((page, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{page.title}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeColors[page.contentType] ?? 'bg-muted/30 text-muted-foreground'}`}>{page.contentType}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[page.status]}`}>{page.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{page.publishDate}</span>
                        <span>{page.wordCount.toLocaleString()} words</span>
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

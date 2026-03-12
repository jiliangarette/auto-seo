import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  PuzzleIcon,
  Loader2,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface GapTopic {
  topic: string;
  searchVolume: number;
  priority: 'high' | 'medium' | 'low';
  competitorsCovering: number;
  suggestedTitle: string;
  briefOutline: string[];
}

interface GapResult {
  yourDomain: string;
  totalGaps: number;
  highPriority: number;
  gaps: GapTopic[];
  summary: string;
}

const prioColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

export default function ContentGapFinder() {
  const [yourSitemap, setYourSitemap] = useState('');
  const [competitorSitemaps, setCompetitorSitemaps] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);

  const findGaps = async () => {
    if (!yourSitemap.trim()) {
      toast.error('Enter your sitemap or domain');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content gap analysis expert. Return JSON only.' },
          { role: 'user', content: `Find content gaps:

Your sitemap/domain: ${yourSitemap}
Competitor sitemaps/domains: ${competitorSitemaps || 'Auto-detect competitors'}

Identify topics competitors cover that are missing from the target site.

Return JSON:
{
  "yourDomain": "${yourSitemap}",
  "totalGaps": number,
  "highPriority": number,
  "gaps": [
    {
      "topic": "missing topic",
      "searchVolume": number,
      "priority": "high"|"medium"|"low",
      "competitorsCovering": number,
      "suggestedTitle": "article title suggestion",
      "briefOutline": ["section 1", "section 2", "section 3"]
    }
  ],
  "summary": "gap analysis overview"
}

Generate 10-15 realistic content gaps sorted by priority.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Gap analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = result.gaps.map((g) => `"${g.topic}",${g.searchVolume},${g.priority},${g.competitorsCovering},"${g.suggestedTitle}"`);
    const csv = `Topic,Search Volume,Priority,Competitors Covering,Suggested Title\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-gaps.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PuzzleIcon className="size-6" />
            Content Gap Finder
          </h1>
          <p className="text-muted-foreground">Discover missing content topics your competitors cover</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Sitemap or Domain</label>
              <Input value={yourSitemap} onChange={(e) => setYourSitemap(e.target.value)} placeholder="yourdomain.com or sitemap URL" className="font-mono text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Competitor Domains (one per line, optional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs min-h-[80px] resize-y"
                value={competitorSitemaps}
                onChange={(e) => setCompetitorSitemaps(e.target.value)}
                placeholder={"competitor1.com\ncompetitor2.com"}
              />
            </div>
            <Button onClick={findGaps} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <PuzzleIcon className="size-4" />}
              Find Content Gaps
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalGaps}</p>
                  <p className="text-[10px] text-muted-foreground">Content Gaps</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.highPriority}</p>
                  <p className="text-[10px] text-muted-foreground">High Priority</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download className="size-3.5" /> Export CSV
                  </Button>
                </CardContent>
              </Card>
            </div>

            {result.summary && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs">{result.summary}</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {result.gaps.map((gap, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{gap.topic}</p>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${prioColors[gap.priority]}`}>
                            {gap.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{gap.searchVolume.toLocaleString()} vol/mo</span>
                          <span>{gap.competitorsCovering} competitors</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const next = new Set(expanded);
                        next.has(idx) ? next.delete(idx) : next.add(idx);
                        setExpanded(next);
                      }}>
                        <FileText className="size-3.5" />
                        {expanded.has(idx) ? 'Hide' : 'Brief'}
                      </Button>
                    </div>

                    {expanded.has(idx) && (
                      <div className="mt-2 rounded-md border border-border/50 p-3">
                        <p className="text-xs font-medium text-primary mb-1">{gap.suggestedTitle}</p>
                        <div className="space-y-0.5">
                          {gap.briefOutline.map((section, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">• {section}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LayoutGrid, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PageScore {
  url: string;
  title: string;
  titleScore: number;
  metaScore: number;
  headingScore: number;
  contentScore: number;
  overallScore: number;
  issues: string[];
}

interface BulkResult {
  summary: string;
  pages: PageScore[];
  averageScore: number;
}

export default function BulkPageAnalyzer() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [sortBy, setSortBy] = useState<'overall' | 'title' | 'meta' | 'heading' | 'content'>('overall');
  const [filterRange, setFilterRange] = useState<'all' | 'good' | 'ok' | 'poor'>('all');

  const analyze = async () => {
    if (!urls.trim()) { toast.error('Enter URLs to analyze'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a bulk SEO analysis expert. Return JSON only.' },
          { role: 'user', content: `Perform batch SEO analysis on these URLs:\n${urls}\n\nReturn JSON:\n{\n  "summary": "batch analysis overview",\n  "pages": [\n    {\n      "url": "page URL",\n      "title": "page title",\n      "titleScore": number(0-100),\n      "metaScore": number(0-100),\n      "headingScore": number(0-100),\n      "contentScore": number(0-100),\n      "overallScore": number(0-100),\n      "issues": ["issue 1", "issue 2"]\n    }\n  ],\n  "averageScore": number\n}\n\nAnalyze each URL with realistic scores and specific issues found.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Bulk analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const lines = ['URL,Title,Title Score,Meta Score,Heading Score,Content Score,Overall,Issues'];
    result.pages.forEach((p) => {
      lines.push(`"${p.url}","${p.title}",${p.titleScore},${p.metaScore},${p.headingScore},${p.contentScore},${p.overallScore},"${p.issues.join('; ')}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Analysis exported as CSV');
  };

  const sortedPages = result?.pages
    .filter((p) => {
      if (filterRange === 'good') return p.overallScore >= 70;
      if (filterRange === 'ok') return p.overallScore >= 40 && p.overallScore < 70;
      if (filterRange === 'poor') return p.overallScore < 40;
      return true;
    })
    .sort((a, b) => {
      const key = sortBy === 'overall' ? 'overallScore' : sortBy === 'title' ? 'titleScore' : sortBy === 'meta' ? 'metaScore' : sortBy === 'heading' ? 'headingScore' : 'contentScore';
      return a[key] - b[key];
    }) ?? [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="size-6" />
            Bulk Page Analyzer
          </h1>
          <p className="text-muted-foreground">Batch SEO analysis with sortable scores and CSV export</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter URLs to analyze (one per line, supports hundreds)&#10;https://example.com/page-1&#10;https://example.com/page-2&#10;https://example.com/page-3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LayoutGrid className="size-4" />}
              Analyze All
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{result.summary}</p>
                  <p className={`text-2xl font-bold ${result.averageScore >= 70 ? 'text-green-400' : result.averageScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.averageScore}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Sort:</span>
              {(['overall', 'title', 'meta', 'heading', 'content'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)} className={`text-[9px] px-1.5 py-0.5 rounded border ${sortBy === s ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground'}`}>{s}</button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">Filter:</span>
              {(['all', 'good', 'ok', 'poor'] as const).map((f) => (
                <button key={f} onClick={() => setFilterRange(f)} className={`text-[9px] px-1.5 py-0.5 rounded border ${filterRange === f ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground'}`}>{f}</button>
              ))}
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Results ({sortedPages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {sortedPages.map((page, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${page.overallScore >= 70 ? 'text-green-400' : page.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{page.overallScore}</span>
                        <span className="text-sm font-medium truncate flex-1">{page.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mb-1">{page.url}</p>
                      <div className="flex gap-3 text-[9px] text-muted-foreground">
                        <span>Title: {page.titleScore}</span>
                        <span>Meta: {page.metaScore}</span>
                        <span>H-tags: {page.headingScore}</span>
                        <span>Content: {page.contentScore}</span>
                      </div>
                      {page.issues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {page.issues.map((issue, iIdx) => (
                            <span key={iIdx} className="text-[8px] px-1 py-0.5 rounded bg-red-950/20 text-red-400">{issue}</span>
                          ))}
                        </div>
                      )}
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

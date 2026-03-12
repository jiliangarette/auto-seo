import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileBarChart, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface AuditPage {
  url: string;
  title: string;
  seoScore: number;
  freshnessScore: number;
  engagementScore: number;
  overallScore: number;
  action: 'keep' | 'update' | 'merge' | 'delete';
  recommendation: string;
}

interface AuditResult {
  summary: string;
  pages: AuditPage[];
  actionSummary: { action: string; count: number }[];
}

const actionColors: Record<string, string> = {
  keep: 'text-green-400 bg-green-950/30',
  update: 'text-yellow-400 bg-yellow-950/30',
  merge: 'text-blue-400 bg-blue-950/30',
  delete: 'text-red-400 bg-red-950/30',
};

export default function ContentAuditScorer() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const audit = async () => {
    if (!urls.trim()) { toast.error('Enter URLs to audit'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content audit expert. Return JSON only.' },
          { role: 'user', content: `Perform a content audit on these URLs:\n${urls}\n\nReturn JSON:\n{\n  "summary": "audit overview",\n  "pages": [\n    {\n      "url": "page URL",\n      "title": "page title",\n      "seoScore": number(0-100),\n      "freshnessScore": number(0-100),\n      "engagementScore": number(0-100),\n      "overallScore": number(0-100),\n      "action": "keep"|"update"|"merge"|"delete",\n      "recommendation": "specific recommendation"\n    }\n  ],\n  "actionSummary": [\n    { "action": "Keep", "count": number },\n    { "action": "Update", "count": number },\n    { "action": "Merge", "count": number },\n    { "action": "Delete", "count": number }\n  ]\n}\n\nScore each page and assign an action tag with specific recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content audit complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const exportAudit = () => {
    if (!result) return;
    const lines = ['URL,Title,SEO Score,Freshness,Engagement,Overall,Action,Recommendation'];
    result.pages.forEach((p) => {
      lines.push(`"${p.url}","${p.title}",${p.seoScore},${p.freshnessScore},${p.engagementScore},${p.overallScore},"${p.action}","${p.recommendation}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Audit spreadsheet copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="size-6" />
            Content Audit Scorer
          </h1>
          <p className="text-muted-foreground">Score pages on SEO health, freshness, and engagement with action tags</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter URLs to audit (one per line)&#10;https://example.com/blog/post-1&#10;https://example.com/blog/post-2&#10;https://example.com/guides/guide-1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={audit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
              Run Audit
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
                <div className="flex gap-3 mt-3">
                  {result.actionSummary.map((a, idx) => (
                    <div key={idx} className="text-center">
                      <p className="text-lg font-bold">{a.count}</p>
                      <p className="text-[9px] text-muted-foreground">{a.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Page Scores ({result.pages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.pages
                    .sort((a, b) => a.overallScore - b.overallScore)
                    .map((page, idx) => (
                      <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${actionColors[page.action] ?? 'bg-muted/30'}`}>{page.action}</span>
                          <span className="text-sm font-medium truncate flex-1">{page.title}</span>
                          <span className={`text-xs font-bold ${page.overallScore >= 70 ? 'text-green-400' : page.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{page.overallScore}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{page.url}</p>
                        <div className="flex gap-4 text-[10px] text-muted-foreground">
                          <span>SEO: {page.seoScore}</span>
                          <span>Fresh: {page.freshnessScore}</span>
                          <span>Engage: {page.engagementScore}</span>
                        </div>
                        <p className="text-xs text-primary/80">{page.recommendation}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportAudit} className="gap-1.5">
              <Copy className="size-3.5" /> Export Audit Spreadsheet
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

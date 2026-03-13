import { useState } from 'react';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrphanPage {
  url: string;
  title: string;
  suggestedLinks: string[];
}

interface LinkEquity {
  page: string;
  internalLinksIn: number;
  internalLinksOut: number;
  equityScore: number;
  status: 'well-linked' | 'under-linked' | 'over-linked' | 'orphan';
}

interface AuditResult {
  totalPages: number;
  orphanPages: OrphanPage[];
  linkEquity: LinkEquity[];
  improvementPlan: string[];
  summary: string;
}

const statusColors: Record<string, string> = {
  'well-linked': 'text-green-400 bg-green-950/30',
  'under-linked': 'text-yellow-400 bg-yellow-950/30',
  'over-linked': 'text-blue-400 bg-blue-950/30',
  orphan: 'text-red-400 bg-red-950/30',
};

export default function InternalLinkAudit() {
  const [url, setUrl] = useSiteUrlInput();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const audit = async () => {
    if (!url.trim()) { toast.error('Enter a site URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an internal linking expert. Return JSON only.' },
          { role: 'user', content: `Audit internal linking for: ${url}\n\nReturn JSON:\n{\n  "totalPages": number,\n  "orphanPages": [\n    { "url": "page url", "title": "page title", "suggestedLinks": ["page to link from 1", "page 2"] }\n  ],\n  "linkEquity": [\n    { "page": "page url or title", "internalLinksIn": number, "internalLinksOut": number, "equityScore": number(0-100), "status": "well-linked"|"under-linked"|"over-linked"|"orphan" }\n  ],\n  "improvementPlan": ["step 1", "step 2"],\n  "summary": "overview"\n}\n\nGenerate 3-4 orphan pages, 10-12 link equity entries, and 5-6 improvement steps.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Internal link audit complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Internal Link Audit
          </h1>
          <p className="text-muted-foreground">Find orphan pages, analyze link equity, and improve internal linking</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter site URL (e.g., https://example.com)" />
            <Button onClick={audit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Run Internal Link Audit
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalPages}</p>
                  <p className="text-[10px] text-muted-foreground">Pages Analyzed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.orphanPages.length}</p>
                  <p className="text-[10px] text-muted-foreground">Orphan Pages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.linkEquity.filter((l) => l.status === 'well-linked').length}</p>
                  <p className="text-[10px] text-muted-foreground">Well-Linked</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {result.orphanPages.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-red-400" /> Orphan Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.orphanPages.map((page, idx) => (
                      <div key={idx} className="rounded-md border border-red-500/20 p-2.5 space-y-1">
                        <p className="text-sm font-medium">{page.title}</p>
                        <p className="text-[10px] text-muted-foreground">{page.url}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[9px] text-muted-foreground">Link from:</span>
                          {page.suggestedLinks.map((sl, i) => (
                            <span key={i} className="text-[9px] bg-green-950/30 text-green-400 px-1.5 py-0.5 rounded">{sl}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Link Equity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.linkEquity.map((le, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{le.page}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>In: {le.internalLinksIn}</span>
                          <span>Out: {le.internalLinksOut}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold">{le.equityScore}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[le.status]}`}>{le.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Improvement Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.improvementPlan.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{step}</span>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageKeyword {
  page: string;
  keywords: string[];
  primaryKeyword: string;
}

interface Overlap {
  keyword: string;
  pages: string[];
  severity: 'critical' | 'warning' | 'ok';
  action: string;
}

interface MapResult {
  pages: PageKeyword[];
  overlaps: Overlap[];
  plan: string[];
  summary: string;
}

const sevColors = {
  critical: 'text-red-400 bg-red-950/30',
  warning: 'text-yellow-400 bg-yellow-950/30',
  ok: 'text-green-400 bg-green-950/30',
};

export default function KeywordCannibalizationMap() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapResult | null>(null);

  const analyze = async () => {
    if (!input.trim()) { toast.error('Enter pages and keywords'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a keyword cannibalization expert. Return JSON only.' },
          { role: 'user', content: `Analyze keyword cannibalization for:\n${input}\n\nReturn JSON:\n{\n  "pages": [\n    { "page": "page URL or title", "keywords": ["kw1", "kw2"], "primaryKeyword": "main keyword" }\n  ],\n  "overlaps": [\n    { "keyword": "overlapping keyword", "pages": ["page1", "page2"], "severity": "critical"|"warning"|"ok", "action": "what to do" }\n  ],\n  "plan": ["step 1", "step 2"],\n  "summary": "overview"\n}\n\nGenerate 6-8 page mappings, 5-7 overlap detections with mix of severities, and 4-5 plan steps.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Cannibalization analysis complete');
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
            <Swords className="size-6" />
            Keyword Cannibalization Map
          </h1>
          <p className="text-muted-foreground">Visualize keyword-to-page assignments and detect overlaps</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter pages and their target keywords:&#10;/blog/email-marketing-guide - email marketing, email strategy&#10;/blog/email-tips - email marketing tips, email best practices&#10;/services/email - email marketing services"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              Analyze Cannibalization
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.pages.length}</p>
                  <p className="text-[10px] text-muted-foreground">Pages Mapped</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.overlaps.filter((o) => o.severity === 'critical').length}</p>
                  <p className="text-[10px] text-muted-foreground">Critical Overlaps</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{result.overlaps.filter((o) => o.severity === 'warning').length}</p>
                  <p className="text-[10px] text-muted-foreground">Warnings</p>
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
                <CardTitle className="text-sm">Keyword-Page Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.pages.map((p, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-sm font-medium">{p.page}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.keywords.map((kw, i) => (
                          <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${kw === p.primaryKeyword ? 'bg-primary/20 text-primary font-medium' : 'bg-muted/30 text-muted-foreground'}`}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overlap Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.overlaps.map((o, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {o.severity === 'ok' ? (
                            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                          ) : (
                            <AlertTriangle className={`size-3.5 shrink-0 ${o.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`} />
                          )}
                          <span className="text-sm font-medium">{o.keyword}</span>
                        </div>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sevColors[o.severity]}`}>{o.severity}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-5">
                        {o.pages.map((pg, i) => (
                          <span key={i} className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{pg}</span>
                        ))}
                      </div>
                      {o.severity !== 'ok' && (
                        <p className="text-[10px] text-yellow-400/80 ml-5">{o.action}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Differentiation Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.plan.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
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

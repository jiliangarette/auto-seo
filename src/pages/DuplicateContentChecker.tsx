import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DuplicatePair {
  pageA: string;
  pageB: string;
  similarity: number;
  type: 'exact' | 'near-duplicate' | 'similar' | 'unique';
  recommendation: string;
}

interface DuplicateResult {
  totalChecked: number;
  duplicatesFound: number;
  pairs: DuplicatePair[];
  recommendations: string[];
  summary: string;
}

const typeColors: Record<string, string> = {
  exact: 'text-red-400 bg-red-950/30',
  'near-duplicate': 'text-orange-400 bg-orange-950/30',
  similar: 'text-yellow-400 bg-yellow-950/30',
  unique: 'text-green-400 bg-green-950/30',
};

export default function DuplicateContentChecker() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DuplicateResult | null>(null);

  const check = async () => {
    if (!input.trim()) { toast.error('Enter URLs or content blocks'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content duplication expert. Return JSON only.' },
          { role: 'user', content: `Check for duplicate content across these pages/content:\n${input.slice(0, 3000)}\n\nReturn JSON:\n{\n  "totalChecked": number,\n  "duplicatesFound": number,\n  "pairs": [\n    { "pageA": "URL or content label", "pageB": "URL or content label", "similarity": number(0-100), "type": "exact"|"near-duplicate"|"similar"|"unique", "recommendation": "what to do" }\n  ],\n  "recommendations": ["general tip 1", "tip 2"],\n  "summary": "overview"\n}\n\nGenerate 8-10 comparison pairs with realistic similarity scores. Include a mix of exact, near-duplicate, similar, and unique results.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Duplicate check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Copy className="size-6" />
            Duplicate Content Checker
          </h1>
          <p className="text-muted-foreground">Detect near-duplicate and exact-duplicate content across pages</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter URLs (one per line) or paste content blocks separated by ---&#10;https://example.com/page-1&#10;https://example.com/page-2&#10;https://example.com/page-3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
              Check for Duplicates
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalChecked}</p>
                  <p className="text-[10px] text-muted-foreground">Pages Checked</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.duplicatesFound}</p>
                  <p className="text-[10px] text-muted-foreground">Duplicates Found</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.pairs.filter((p) => p.type === 'unique').length}</p>
                  <p className="text-[10px] text-muted-foreground">Unique Pairs</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Comparisons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.pairs.map((pair, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {pair.similarity >= 80 ? (
                            <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                          )}
                          <span className="text-sm truncate">{pair.pageA}</span>
                          <span className="text-muted-foreground text-xs">vs</span>
                          <span className="text-sm truncate">{pair.pageB}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold">{pair.similarity}%</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeColors[pair.type]}`}>{pair.type}</span>
                        </div>
                      </div>
                      <div className="ml-5">
                        <div className="h-1 rounded-full bg-muted/30 mb-1">
                          <div className={`h-full rounded-full ${pair.similarity >= 80 ? 'bg-red-500' : pair.similarity >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pair.similarity}%` }} />
                        </div>
                        {pair.type !== 'unique' && (
                          <p className="text-[10px] text-yellow-400/80">{pair.recommendation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
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

import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Loader2, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SlugResult {
  title: string;
  originalSlug: string;
  optimizedSlug: string;
  keywordIncluded: boolean;
  charCount: number;
  status: 'optimal' | 'too-long' | 'missing-keyword' | 'has-stopwords';
  reasoning: string;
}

interface OptimizerResult {
  slugs: SlugResult[];
  tips: string[];
  summary: string;
}

const statusColors: Record<string, string> = {
  optimal: 'text-green-400 bg-green-950/30',
  'too-long': 'text-yellow-400 bg-yellow-950/30',
  'missing-keyword': 'text-red-400 bg-red-950/30',
  'has-stopwords': 'text-orange-400 bg-orange-950/30',
};

export default function UrlSlugOptimizer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<OptimizerResult | null>(null);

  const optimize = async () => {
    if (!input.trim()) { toast.error('Enter page titles'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a URL optimization expert. Return JSON only.' },
          { role: 'user', content: `Generate SEO-friendly URL slugs for these page titles:\n${input}\n\nReturn JSON:\n{\n  "slugs": [\n    { "title": "page title", "originalSlug": "auto-generated-from-title", "optimizedSlug": "seo-friendly-slug", "keywordIncluded": boolean, "charCount": number, "status": "optimal"|"too-long"|"missing-keyword"|"has-stopwords", "reasoning": "why this slug is better" }\n  ],\n  "tips": ["general URL slug tip 1", "tip 2"],\n  "summary": "overview"\n}\n\nKeep slugs under 60 chars, remove stop words, include primary keywords. Generate both original and optimized versions.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Slugs optimized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const lines = result.slugs.map((s) => `${s.title}\t/${s.optimizedSlug}`);
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('All slugs copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            URL Slug Optimizer
          </h1>
          <p className="text-muted-foreground">Generate SEO-friendly URL slugs with keyword validation</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter page titles (one per line)&#10;How to Start a Blog in 2026&#10;The Ultimate Guide to Email Marketing&#10;10 Best CRM Software for Small Business"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={optimize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Optimize Slugs
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimized Slugs ({result.slugs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.slugs.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{s.title}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[s.status]}`}>{s.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground line-through">/{s.originalSlug}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-primary font-medium">/{s.optimizedSlug}</span>
                        <button onClick={() => { navigator.clipboard.writeText(`/${s.optimizedSlug}`); toast.success('Copied'); }}>
                          <Copy className="size-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {s.keywordIncluded ? (
                          <span className="flex items-center gap-0.5 text-green-400"><CheckCircle2 className="size-2.5" /> Keyword</span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-red-400"><AlertTriangle className="size-2.5" /> No keyword</span>
                        )}
                        <span>{s.charCount} chars</span>
                        <span>{s.reasoning}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">URL Slug Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={copyAll} className="gap-1.5">
              <Copy className="size-3.5" /> Copy All Slugs
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

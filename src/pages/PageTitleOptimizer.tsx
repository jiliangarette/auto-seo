import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TitleVariant {
  title: string;
  charCount: number;
  keywordPlacement: string;
  powerWords: string[];
  predictedCtr: number;
}

interface OptimizerResult {
  originalTitle: string;
  keyword: string;
  variants: TitleVariant[];
  analysis: {
    keywordPresent: boolean;
    charCount: number;
    hasPowerWords: boolean;
    hasNumbers: boolean;
  };
  summary: string;
}

export default function PageTitleOptimizer() {
  const [title, setTitle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizerResult | null>(null);

  const optimize = async () => {
    if (!title.trim()) { toast.error('Enter a page title'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a title tag optimization expert. Return JSON only.' },
          { role: 'user', content: `Optimize this page title:\nTitle: ${title}\nTarget keyword: ${keyword || 'none specified'}\n\nReturn JSON:\n{\n  "originalTitle": "${title}",\n  "keyword": "${keyword || 'none'}",\n  "variants": [\n    { "title": "optimized title variant", "charCount": number, "keywordPlacement": "front"|"middle"|"end", "powerWords": ["word1", "word2"], "predictedCtr": number(0-100) }\n  ],\n  "analysis": {\n    "keywordPresent": boolean,\n    "charCount": number,\n    "hasPowerWords": boolean,\n    "hasNumbers": boolean\n  },\n  "summary": "optimization overview"\n}\n\nGenerate 5-6 optimized variants. Keep titles under 60 characters. Use power words and numbers where appropriate.` },
        ],
        temperature: 0.7,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Title optimized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const copyTitle = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success('Title copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wand2 className="size-6" />
            Page Title Optimizer
          </h1>
          <p className="text-muted-foreground">Optimize titles with keyword placement, power words, and CTR prediction</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Current page title" />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword (optional)" />
            <Button onClick={optimize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Optimize Title
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-2">{result.summary}</p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className={`px-2 py-0.5 rounded ${result.analysis.keywordPresent ? 'bg-green-950/30 text-green-400' : 'bg-red-950/30 text-red-400'}`}>
                    Keyword {result.analysis.keywordPresent ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${result.analysis.charCount <= 60 ? 'bg-green-950/30 text-green-400' : 'bg-red-950/30 text-red-400'}`}>
                    {result.analysis.charCount} chars
                  </span>
                  <span className={`px-2 py-0.5 rounded ${result.analysis.hasPowerWords ? 'bg-green-950/30 text-green-400' : 'bg-yellow-950/30 text-yellow-400'}`}>
                    Power Words {result.analysis.hasPowerWords ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${result.analysis.hasNumbers ? 'bg-green-950/30 text-green-400' : 'bg-yellow-950/30 text-yellow-400'}`}>
                    Numbers {result.analysis.hasNumbers ? '✓' : '✗'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimized Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.variants.sort((a, b) => b.predictedCtr - a.predictedCtr).map((v, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex-1">{v.title}</span>
                        <Button variant="ghost" size="sm" onClick={() => copyTitle(v.title)}>
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground">CTR:</span>
                          <span className={`text-xs font-bold ${v.predictedCtr >= 5 ? 'text-green-400' : v.predictedCtr >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {v.predictedCtr}%
                          </span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${v.charCount <= 60 ? 'bg-green-950/30 text-green-400' : 'bg-red-950/30 text-red-400'}`}>
                          {v.charCount} chars
                        </span>
                        <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">
                          keyword: {v.keywordPlacement}
                        </span>
                        {v.powerWords.map((pw, i) => (
                          <span key={i} className="text-[9px] bg-purple-950/30 text-purple-400 px-1.5 py-0.5 rounded">{pw}</span>
                        ))}
                      </div>
                      <div className="h-1 rounded-full bg-muted/30 mt-2">
                        <div className={`h-full rounded-full ${v.predictedCtr >= 5 ? 'bg-green-500' : v.predictedCtr >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(v.predictedCtr * 10, 100)}%` }} />
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

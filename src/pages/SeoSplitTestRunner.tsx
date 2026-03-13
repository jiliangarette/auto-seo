import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface Variant {
  label: string;
  title: string;
  description: string;
  predictedCtr: number;
  strengths: string[];
  weaknesses: string[];
}

interface SplitTestResult {
  keyword: string;
  summary: string;
  variants: Variant[];
  winner: string;
  confidence: number;
  statisticalSignificance: string;
  recommendations: string[];
}

export default function SeoSplitTestRunner() {
  const [keyword, setKeyword] = useState('');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SplitTestResult | null>(null);

  const runTest = async () => {
    if (!keyword.trim() || !variantA.trim() || !variantB.trim()) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO A/B testing expert. Return JSON only.' },
          { role: 'user', content: `Run SEO split test:\nKeyword: ${keyword}\nVariant A title: ${variantA}\nVariant B title: ${variantB}\n\nReturn JSON:\n{\n  "keyword": "${keyword}",\n  "summary": "test analysis overview",\n  "variants": [\n    { "label": "A"|"B", "title": "the title", "description": "auto-generated meta description for this title", "predictedCtr": number(0-15), "strengths": ["str1", "str2"], "weaknesses": ["weak1"] }\n  ],\n  "winner": "A"|"B",\n  "confidence": number(0-100),\n  "statisticalSignificance": "explanation of statistical significance",\n  "recommendations": ["rec 1", "rec 2", "rec 3"]\n}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Split test complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Test failed');
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
            SEO Split Test Runner
          </h1>
          <p className="text-muted-foreground">A/B test meta titles and descriptions with CTR predictions</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword (e.g., best project management tools)" />
            <Input value={variantA} onChange={(e) => setVariantA(e.target.value)} placeholder="Variant A title" />
            <Input value={variantB} onChange={(e) => setVariantB(e.target.value)} placeholder="Variant B title" />
            <Button onClick={runTest} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              Run Split Test
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">Winner: Variant {result.winner}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">{result.confidence}%</p>
                    <p className="text-[9px] text-muted-foreground">Confidence</p>
                  </div>
                </div>
                <p className="text-[10px] text-yellow-400 mt-2">{result.statisticalSignificance}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.variants.map((v) => (
                <Card key={v.label} className={v.label === result.winner ? 'border-green-500/30' : 'border-border/50'}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Variant {v.label} {v.label === result.winner && '(Winner)'}</CardTitle>
                      <span className="text-lg font-bold text-primary">{v.predictedCtr}%</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Predicted CTR</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs font-medium mb-1">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground mb-3">{v.description}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[9px] font-bold text-green-400 mb-1">Strengths</p>
                        {v.strengths.map((s, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">+ {s}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-red-400 mb-1">Weaknesses</p>
                        {v.weaknesses.map((w, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">- {w}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.recommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

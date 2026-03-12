import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface TitleVariant {
  title: string;
  predictedCtr: number;
  improvement: string;
  technique: string;
}

interface CtrResult {
  keyword: string;
  position: number;
  currentCtr: number;
  industryCtr: number;
  gap: string;
  summary: string;
  titleVariants: TitleVariant[];
  descriptionSuggestions: { description: string; predictedCtr: number }[];
  projections: { scenario: string; ctrIncrease: string; additionalClicks: string }[];
}

export default function OrganicCtrOptimizer() {
  const [keyword, setKeyword] = useState('');
  const [position, setPosition] = useState('');
  const [currentCtr, setCurrentCtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CtrResult | null>(null);

  const optimize = async () => {
    if (!keyword.trim() || !position.trim()) { toast.error('Enter keyword and position'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an organic CTR optimization expert. Return JSON only.' },
          { role: 'user', content: `Optimize organic CTR:\nKeyword: ${keyword}\nSERP Position: ${position}\nCurrent CTR: ${currentCtr || 'unknown'}%\n\nReturn JSON:\n{\n  "keyword": "${keyword}",\n  "position": ${position},\n  "currentCtr": number,\n  "industryCtr": number,\n  "gap": "CTR gap description",\n  "summary": "CTR optimization overview",\n  "titleVariants": [\n    { "title": "optimized title", "predictedCtr": number, "improvement": "+X%", "technique": "technique used" }\n  ],\n  "descriptionSuggestions": [\n    { "description": "meta description", "predictedCtr": number }\n  ],\n  "projections": [\n    { "scenario": "scenario name", "ctrIncrease": "+X%", "additionalClicks": "X clicks/month" }\n  ]\n}\n\nGenerate 4 title variants, 3 descriptions, and 3 projections.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('CTR optimization complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
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
            Organic CTR Optimizer
          </h1>
          <p className="text-muted-foreground">Benchmark and optimize click-through rates for organic results</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword" />
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Current SERP position (e.g., 5)" type="number" />
            <Input value={currentCtr} onChange={(e) => setCurrentCtr(e.target.value)} placeholder="Current CTR % (optional, e.g., 3.2)" type="number" />
            <Button onClick={optimize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              Optimize CTR
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">"{result.keyword}" — Position #{result.position}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                    <p className="text-[10px] text-yellow-400 mt-1">{result.gap}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current: {result.currentCtr}%</p>
                    <p className="text-xs text-muted-foreground">Industry: {result.industryCtr}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Title Variants</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.titleVariants.map((t, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <p className="text-sm font-medium text-blue-400">{t.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px]">
                        <span className="text-green-400 font-bold">{t.predictedCtr}% CTR</span>
                        <span className="text-green-400">{t.improvement}</span>
                        <span className="text-muted-foreground">{t.technique}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Description Suggestions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.descriptionSuggestions.map((d, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                      <p className="text-[10px] text-green-400 mt-1">Predicted CTR: {d.predictedCtr}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Impact Projections</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.projections.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-medium">{p.scenario}</span>
                      <span className="text-xs text-green-400">{p.ctrIncrease}</span>
                      <span className="text-xs text-primary">{p.additionalClicks}</span>
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

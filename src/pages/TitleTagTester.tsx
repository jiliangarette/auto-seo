import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Type, Loader2, Plus, Trash2, Trophy, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface TitleResult {
  title: string;
  predictedCtr: number;
  charCount: number;
  strengths: string[];
  weaknesses: string[];
}

interface TestResult {
  results: TitleResult[];
  winnerIndex: number;
  reasoning: string;
}

export default function TitleTagTester() {
  const [titles, setTitles] = useState<string[]>(['', '']);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const addTitle = () => setTitles([...titles, '']);
  const removeTitle = (idx: number) => setTitles(titles.filter((_, i) => i !== idx));
  const updateTitle = (idx: number, val: string) => {
    const next = [...titles];
    next[idx] = val;
    setTitles(next);
  };

  const test = async () => {
    const valid = titles.filter((t) => t.trim());
    if (valid.length < 2) { toast.error('Enter at least 2 title variants'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a title tag CTR optimization expert. Return JSON only.' },
          { role: 'user', content: `Compare these title tag variants:

${valid.map((t, i) => `Variant ${i + 1}: "${t}"`).join('\n')}

Target keyword: ${keyword || 'auto-detect'}

Return JSON:
{
  "results": [
    { "title": "title text", "predictedCtr": number(1-15), "charCount": number, "strengths": ["s1"], "weaknesses": ["w1"] }
  ],
  "winnerIndex": number(0-based),
  "reasoning": "why the winner is best"
}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Test complete');
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
            <Type className="size-6" />
            Title Tag Tester
          </h1>
          <p className="text-muted-foreground">Compare title variants with AI-predicted CTR</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keyword (optional)</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., best SEO tools" />
            </div>
            {titles.map((title, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6 shrink-0">#{idx + 1}</span>
                <Input value={title} onChange={(e) => updateTitle(idx, e.target.value)} placeholder={`Title variant ${idx + 1}`} />
                {titles.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => removeTitle(idx)}>
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addTitle}>
                <Plus className="size-3.5" /> Add Variant
              </Button>
              <Button onClick={test} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
                Test Titles
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="size-4 text-yellow-400" />
                  <span className="text-sm font-bold">Winner: Variant {result.winnerIndex + 1}</span>
                </div>
                <p className="text-xs text-muted-foreground">{result.reasoning}</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {result.results.map((r, idx) => (
                <Card key={idx} className={idx === result.winnerIndex ? 'border-yellow-500/30' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                          {idx === result.winnerIndex && (
                            <Trophy className="size-3 text-yellow-400" />
                          )}
                        </div>
                        {/* SERP Preview */}
                        <div className="rounded-md bg-white p-3 mb-2">
                          <p className="text-[13px] text-blue-700 font-medium leading-tight hover:underline cursor-pointer">
                            {r.title}
                          </p>
                          <p className="text-[11px] text-green-700 mt-0.5">example.com › page</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">Sample meta description for this page...</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`text-xl font-bold ${r.predictedCtr >= 5 ? 'text-green-400' : r.predictedCtr >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {r.predictedCtr}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">Predicted CTR</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] mb-2">
                      <span className={r.charCount <= 60 ? 'text-green-400' : 'text-yellow-400'}>
                        {r.charCount} chars
                      </span>
                      {r.charCount > 60 && <span className="text-yellow-400">(may truncate)</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-green-400 mb-0.5">Strengths</p>
                        {r.strengths.map((s, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">+ {s}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] text-red-400 mb-0.5">Weaknesses</p>
                        {r.weaknesses.map((w, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">- {w}</p>
                        ))}
                      </div>
                    </div>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SerpFeature {
  feature: string;
  available: boolean;
  currentOwner: string;
  difficulty: 'easy' | 'medium' | 'hard';
  contentFormat: string;
  implementationSteps: string[];
}

interface FeatureResult {
  keyword: string;
  summary: string;
  features: SerpFeature[];
  competitorOwnership: { competitor: string; features: string[] }[];
  recommendations: string[];
}

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400 bg-green-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  hard: 'text-red-400 bg-red-950/30',
};

export default function SearchFeatureOptimizer() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeatureResult | null>(null);

  const analyze = async () => {
    if (!keyword.trim()) { toast.error('Enter keyword'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a SERP features optimization expert. Return JSON only.' },
          { role: 'user', content: `Analyze SERP features for: ${keyword}\n\nReturn JSON:\n{\n  "keyword": "${keyword}",\n  "summary": "SERP features overview",\n  "features": [\n    {\n      "feature": "Featured Snippet|People Also Ask|Rich Results|Image Pack|Video Carousel|Knowledge Panel|Local Pack|Top Stories",\n      "available": boolean,\n      "currentOwner": "who currently owns this feature",\n      "difficulty": "easy"|"medium"|"hard",\n      "contentFormat": "required content format",\n      "implementationSteps": ["step 1", "step 2", "step 3"]\n    }\n  ],\n  "competitorOwnership": [\n    { "competitor": "competitor name", "features": ["feature 1", "feature 2"] }\n  ],\n  "recommendations": ["rec 1", "rec 2", "rec 3"]\n}\n\nGenerate 6 SERP features, 3 competitors, and 4 recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Feature analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6" />
            Search Feature Optimizer
          </h1>
          <p className="text-muted-foreground">Identify and win SERP features like snippets, PAA, and rich results</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword (e.g., how to start a blog)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyze Features
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">SERP Features: "{result.keyword}"</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Available Features ({result.features.filter(f => f.available).length}/{result.features.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.features.map((f, idx) => (
                    <div key={idx} className={`rounded-md border p-3 ${f.available ? 'border-green-500/20 hover:bg-muted/20' : 'border-border/30 opacity-60'} transition-colors`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] px-1 py-0.5 rounded ${f.available ? 'bg-green-950/30 text-green-400' : 'bg-muted/30 text-muted-foreground'}`}>{f.available ? 'available' : 'n/a'}</span>
                          <span className="text-xs font-bold">{f.feature}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${difficultyColors[f.difficulty]}`}>{f.difficulty}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Owner: {f.currentOwner}</p>
                      <p className="text-[10px] text-primary/80 mt-1">Format: {f.contentFormat}</p>
                      {f.available && (
                        <div className="mt-2 space-y-0.5">
                          {f.implementationSteps.map((s, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">{i + 1}. {s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Competitor Feature Ownership</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.competitorOwnership.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold">{c.competitor}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.features.map((f, i) => (
                          <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{f}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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

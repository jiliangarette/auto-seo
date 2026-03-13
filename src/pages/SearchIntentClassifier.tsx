import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface IntentResult {
  keyword: string;
  summary: string;
  classifications: { keyword: string; intent: string; confidence: number; reasoning: string }[];
  contentFormats: { intent: string; formats: string[]; bestFormat: string }[];
  serpFeatures: { intent: string; features: string[]; targetStrategy: string }[];
  recommendations: string[];
}

export default function SearchIntentClassifier() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);

  const classify = async () => {
    if (!keywords.trim()) { toast.error('Enter keywords to classify'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a search intent classification expert. Return JSON only.' },
          { role: 'user', content: `Classify search intent for keywords: ${keywords}\n\nReturn JSON:\n{\n  "keyword": "${keywords}",\n  "summary": "intent classification overview",\n  "classifications": [\n    { "keyword": "keyword phrase", "intent": "informational/navigational/transactional/commercial", "confidence": number(0-100), "reasoning": "why this intent" }\n  ],\n  "contentFormats": [\n    { "intent": "intent type", "formats": ["format1", "format2"], "bestFormat": "recommended format" }\n  ],\n  "serpFeatures": [\n    { "intent": "intent type", "features": ["featured snippet", "PAA"], "targetStrategy": "how to target" }\n  ],\n  "recommendations": ["recommendation 1", "recommendation 2"]\n}\n\nClassify 6 keyword variations, provide 4 content format mappings, 4 SERP feature targets, and 4 recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Intent classified');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Search Intent Classifier
          </h1>
          <p className="text-muted-foreground">Classify keywords by search intent and get content recommendations</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords (e.g., best running shoes, how to tie shoes, Nike store)" />
            <Button onClick={classify} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Classify Intent
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Keywords: {result.keyword}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Intent Classifications</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.classifications.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{c.keyword}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.intent === 'informational' ? 'bg-blue-500/20 text-blue-400' : c.intent === 'transactional' ? 'bg-green-500/20 text-green-400' : c.intent === 'commercial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>{c.intent}</span>
                          <span className="text-[10px] font-bold">{c.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{c.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Content Format Recommendations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.contentFormats.map((f, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold capitalize">{f.intent}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {f.formats.map((fmt, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground">{fmt}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-primary mt-1">Best: {f.bestFormat}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">SERP Feature Targeting</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.serpFeatures.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold capitalize">{s.intent}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.features.map((feat, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">{feat}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{s.targetStrategy}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
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

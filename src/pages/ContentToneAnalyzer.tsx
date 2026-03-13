import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ToneScore {
  tone: string;
  score: number;
  description: string;
}

interface ToneResult {
  primaryTone: string;
  audienceAlignment: number;
  tones: ToneScore[];
  adjustments: { current: string; suggestion: string; reason: string }[];
  summary: string;
}

const toneColors: Record<string, string> = {
  formal: 'bg-blue-500',
  casual: 'bg-green-500',
  persuasive: 'bg-orange-500',
  informative: 'bg-purple-500',
  authoritative: 'bg-red-500',
  friendly: 'bg-yellow-500',
  neutral: 'bg-gray-500',
  urgent: 'bg-pink-500',
};

export default function ContentToneAnalyzer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToneResult | null>(null);

  const analyze = async () => {
    if (!content.trim()) { toast.error('Enter content to analyze'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content tone analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze the tone of this content:\n\n${content.slice(0, 3000)}\n\nReturn JSON:\n{\n  "primaryTone": "formal"|"casual"|"persuasive"|"informative"|"authoritative"|"friendly"|"neutral"|"urgent",\n  "audienceAlignment": number(0-100),\n  "tones": [\n    { "tone": "tone name", "score": number(0-100), "description": "how this tone manifests" }\n  ],\n  "adjustments": [\n    { "current": "current phrasing example", "suggestion": "adjusted version", "reason": "why change" }\n  ],\n  "summary": "tone analysis overview"\n}\n\nAnalyze 5-6 tone dimensions and provide 3-4 adjustment suggestions.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Tone analysis complete');
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
            <Sparkles className="size-6" />
            Content Tone Analyzer
          </h1>
          <p className="text-muted-foreground">Detect tone, audience alignment, and get adjustment suggestions</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content here for tone analysis..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] resize-y"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyze Tone
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold capitalize text-primary">{result.primaryTone}</p>
                  <p className="text-[10px] text-muted-foreground">Primary Tone</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.audienceAlignment >= 70 ? 'text-green-400' : result.audienceAlignment >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.audienceAlignment}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Audience Alignment</p>
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
                <CardTitle className="text-sm">Tone Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.tones.map((t, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium capitalize">{t.tone}</span>
                        <span className="text-muted-foreground">{t.score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/30">
                        <div className={`h-full rounded-full ${toneColors[t.tone] ?? 'bg-primary'}`} style={{ width: `${t.score}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tone Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.adjustments.map((adj, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 space-y-1">
                      <p className="text-xs text-red-400/80 line-through">&ldquo;{adj.current}&rdquo;</p>
                      <p className="text-xs text-green-400/80">&ldquo;{adj.suggestion}&rdquo;</p>
                      <p className="text-[10px] text-muted-foreground">{adj.reason}</p>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ParagraphSentiment {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: string;
  engagementScore: number;
}

interface SentimentResult {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  overallScore: number;
  summary: string;
  emotionalTone: string;
  paragraphs: ParagraphSentiment[];
  adjustments: { current: string; suggested: string; reason: string }[];
  audienceMatch: string;
}

const sentimentColors: Record<string, string> = {
  positive: 'text-green-400',
  neutral: 'text-yellow-400',
  negative: 'text-red-400',
};

export default function ContentSentimentAnalyzer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);

  const analyze = async () => {
    if (!content.trim()) { toast.error('Enter content'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content sentiment and emotional analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze content sentiment:\n\n${content}\n\nReturn JSON:\n{\n  "overallSentiment": "positive"|"neutral"|"negative",\n  "overallScore": number(-100 to 100),\n  "summary": "sentiment overview",\n  "emotionalTone": "detected emotional tone",\n  "paragraphs": [\n    { "text": "first 50 chars of paragraph...", "sentiment": "positive"|"neutral"|"negative", "emotion": "detected emotion", "engagementScore": number(0-100) }\n  ],\n  "adjustments": [\n    { "current": "current phrasing", "suggested": "improved phrasing", "reason": "why this change" }\n  ],\n  "audienceMatch": "how well the tone matches typical reader expectations"\n}\n\nAnalyze each paragraph (or create 4-5 segments if short). Provide 3 tone adjustments.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Sentiment analysis complete');
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
            Content Sentiment Analyzer
          </h1>
          <p className="text-muted-foreground">Detect emotional tone and engagement signals in content</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste content to analyze..."
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyze Sentiment
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold ${sentimentColors[result.overallSentiment]}`}>
                      Overall: {result.overallSentiment.charAt(0).toUpperCase() + result.overallSentiment.slice(1)}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                    <p className="text-[10px] text-primary/80 mt-1">Tone: {result.emotionalTone}</p>
                  </div>
                  <p className={`text-3xl font-bold ${result.overallScore > 20 ? 'text-green-400' : result.overallScore > -20 ? 'text-yellow-400' : 'text-red-400'}`}>{result.overallScore}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Paragraph Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.paragraphs.map((p, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] ${sentimentColors[p.sentiment]}`}>{p.sentiment}</span>
                        <span className="text-[9px] text-muted-foreground">Engagement: {p.engagementScore}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.text}</p>
                      <p className="text-[10px] text-primary/60 mt-1">Emotion: {p.emotion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tone Adjustments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.adjustments.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs text-red-400 line-through">{a.current}</p>
                      <p className="text-xs text-green-400 mt-1">{a.suggested}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{a.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardContent className="pt-4">
                <p className="text-xs font-bold mb-1">Audience Match</p>
                <p className="text-xs text-muted-foreground">{result.audienceMatch}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

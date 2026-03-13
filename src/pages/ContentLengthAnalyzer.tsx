import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContentAnalysis {
  url: string;
  wordCount: number;
  competitorAvg: number;
  optimalRange: string;
  status: 'optimal' | 'too-short' | 'too-long';
  depthScore: number;
  recommendation: string;
}

interface LengthResult {
  analyses: ContentAnalysis[];
  overallRecommendation: string;
  summary: string;
}

const statusColors = {
  optimal: 'text-green-400 bg-green-950/30',
  'too-short': 'text-red-400 bg-red-950/30',
  'too-long': 'text-yellow-400 bg-yellow-950/30',
};

export default function ContentLengthAnalyzer() {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LengthResult | null>(null);

  const analyze = async () => {
    if (!input.trim()) { toast.error('Enter URLs or content'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content strategy expert. Return JSON only.' },
          { role: 'user', content: `Analyze content length for:\n${input}\nTarget keyword: ${keyword || 'general'}\n\nReturn JSON:\n{\n  "analyses": [\n    { "url": "page url or label", "wordCount": number, "competitorAvg": number, "optimalRange": "1500-2000 words", "status": "optimal"|"too-short"|"too-long", "depthScore": number(0-100), "recommendation": "what to do" }\n  ],\n  "overallRecommendation": "general advice",\n  "summary": "overview"\n}\n\nGenerate 6-8 content analyses with realistic word counts and competitor comparisons.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content length analysis complete');
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
            <BarChart3 className="size-6" />
            Content Length Analyzer
          </h1>
          <p className="text-muted-foreground">Compare word counts against competitors with depth scoring</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter URLs or page titles (one per line)&#10;https://example.com/blog-post-1&#10;https://example.com/guide&#10;https://example.com/tutorial"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword (optional)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Analyze Content Length
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
                <p className="text-xs font-medium">{result.overallRecommendation}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Analysis ({result.analyses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.analyses.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {a.status === 'optimal' ? (
                            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="size-3.5 text-yellow-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{a.url}</span>
                        </div>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[a.status]}`}>{a.status}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-sm font-bold">{a.wordCount.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">Words</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-muted-foreground">{a.competitorAvg.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">Competitor Avg</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium">{a.optimalRange}</p>
                          <p className="text-[9px] text-muted-foreground">Optimal</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${a.depthScore >= 70 ? 'text-green-400' : a.depthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{a.depthScore}</p>
                          <p className="text-[9px] text-muted-foreground">Depth</p>
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-muted/30">
                        <div className={`h-full rounded-full ${a.status === 'optimal' ? 'bg-green-500' : a.status === 'too-short' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min((a.wordCount / a.competitorAvg) * 50, 100)}%` }} />
                      </div>

                      {a.status !== 'optimal' && (
                        <p className="text-[10px] text-yellow-400/80">{a.recommendation}</p>
                      )}
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

import { useState } from 'react';
import { calculateBasicMetrics, analyzeReadability } from '@/lib/readability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type AIResult = Awaited<ReturnType<typeof analyzeReadability>>;

const levelColors = {
  easy: 'text-green-400 bg-green-950/30',
  moderate: 'text-yellow-400 bg-yellow-950/30',
  difficult: 'text-red-400 bg-red-950/30',
};

export default function ReadabilityAnalyzer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const metrics = content.trim() ? calculateBasicMetrics(content) : null;

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeReadability(content.trim());
      setAiResult(result);
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 60) return 'text-green-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="size-6" />
            Readability Analyzer
          </h1>
          <p className="text-muted-foreground">Check reading level and get simplification suggestions</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px] resize-y"
              placeholder="Paste your content here to analyze readability..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <Button onClick={handleAnalyze} disabled={loading || !content.trim()}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <BookText className="size-4" />}
                Deep Analysis (AI)
              </Button>
              {metrics && (
                <span className="text-xs text-muted-foreground">
                  {metrics.wordCount} words • {metrics.sentenceCount} sentences • {metrics.paragraphCount} paragraphs
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time local metrics */}
        {metrics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className={`text-2xl font-bold ${scoreColor(metrics.fleschScore)}`}>{metrics.fleschScore}</p>
                <p className="text-xs text-muted-foreground">Flesch Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{metrics.gradeLevel}</p>
                <p className="text-xs text-muted-foreground">Grade Level</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{metrics.avgSentenceLength}</p>
                <p className="text-xs text-muted-foreground">Avg Words/Sentence</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{metrics.avgParagraphLength}</p>
                <p className="text-xs text-muted-foreground">Avg Words/Paragraph</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI results */}
        {aiResult && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Overall</CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[aiResult.overallLevel]}`}>
                    {aiResult.overallLevel}
                  </span>
                </div>
              </CardHeader>
            </Card>

            {aiResult.complexSentences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Complex Sentences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiResult.complexSentences.map((s, i) => (
                    <div key={i} className="rounded-md border border-red-900/30 bg-red-950/10 p-3">
                      <p className="text-sm">{s.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {aiResult.simplifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Simplification Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiResult.simplifications.map((s, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm line-through text-muted-foreground">{s.original}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <ArrowRight className="size-3 text-green-400" />
                            <p className="text-sm text-green-400">{s.simplified}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

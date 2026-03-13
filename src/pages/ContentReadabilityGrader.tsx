import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ReadabilityScore {
  name: string;
  score: number;
  grade: string;
  description: string;
}

interface ComplexSentence {
  text: string;
  reason: string;
  suggestion: string;
}

interface GraderResult {
  overallGrade: string;
  gradeLevel: number;
  targetAudience: string;
  scores: ReadabilityScore[];
  complexSentences: ComplexSentence[];
  recommendations: string[];
  summary: string;
}

export default function ContentReadabilityGrader() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GraderResult | null>(null);

  const analyze = async () => {
    if (!content.trim()) { toast.error('Enter content to analyze'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a readability analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze readability of this content:\n\n${content.slice(0, 3000)}\n\nReturn JSON:\n{\n  "overallGrade": "A"|"B"|"C"|"D"|"F",\n  "gradeLevel": number (school grade level),\n  "targetAudience": "description",\n  "scores": [\n    { "name": "Flesch-Kincaid", "score": number, "grade": "Easy|Medium|Hard", "description": "brief explanation" },\n    { "name": "Gunning Fog", "score": number, "grade": "Easy|Medium|Hard", "description": "brief" },\n    { "name": "Coleman-Liau", "score": number, "grade": "Easy|Medium|Hard", "description": "brief" },\n    { "name": "SMOG Index", "score": number, "grade": "Easy|Medium|Hard", "description": "brief" }\n  ],\n  "complexSentences": [\n    { "text": "the complex sentence", "reason": "why it's complex", "suggestion": "simplified version" }\n  ],\n  "recommendations": ["tip 1", "tip 2"],\n  "summary": "overview"\n}\n\nIdentify 3-5 complex sentences and provide 4-6 recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Readability analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'Easy') return 'text-green-400';
    if (grade === 'B' || grade === 'Medium') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="size-6" />
            Content Readability Grader
          </h1>
          <p className="text-muted-foreground">Multi-metric readability analysis with sentence-level highlighting</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content here for readability analysis..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] resize-y"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
              Analyze Readability
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/20">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${gradeColor(result.overallGrade)}`}>{result.overallGrade}</p>
                  <p className="text-[10px] text-muted-foreground">Overall Grade</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.gradeLevel}</p>
                  <p className="text-[10px] text-muted-foreground">Grade Level</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-sm font-medium text-primary">{result.targetAudience}</p>
                  <p className="text-[10px] text-muted-foreground">Target Audience</p>
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
                <CardTitle className="text-sm">Readability Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.scores.map((score, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{score.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{score.score}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${gradeColor(score.grade)} ${score.grade === 'Easy' ? 'bg-green-950/30' : score.grade === 'Medium' ? 'bg-yellow-950/30' : 'bg-red-950/30'}`}>
                            {score.grade}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{score.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Complex Sentences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.complexSentences.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 space-y-1">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="size-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <p className="text-sm italic">&ldquo;{s.text}&rdquo;</p>
                      </div>
                      <p className="text-[10px] text-yellow-400/80 ml-5">{s.reason}</p>
                      <p className="text-[10px] text-green-400/80 ml-5">Suggestion: {s.suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span className="text-muted-foreground">{rec}</span>
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

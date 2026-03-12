import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Award,
  Loader2,
  User,
  BookOpen,
  Shield,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface PillarScore {
  name: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

interface EeatResult {
  overallScore: number;
  pillars: PillarScore[];
  authorRecommendations: string[];
  credentialSuggestions: string[];
  summary: string;
}

const pillarIcons: Record<string, typeof Award> = {
  Experience: User,
  Expertise: BookOpen,
  Authoritativeness: Award,
  Trustworthiness: Shield,
};

export default function EeatAnalyzer() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EeatResult | null>(null);

  const analyze = async () => {
    if (!content.trim() && !url.trim()) {
      toast.error('Enter content or URL');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a Google E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze this content for E-E-A-T signals:

URL: ${url || 'Not provided'}
Content: ${content || 'Analyze based on URL context'}

Score each E-E-A-T pillar and provide improvement suggestions.

Return JSON:
{
  "overallScore": number(0-100),
  "pillars": [
    { "name": "Experience", "score": number(0-100), "strengths": ["strength1"], "improvements": ["improvement1"] },
    { "name": "Expertise", "score": number(0-100), "strengths": ["strength1"], "improvements": ["improvement1"] },
    { "name": "Authoritativeness", "score": number(0-100), "strengths": ["strength1"], "improvements": ["improvement1"] },
    { "name": "Trustworthiness", "score": number(0-100), "strengths": ["strength1"], "improvements": ["improvement1"] }
  ],
  "authorRecommendations": ["author bio suggestion 1", "suggestion 2"],
  "credentialSuggestions": ["credential to add 1", "credential 2"],
  "summary": "overall E-E-A-T assessment"
}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('E-E-A-T analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="size-6" />
            E-E-A-T Analyzer
          </h1>
          <p className="text-muted-foreground">Score content on Experience, Expertise, Authoritativeness & Trust</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content to Analyze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Page URL (optional)</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" className="font-mono text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Content</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the content to analyze for E-E-A-T signals..."
              />
            </div>
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
              Analyze E-E-A-T
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="relative size-20 shrink-0">
                    <svg className="size-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                        strokeDasharray={`${result.overallScore * 2.64} 264`} strokeLinecap="round"
                        className={getScoreColor(result.overallScore)} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>{result.overallScore}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Overall E-E-A-T Score</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{result.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {result.pillars.map((pillar) => {
                const Icon = pillarIcons[pillar.name] ?? Star;
                return (
                  <Card key={pillar.name}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-primary" />
                          <CardTitle className="text-sm">{pillar.name}</CardTitle>
                        </div>
                        <span className={`text-lg font-bold ${getScoreColor(pillar.score)}`}>{pillar.score}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-1.5 rounded-full bg-muted/30 mb-3">
                        <div className={`h-full rounded-full ${getScoreBg(pillar.score)}`} style={{ width: `${pillar.score}%` }} />
                      </div>
                      {pillar.strengths.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-green-400 mb-0.5">Strengths</p>
                          {pillar.strengths.map((s, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">+ {s}</p>
                          ))}
                        </div>
                      )}
                      {pillar.improvements.length > 0 && (
                        <div>
                          <p className="text-[10px] text-yellow-400 mb-0.5">Improvements</p>
                          {pillar.improvements.map((im, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">- {im}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Author Bio Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.authorRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <User className="size-3 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Credential Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.credentialSuggestions.map((cred, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <Award className="size-3 text-yellow-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{cred}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

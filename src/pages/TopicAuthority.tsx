import { useState } from 'react';
import { mapTopicAuthority, type TopicAuthorityResult } from '@/lib/topic-authority';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function TopicAuthority() {
  const [niche, setNiche] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TopicAuthorityResult | null>(null);

  const handleAnalyze = async () => {
    if (!niche.trim()) {
      toast.error('Enter your niche');
      return;
    }
    const articles = content.split('\n').map((c) => c.trim()).filter(Boolean);
    setLoading(true);
    try {
      const res = await mapTopicAuthority(niche.trim(), articles);
      setResult(res);
      toast.success('Topic authority mapped');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const coverageColor = (c: number) => (c >= 70 ? 'text-green-400' : c >= 40 ? 'text-yellow-400' : 'text-red-400');
  const coverageBg = (c: number) => (c >= 70 ? 'bg-green-400' : c >= 40 ? 'bg-yellow-400' : 'bg-red-400');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Map className="size-6" />
            Topic Authority Mapper
          </h1>
          <p className="text-muted-foreground">Map your topical coverage and find gaps to build authority</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Niche / Topic Area</label>
              <Input placeholder="e.g., SEO for small businesses" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Existing Content (one title per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                placeholder={"How to Do Keyword Research\n10 Best SEO Tools for 2024\nOn-Page SEO Guide"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Map className="size-4" />}
              Map Authority
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Overall Authority */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${coverageColor(result.overallAuthority)}`}>{result.overallAuthority}</p>
                  <p className="text-xs text-muted-foreground">Overall Authority Score</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${coverageColor(result.totalCoverage)}`}>{result.totalCoverage}%</p>
                  <p className="text-xs text-muted-foreground">Niche Coverage</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{result.topics.length}</p>
                  <p className="text-xs text-muted-foreground">Topic Areas Identified</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Priorities */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="size-4 text-yellow-400" />
                  Top Priority Articles to Write
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {result.topPriorities.map((article, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm">{article}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Topic Areas */}
            <div className="grid gap-4 md:grid-cols-2">
              {result.topics.map((topic, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{topic.topic}</CardTitle>
                      <span className={`text-sm font-bold ${coverageColor(topic.coverage)}`}>{topic.coverage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${coverageBg(topic.coverage)}`}
                        style={{ width: `${topic.coverage}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topic.articlesFound.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Your existing articles</p>
                        {topic.articlesFound.map((a, j) => (
                          <p key={j} className="text-xs text-green-400">• {a}</p>
                        ))}
                      </div>
                    )}
                    {topic.uncoveredSubtopics.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Uncovered subtopics</p>
                        {topic.uncoveredSubtopics.map((s, j) => (
                          <p key={j} className="text-xs text-red-400">• {s}</p>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Recommended articles</p>
                      {topic.recommendedArticles.map((a, j) => (
                        <p key={j} className="text-xs text-primary">• {a}</p>
                      ))}
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

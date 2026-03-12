import { useState } from 'react';
import { analyzeCompetitiveResearch, type CompetitiveResearchResult } from '@/lib/competitive-research';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Loader2, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const difficultyColors = {
  easy: 'text-green-400 bg-green-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  hard: 'text-red-400 bg-red-950/30',
};

const priorityColors = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-muted-foreground',
};

export default function CompetitiveResearch() {
  const [yourUrl, setYourUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitiveResearchResult | null>(null);

  const handleAnalyze = async () => {
    if (!yourUrl.trim() || !competitors.trim()) {
      toast.error('Enter your URL and at least one competitor');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeCompetitiveResearch(
        yourUrl.trim(),
        keywords.split(',').map((k) => k.trim()).filter(Boolean),
        competitors.split('\n').map((c) => c.trim()).filter(Boolean)
      );
      setResult(res);
      toast.success('Competitive analysis complete');
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
            <Swords className="size-6" />
            Competitive Research
          </h1>
          <p className="text-muted-foreground">Analyze competitor strategies, find content gaps, and track positioning</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Website URL</label>
              <Input placeholder="https://yoursite.com" value={yourUrl} onChange={(e) => setYourUrl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Keywords (comma-separated)</label>
              <Input placeholder="seo tools, keyword research, content optimization" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Competitor URLs (one per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                placeholder={"https://competitor1.com\nhttps://competitor2.com"}
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              Analyze Competition
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* SERP Overlap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="size-4" />
                  SERP Overlap — {result.serpOverlap.overlapPercentage}% shared keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.serpOverlap.sharedKeywords.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 text-xs text-muted-foreground">Keyword</th>
                          <th className="pb-2 text-xs text-muted-foreground">Your Position</th>
                          <th className="pb-2 text-xs text-muted-foreground">Competitor Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.serpOverlap.sharedKeywords.map((kw, i) => (
                          <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                            <td className="py-2 font-medium">{kw.keyword}</td>
                            <td className="py-2">{kw.yourPosition}</td>
                            <td className="py-2">{kw.competitorPosition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unique to you ({result.serpOverlap.uniqueToYou.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {result.serpOverlap.uniqueToYou.map((kw, i) => (
                        <span key={i} className="rounded-full bg-green-950/30 px-2 py-0.5 text-[10px] text-green-400">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unique to competitors ({result.serpOverlap.uniqueToCompetitor.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {result.serpOverlap.uniqueToCompetitor.map((kw, i) => (
                        <span key={i} className="rounded-full bg-red-950/30 px-2 py-0.5 text-[10px] text-red-400">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Content Gaps ({result.contentGaps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.contentGaps.map((gap, i) => (
                    <div key={i} className={`rounded-md border border-border/50 p-3 ${i % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{gap.keyword}</p>
                          <p className="text-xs text-muted-foreground">{gap.competitorUrl} • Vol: {gap.estimatedVolume}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColors[gap.difficulty]}`}>
                            {gap.difficulty}
                          </span>
                          <span className={`text-xs font-medium ${priorityColors[gap.priority]}`}>
                            {gap.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="size-4" />
                  Content Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.contentFrequency.map((cf, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{cf.competitor}</p>
                        <span className="text-xs text-muted-foreground">{cf.estimatedPostsPerMonth} posts/mo</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cf.topTopics.map((topic, j) => (
                          <span key={j} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{topic}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Types: {cf.contentTypes.join(', ')} • Consistency: <span className={cf.consistency === 'high' ? 'text-green-400' : cf.consistency === 'medium' ? 'text-yellow-400' : 'text-red-400'}>{cf.consistency}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Positioning Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Competitive Positioning Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-xs text-muted-foreground">Competitor</th>
                        <th className="pb-2 text-center text-xs text-muted-foreground">Content Quality</th>
                        <th className="pb-2 text-center text-xs text-muted-foreground">Technical SEO</th>
                        <th className="pb-2 text-center text-xs text-muted-foreground">Content Volume</th>
                        <th className="pb-2 text-center text-xs text-muted-foreground">Backlinks</th>
                        <th className="pb-2 text-center text-xs text-muted-foreground">Overall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.positioning.map((p, i) => (
                        <tr key={i} className={`border-b border-border/30 ${i === 0 ? 'bg-primary/5' : i % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                          <td className={`py-2 font-medium ${i === 0 ? 'text-primary' : ''}`}>{p.competitor}</td>
                          <td className="py-2 text-center">
                            <ScoreBar value={p.contentQuality} />
                          </td>
                          <td className="py-2 text-center">
                            <ScoreBar value={p.technicalSeo} />
                          </td>
                          <td className="py-2 text-center">
                            <ScoreBar value={p.contentVolume} />
                          </td>
                          <td className="py-2 text-center">
                            <ScoreBar value={p.backlinks} />
                          </td>
                          <td className={`py-2 text-center font-bold ${scoreColor(p.overallScore)}`}>
                            {p.overallScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs tabular-nums w-7 text-right">{value}</span>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

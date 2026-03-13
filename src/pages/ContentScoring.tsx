import { useState } from 'react';
import { scoreContent, type ScoringResult } from '@/lib/content-scoring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentScoring() {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);

  const handleScore = async () => {
    if (!content.trim() || !keyword.trim()) {
      toast.error('Enter content and target keyword');
      return;
    }
    setLoading(true);
    try {
      const res = await scoreContent(content.trim(), keyword.trim());
      setResult(res);
      toast.success('Scoring complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => (s >= 70 ? 'text-green-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="size-6" />
            Content Scoring
          </h1>
          <p className="text-muted-foreground">Score content against SEO best practices with actionable checklist</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keyword</label>
              <Input placeholder="e.g., best seo tools 2024" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Content (paste your article/page content)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px] resize-y"
                placeholder="Paste your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <Button onClick={handleScore} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
              Score Content
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Overall Score */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative size-24">
                    <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-800" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                        className={scoreColor(result.overallScore)}
                        stroke="currentColor"
                        strokeDasharray={`${result.overallScore * 2.64} 264`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${scoreColor(result.overallScore)}`}>
                      {result.overallScore}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <ScoreBar label="Heading Structure" value={result.headingStructure.score} />
                    <ScoreBar label="Keyword Placement" value={result.keywordPlacement.score} />
                    <ScoreBar label="Content Quality" value={result.contentQuality.score} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Heading Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Heading Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {result.headingStructure.hierarchy.map((h, i) => (
                      <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{h}</span>
                    ))}
                  </div>
                  {result.headingStructure.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-yellow-400">• {issue}</p>
                  ))}
                  {result.headingStructure.issues.length === 0 && (
                    <p className="text-xs text-green-400">No heading issues found</p>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Placement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Keyword Placement — "{keyword}"</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <PlacementRow label="In title" passed={result.keywordPlacement.inTitle} />
                  <PlacementRow label="In meta description" passed={result.keywordPlacement.inMeta} />
                  <PlacementRow label="In first paragraph" passed={result.keywordPlacement.inFirstParagraph} />
                  <PlacementRow label="In headings" passed={result.keywordPlacement.inHeadings} />
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">Keyword density</span>
                    <span className={`text-xs font-medium ${result.keywordPlacement.density >= 0.5 && result.keywordPlacement.density <= 2.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {result.keywordPlacement.density}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                  <span>{result.contentQuality.wordCount} words</span>
                  <span>Readability: {result.contentQuality.readabilityLevel}</span>
                </div>
                {result.contentQuality.suggestions.map((s, i) => (
                  <p key={i} className="text-xs">• {s}</p>
                ))}
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SEO Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {result.checklist.map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded px-2 py-1.5 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                    {item.passed ? (
                      <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="size-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-sm flex-1">{item.item}</span>
                    <span className={`text-[10px] font-medium ${
                      item.priority === 'high' ? 'text-red-400' : item.priority === 'medium' ? 'text-yellow-400' : 'text-muted-foreground'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-32">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value}</span>
    </div>
  );
}

function PlacementRow({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs">{label}</span>
      {passed ? (
        <CheckCircle2 className="size-3.5 text-green-400" />
      ) : (
        <XCircle className="size-3.5 text-red-400" />
      )}
    </div>
  );
}

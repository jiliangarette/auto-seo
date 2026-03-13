import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { optimizeContent } from '@/lib/content-optimizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Copy, ArrowRight, Globe } from 'lucide-react';
import { toast } from 'sonner';

type Result = Awaited<ReturnType<typeof optimizeContent>>;

export default function ContentOptimizer() {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<Result | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !keyword.trim()) return;
    setLoading(true);
    try {
      const data = await optimizeContent(content.trim(), keyword.trim());
      setResult(data);
      toast.success('Content analyzed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to optimize');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const priorityColor = {
    high: 'bg-red-950/30 text-red-400',
    medium: 'bg-yellow-950/30 text-yellow-400',
    low: 'bg-blue-950/30 text-blue-400',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wand2 className="size-6" />
            Content Optimizer
          </h1>
          <p className="text-muted-foreground">Paste content + target keyword for AI optimization suggestions</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6">
            <form onSubmit={handleOptimize} className="space-y-3">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Target keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                  className="pl-10 bg-background/60 border-border/30 h-11"
                />
              </div>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[180px] resize-y"
                placeholder="Paste your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                Optimize
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Score + Metrics */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${scoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-lg font-bold">{result.keywordDensity.current}%</p>
                  <p className="text-xs text-muted-foreground">
                    Density (rec: {result.keywordDensity.recommended}%)
                  </p>
                  <p className="text-[10px] text-muted-foreground">{result.keywordDensity.status}</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-lg font-bold ${scoreColor(result.readability.score)}`}>
                    {result.readability.score}
                  </p>
                  <p className="text-xs text-muted-foreground">Readability</p>
                  <p className="text-[10px] text-muted-foreground">{result.readability.level}</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-lg font-bold">{result.wordCount.current}</p>
                  <p className="text-xs text-muted-foreground">
                    Words (rec: {result.wordCount.recommended})
                  </p>
                  <p className="text-[10px] text-muted-foreground">{result.wordCount.status}</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <CardTitle className="text-sm">Action Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColor[item.priority]}`}>
                      {item.priority}
                    </span>
                    <span className="text-sm">{item.action}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Before/After Toggle */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {showOptimized ? 'Optimized Content' : 'Original Content'}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOptimized(!showOptimized)}
                    >
                      <ArrowRight className="size-4" />
                      {showOptimized ? 'Show Original' : 'Show Optimized'}
                    </Button>
                    {showOptimized && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(result.optimizedContent);
                          toast.success('Copied');
                        }}
                      >
                        <Copy className="size-4" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-4 text-sm">
                  {showOptimized ? result.optimizedContent : content}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

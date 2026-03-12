import { useState } from 'react';
import { auditPageSpeed } from '@/lib/speed-auditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Result = Awaited<ReturnType<typeof auditPageSpeed>>;

const scoreColors = {
  good: 'text-green-400 bg-green-950/30',
  'needs-improvement': 'text-yellow-400 bg-yellow-950/30',
  poor: 'text-red-400 bg-red-950/30',
};

const priorityColors = {
  high: 'bg-red-950/30 text-red-400',
  medium: 'bg-yellow-950/30 text-yellow-400',
  low: 'bg-blue-950/30 text-blue-400',
};

export default function PageSpeed() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const data = await auditPageSpeed(url.trim());
      setResult(data);
      toast.success('Speed audit complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const overallColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            Page Speed Insights
          </h1>
          <p className="text-muted-foreground">AI-estimated Core Web Vitals and performance recommendations</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleAudit} className="flex gap-2">
              <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required className="flex-1" />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
                Audit
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Overall Score */}
            <Card>
              <CardContent className="pt-6 flex items-center gap-6">
                <div className="relative flex size-24 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={8} />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="currentColor"
                      strokeWidth={8}
                      strokeDasharray={`${(result.overallScore / 100) * 264} 264`}
                      className={overallColor(result.overallScore)}
                    />
                  </svg>
                  <span className={`absolute text-2xl font-bold ${overallColor(result.overallScore)}`}>
                    {result.overallScore}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Performance Score</h3>
                  <p className="text-sm text-muted-foreground">{result.url}</p>
                </div>
              </CardContent>
            </Card>

            {/* Core Web Vitals */}
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(result.metrics).map(([key, metric]) => (
                <Card key={key}>
                  <CardContent className="pt-4 text-center space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">{key}</p>
                    <p className={`text-xl font-bold ${scoreColors[metric.score].split(' ')[0]}`}>
                      {metric.value}
                    </p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${scoreColors[metric.score]}`}>
                      {metric.score}
                    </span>
                    <p className="text-xs text-muted-foreground">{metric.suggestion}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendations ({result.recommendations.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border border-border/50 p-3">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${priorityColors[rec.priority]}`}>
                      {rec.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">{rec.category}</span> — {rec.impact}
                      </p>
                    </div>
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

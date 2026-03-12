import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Globe, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SpeedIssue {
  issue: string;
  category: string;
  impact: string;
  priority: number;
  currentEstimate: string;
  afterEstimate: string;
  recommendation: string;
  effort: string;
}

interface SpeedResult {
  url: string;
  performanceScore: number;
  loadTime: string;
  pageSize: string;
  requestCount: number;
  summary: string;
  issues: SpeedIssue[];
  coreWebVitals: { metric: string; value: string; rating: string; target: string }[];
}

function ScoreRing({ score }: { score: number }) {
  const r = 44; const c = 2 * Math.PI * r; const p = (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/20" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - p} className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">Speed</span>
      </div>
    </div>
  );
}

export default function SiteSpeedAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpeedResult | null>(null);

  const analyze = async () => {
    if (!url.trim()) { toast.error('Enter a URL'); return; }
    setLoading(true);
    try {
      const u = url.startsWith('http') ? url : `https://${url}`;
      let siteData = '';
      try {
        const start = performance.now();
        const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
        const html = await res.text();
        const loadMs = Math.round(performance.now() - start);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const cssCount = doc.querySelectorAll('link[rel="stylesheet"]').length;
        const jsCount = doc.querySelectorAll('script[src]').length;
        const inlineJs = doc.querySelectorAll('script:not([src])').length;
        const inlineCss = doc.querySelectorAll('style').length;
        const imgCount = doc.querySelectorAll('img').length;
        const lazyImgs = doc.querySelectorAll('img[loading="lazy"]').length;
        const htmlSize = new Blob([html]).size;
        const hasPreconnect = doc.querySelectorAll('link[rel="preconnect"]').length;
        const hasPrefetch = doc.querySelectorAll('link[rel="prefetch"], link[rel="preload"]').length;
        siteData = `URL: ${u}\nLoadTime: ${loadMs}ms\nHTMLSize: ${(htmlSize / 1024).toFixed(1)}KB\nCSS files: ${cssCount}\nJS files: ${jsCount}\nInline JS: ${inlineJs}\nInline CSS: ${inlineCss}\nImages: ${imgCount}\nLazy images: ${lazyImgs}\nPreconnect: ${hasPreconnect}\nPrefetch/Preload: ${hasPrefetch}`;
      } catch {
        siteData = `URL: ${u} (could not fetch — analyze based on URL)`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a web performance expert. Analyze site speed data and provide optimization recommendations. Return JSON only.' },
          { role: 'user', content: `Analyze performance for:\n\n${siteData}\n\nReturn JSON:\n{"url":"${url}","performanceScore":0-100,"loadTime":"Xms","pageSize":"XKB","requestCount":number,"summary":"brief","issues":[{"issue":"name","category":"category","impact":"high/medium/low","priority":1-10,"currentEstimate":"current","afterEstimate":"after fix","recommendation":"specific fix","effort":"easy/medium/hard"}],"coreWebVitals":[{"metric":"LCP/FID/CLS/FCP/TTFB","value":"value","rating":"good/needs-improvement/poor","target":"target value"}]}\n\nGenerate 6-8 issues sorted by priority and 5 Core Web Vitals. Base on real data found.` },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      setResult(JSON.parse(response.choices[0].message.content ?? '{}'));
      toast.success('Speed analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const impactColor = (i: string) => i === 'high' ? 'text-red-400 bg-red-500/10' : i === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-sky-400 bg-sky-500/10';
  const ratingColor = (r: string) => r === 'good' ? 'text-emerald-400' : r === 'poor' ? 'text-red-400' : 'text-amber-400';

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Zap className="size-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Site Speed Analyzer</h1>
            <p className="text-xs text-muted-foreground">Identify performance bottlenecks and get optimization fixes</p>
          </div>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to analyze (e.g., mybusiness.com)" className="pl-9 bg-background/50 border-border/40" onKeyDown={(e) => e.key === 'Enter' && analyze()} />
            </div>
            <Button onClick={analyze} disabled={loading} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
              {loading ? 'Analyzing speed...' : 'Analyze Speed'}
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="size-14 rounded-full border-2 border-t-amber-400 border-r-orange-400 border-b-transparent border-l-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Loading page and measuring performance...</p>
          </div>
        )}

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-[auto_1fr]">
              <Card className="border-border/40 bg-card/50">
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 px-8">
                  <ScoreRing score={result.performanceScore} />
                </CardContent>
              </Card>
              <div className="grid gap-3 grid-cols-3">
                <Card className="border-border/40 bg-card/50">
                  <CardContent className="flex flex-col items-center justify-center pt-4 pb-4">
                    <Clock className="size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{result.loadTime}</p>
                    <p className="text-[10px] text-muted-foreground">Load Time</p>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/50">
                  <CardContent className="flex flex-col items-center justify-center pt-4 pb-4">
                    <ArrowDown className="size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{result.pageSize}</p>
                    <p className="text-[10px] text-muted-foreground">Page Size</p>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/50">
                  <CardContent className="flex flex-col items-center justify-center pt-4 pb-4">
                    <Globe className="size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{result.requestCount}</p>
                    <p className="text-[10px] text-muted-foreground">Requests</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Core Web Vitals</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-5">
                  {result.coreWebVitals.map((v, i) => (
                    <div key={i} className="rounded-lg border border-border/30 p-3 bg-background/30 text-center">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{v.metric}</p>
                      <p className={`text-lg font-bold mt-1 ${ratingColor(v.rating)}`}>{v.value}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${ratingColor(v.rating)}`}>{v.rating}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Target: {v.target}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Optimization Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div key={i} className="rounded-lg border border-border/30 p-3 bg-background/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{issue.priority}</span>
                        <span className="text-sm font-medium">{issue.issue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${impactColor(issue.impact)}`}>{issue.impact}</span>
                        <span className="text-[10px] text-muted-foreground">{issue.effort}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{issue.recommendation}</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-red-400">{issue.currentEstimate}</span>
                      <ArrowUp className="size-3 text-emerald-400" />
                      <span className="text-emerald-400">{issue.afterEstimate}</span>
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

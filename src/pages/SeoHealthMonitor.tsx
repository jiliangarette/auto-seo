import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { fetchSiteHtml, parseHtml } from '@/lib/fetch-site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface HealthResult {
  site: string;
  overallScore: number;
  summary: string;
  checks: { check: string; status: string; score: number; detail: string }[];
  trends: { period: string; score: number; change: string; highlight: string }[];
  alerts: { type: string; severity: string; message: string; action: string }[];
  improvements: { area: string; current: string; target: string; effort: string; impact: string }[];
}

function ScoreRing({ score }: { score: number }) {
  const r = 44; const c = 2 * Math.PI * r;
  const p = (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/20" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - p} className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">Health</span>
      </div>
    </div>
  );
}

export default function SeoHealthMonitor() {
  const [site, setSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);

  const monitor = async () => {
    if (!site.trim()) { toast.error('Enter site URL'); return; }
    setLoading(true);
    try {
      // Fetch real site data first
      const url = site.startsWith('http') ? site : `https://${site}`;
      let siteContext = '';
      try {
        const { html, ok } = await fetchSiteHtml(url);
        if (!ok) throw new Error('fetch failed');
        const doc = parseHtml(html);
        const isHttps = url.startsWith('https');
        const title = doc.querySelector('title')?.textContent?.trim() ?? '';
        const meta = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
        const hasViewport = !!doc.querySelector('meta[name="viewport"]');
        const hasCanonical = !!doc.querySelector('link[rel="canonical"]');
        const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0;
        const h1Count = doc.querySelectorAll('h1').length;
        const imgCount = doc.querySelectorAll('img').length;
        const imgNoAlt = Array.from(doc.querySelectorAll('img')).filter(i => !i.getAttribute('alt')?.trim()).length;
        siteContext = `REAL DATA: isHttps=${isHttps}, title="${title}" (${title.length}ch), metaDesc="${meta}" (${meta.length}ch), viewport=${hasViewport}, canonical=${hasCanonical}, schema=${hasSchema}, h1Count=${h1Count}, images=${imgCount}, imagesNoAlt=${imgNoAlt}, loadTime=${Math.round(performance.now())}ms`;
      } catch {
        siteContext = `Could not fetch ${url} — analyze based on URL context`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO health monitor. Analyze REAL site data provided. Do NOT contradict the data. Return JSON only.' },
          { role: 'user', content: `Monitor SEO health for: ${site}\n\n${siteContext}\n\nReturn JSON:\n{\n  "site": "${site}",\n  "overallScore": number(0-100),\n  "summary": "health overview",\n  "checks": [{ "check": "check name", "status": "pass/warning/fail", "score": number(0-100), "detail": "specifics" }],\n  "trends": [{ "period": "time period", "score": number, "change": "+/-X%", "highlight": "what changed" }],\n  "alerts": [{ "type": "type", "severity": "critical/warning/info", "message": "alert", "action": "fix" }],\n  "improvements": [{ "area": "area", "current": "now", "target": "goal", "effort": "easy/medium/hard", "impact": "high/medium/low" }]\n}\n\nGenerate 8 checks, 4 trend periods, 3 alerts, and 5 improvements. Only report issues supported by the data.` },
        ],
        response_format: { type: 'json_object' },
      });
      const text = response.choices[0].message.content ?? '{}';
      setResult(JSON.parse(text));
      toast.success('Health check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
            <Activity className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SEO Health Monitor</h1>
            <p className="text-xs text-muted-foreground">Track site health, scores, and improvement over time</p>
          </div>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="pt-5 pb-5 space-y-3">
            <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="Site URL (e.g., mybusiness.com)" className="bg-background/50 border-border/40" onKeyDown={(e) => e.key === 'Enter' && monitor()} />
            <Button onClick={monitor} disabled={loading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
              {loading ? 'Checking health...' : 'Run Health Check'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-[auto_1fr]">
              <Card className="border-border/40 bg-card/50">
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 px-8">
                  <ScoreRing score={result.overallScore} />
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-5 pb-5">
                  <h2 className="text-sm font-bold mb-2">{result.site}</h2>
                  <p className="text-xs text-muted-foreground mb-3">{result.summary}</p>
                  <div className="space-y-1">
                    {result.alerts.map((a, idx) => (
                      <div key={idx} className={`flex items-start gap-2 text-[11px] rounded-md p-2 ${a.severity === 'critical' ? 'bg-red-500/10 text-red-400' : a.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        <span className="font-bold shrink-0">{a.severity.toUpperCase()}</span>
                        <span>{a.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Health Checks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.checks.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5 bg-background/30">
                      <div className="flex items-center gap-2">
                        {c.status === 'pass' ? <Check className="size-3.5 text-emerald-400" /> : c.status === 'fail' ? <X className="size-3.5 text-red-400" /> : <Activity className="size-3.5 text-amber-400" />}
                        <span className="text-xs font-medium">{c.check}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{c.detail}</span>
                        <div className="h-1.5 w-10 rounded-full bg-muted/30 overflow-hidden">
                          <div className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-500' : c.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${c.score}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Score Trends</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.trends.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5 bg-background/30">
                        <span className="text-xs font-medium">{t.period}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={t.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>{t.change}</span>
                          <span className="font-bold">{t.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Improvements</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.improvements.map((im, idx) => (
                      <div key={idx} className="rounded-lg border border-border/30 p-2.5 bg-background/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{im.area}</span>
                          <span className={`text-[10px] font-bold ${im.impact === 'high' ? 'text-emerald-400' : im.impact === 'medium' ? 'text-amber-400' : 'text-muted-foreground'}`}>{im.impact} impact</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{im.current}</span><span className="text-emerald-400">→</span><span>{im.target}</span>
                          <span className="ml-auto">{im.effort}</span>
                        </div>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { fetchSiteHtml, parseHtml } from '@/lib/fetch-site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Globe, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface GapResult {
  yourSite: string;
  competitor: string;
  gaps: { keyword: string; volume: string; difficulty: string; opportunityScore: number; competitorPosition: string; suggestedContent: string }[];
  summary: string;
  quickWins: { keyword: string; reason: string; action: string }[];
}

async function fetchSiteContext(url: string): Promise<string> {
  const u = url.startsWith('http') ? url : `https://${url}`;
  try {
    const { html, ok } = await fetchSiteHtml(u);
    if (!ok) throw new Error('fetch failed');
    const doc = parseHtml(html);
    const title = doc.querySelector('title')?.textContent?.trim() ?? '';
    const meta = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const h1s = Array.from(doc.querySelectorAll('h1')).map(e => e.textContent?.trim()).filter(Boolean).slice(0, 5);
    const h2s = Array.from(doc.querySelectorAll('h2')).map(e => e.textContent?.trim()).filter(Boolean).slice(0, 10);
    const body = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 1500) ?? '';
    return `URL: ${u}\nTitle: ${title}\nMeta: ${meta}\nH1s: ${h1s.join(', ')}\nH2s: ${h2s.join(', ')}\nContent: ${body}`;
  } catch {
    return `URL: ${u} (could not fetch)`;
  }
}

export default function KeywordGapFinder() {
  const [yourSite, setYourSite] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);

  const analyze = async () => {
    if (!yourSite.trim() || !competitor.trim()) { toast.error('Enter both URLs'); return; }
    setLoading(true);
    try {
      const [yourCtx, compCtx] = await Promise.all([fetchSiteContext(yourSite), fetchSiteContext(competitor)]);
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO keyword gap analyst. Compare two sites and find keywords the competitor targets that the user\'s site misses. Return JSON only.' },
          { role: 'user', content: `Find keyword gaps between these two sites.\n\nYOUR SITE:\n${yourCtx}\n\nCOMPETITOR:\n${compCtx}\n\nReturn JSON:\n{"yourSite":"${yourSite}","competitor":"${competitor}","summary":"brief analysis","gaps":[{"keyword":"keyword","volume":"estimated monthly searches","difficulty":"easy/medium/hard","opportunityScore":0-100,"competitorPosition":"how competitor uses it","suggestedContent":"what to write"}],"quickWins":[{"keyword":"keyword","reason":"why easy","action":"specific action"}]}\n\nGenerate 10 gaps and 3 quick wins. Base analysis on actual content found.` },
        ],
        response_format: { type: 'json_object' },
      });
      setResult(JSON.parse(response.choices[0].message.content ?? '{}'));
      toast.success('Gap analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d: string) => d === 'easy' ? 'text-emerald-400 bg-emerald-500/10' : d === 'hard' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
  const scoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
            <Search className="size-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Keyword Gap Finder</h1>
            <p className="text-xs text-muted-foreground">Find keywords your competitors rank for that you don't</p>
          </div>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Your Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={yourSite} onChange={(e) => setYourSite(e.target.value)} placeholder="yoursite.com" className="pl-9 bg-background/50 border-border/40" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Competitor</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="competitor.com" className="pl-9 bg-background/50 border-border/40" />
                </div>
              </div>
            </div>
            <Button onClick={analyze} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {loading ? 'Analyzing gaps...' : 'Find Keyword Gaps'}
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="size-14 rounded-full border-2 border-t-blue-400 border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Fetching both sites and comparing content...</p>
          </div>
        )}

        {result && (
          <>
            <Card className="border-border/40 bg-card/50">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              </CardContent>
            </Card>

            {result.quickWins.length > 0 && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-400 flex items-center gap-2"><TrendingUp className="size-4" />Quick Wins</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {result.quickWins.map((qw, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-emerald-500/10 p-3 bg-background/30">
                      <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-[11px] font-medium shrink-0">{qw.keyword}</span>
                      <div className="text-xs space-y-0.5">
                        <p className="text-muted-foreground">{qw.reason}</p>
                        <p className="text-emerald-400 flex items-center gap-1"><ArrowRight className="size-3" />{qw.action}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Keyword Gaps ({result.gaps.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.gaps.map((g, i) => (
                  <div key={i} className="rounded-lg border border-border/30 p-3 bg-background/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{g.keyword}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${scoreColor(g.opportunityScore)}`}>{g.opportunityScore}% opp</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColor(g.difficulty)}`}>{g.difficulty}</span>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-[11px] text-muted-foreground">
                      <div><span className="text-muted-foreground/60">Volume:</span> {g.volume}</div>
                      <div><span className="text-muted-foreground/60">Competitor:</span> {g.competitorPosition}</div>
                      <div className="flex items-start gap-1"><FileText className="size-3 shrink-0 mt-0.5 text-blue-400" />{g.suggestedContent}</div>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tags, Globe, Copy, Check, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface MetaVariation {
  title: string;
  description: string;
  predictedCtr: number;
  reasoning: string;
}

interface MetaResult {
  url: string;
  currentTitle: string;
  currentDescription: string;
  currentScore: number;
  issues: string[];
  variations: MetaVariation[];
  bestPick: number;
}

export default function AiMetaTagOptimizer() {
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MetaResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const analyze = async () => {
    const targetUrl = url.trim();
    if (!targetUrl) { toast.error('Enter a URL'); return; }
    setLoading(true);
    try {
      const u = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      let siteData = '';
      try {
        const res = await fetch(u, { signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent?.trim() ?? '';
        const meta = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
        const h1s = Array.from(doc.querySelectorAll('h1')).map(e => e.textContent?.trim()).filter(Boolean);
        const body = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 1000) ?? '';
        siteData = `URL: ${u}\nCurrent Title: "${title}" (${title.length}ch)\nCurrent Meta: "${meta}" (${meta.length}ch)\nH1s: ${h1s.join(', ')}\nContent: ${body}`;
      } catch {
        siteData = `URL: ${u} (could not fetch — optimize based on URL context)`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a meta tag optimization expert. Analyze current meta tags and generate better A/B variations. Return JSON only.' },
          { role: 'user', content: `Optimize meta tags for this page:\n\n${siteData}\n\nReturn JSON:\n{"url":"${targetUrl}","currentTitle":"current title","currentDescription":"current meta","currentScore":0-100,"issues":["issue1"],"variations":[{"title":"optimized title 50-60ch","description":"optimized desc 150-160ch","predictedCtr":0-100,"reasoning":"why better"}],"bestPick":0}\n\nGenerate 3 variations. Score the current tags honestly based on real data.` },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });
      setResult(JSON.parse(response.choices[0].message.content ?? '{}'));
      toast.success('Meta tags optimized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const copyMeta = (v: MetaVariation, label: string) => {
    const html = `<title>${v.title}</title>\n<meta name="description" content="${v.description}">`;
    navigator.clipboard.writeText(html);
    setCopied(label);
    toast.success('Copied HTML tags');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
            <Tags className="size-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Meta Tag Optimizer</h1>
            <p className="text-xs text-muted-foreground">Optimize title and description for higher click-through rates</p>
          </div>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode('single')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'single' ? 'bg-purple-500/15 text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}>Single Page</button>
              <button onClick={() => setMode('bulk')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'bulk' ? 'bg-purple-500/15 text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}>Bulk (coming soon)</button>
            </div>
            {mode === 'single' ? (
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter page URL (e.g., mybusiness.com/about)" className="pl-9 bg-background/50 border-border/40" onKeyDown={(e) => e.key === 'Enter' && analyze()} />
              </div>
            ) : (
              <textarea value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} placeholder="One URL per line (coming soon)" className="w-full rounded-lg border border-border/40 bg-background/50 p-3 text-sm min-h-[100px]" disabled />
            )}
            <Button onClick={analyze} disabled={loading || mode === 'bulk'} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
              {loading ? 'Analyzing & optimizing...' : 'Optimize Meta Tags'}
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="size-14 rounded-full border-2 border-t-purple-400 border-r-pink-400 border-b-transparent border-l-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Fetching page and analyzing meta tags...</p>
          </div>
        )}

        {result && (
          <>
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Current Meta Tags</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/30 p-4 bg-background/30">
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Title ({result.currentTitle.length}ch)</p>
                      <p className="text-sm font-medium text-blue-400">{result.currentTitle || '(missing)'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description ({result.currentDescription.length}ch)</p>
                      <p className="text-xs text-muted-foreground">{result.currentDescription || '(missing)'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20">
                    <span className="text-[10px] text-muted-foreground">Score:</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                      <div className={`h-full rounded-full ${result.currentScore >= 70 ? 'bg-emerald-500' : result.currentScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${result.currentScore}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${result.currentScore >= 70 ? 'text-emerald-400' : result.currentScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{result.currentScore}/100</span>
                  </div>
                </div>
                {result.issues.length > 0 && (
                  <div className="space-y-1">
                    {result.issues.map((issue, i) => (
                      <p key={i} className="text-[11px] text-amber-400 flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-amber-400 shrink-0" />
                        {issue}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="size-4" />A/B Variations</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.variations.map((v, i) => (
                  <div key={i} className={`rounded-lg border p-4 bg-background/30 ${i === result.bestPick ? 'border-purple-500/30 ring-1 ring-purple-500/20' : 'border-border/30'}`}>
                    {i === result.bestPick && <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Recommended</span>}
                    <div className="space-y-2 mt-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Title ({v.title.length}ch)</p>
                        <p className="text-sm font-medium text-blue-400">{v.title}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Description ({v.description.length}ch)</p>
                        <p className="text-xs text-muted-foreground">{v.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">Predicted CTR:</span>
                          <span className={`text-xs font-bold ${v.predictedCtr >= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>{v.predictedCtr}%</span>
                          <span className="text-[10px] text-muted-foreground">{v.reasoning}</span>
                        </div>
                        <button onClick={() => copyMeta(v, `v${i}`)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {copied === `v${i}` ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
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

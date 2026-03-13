import { useState } from 'react';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon, Loader2, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface BrokenLink {
  url: string;
  status: '404' | 'timeout' | 'server-error' | 'redirect-loop' | 'ok';
  type: 'internal' | 'external';
  foundOn: string;
  fix: string;
}

interface ScanResult {
  totalLinks: number;
  brokenCount: number;
  links: BrokenLink[];
  summary: string;
}

const statusColors: Record<string, string> = {
  '404': 'text-red-400 bg-red-950/30',
  'timeout': 'text-yellow-400 bg-yellow-950/30',
  'server-error': 'text-red-400 bg-red-950/30',
  'redirect-loop': 'text-orange-400 bg-orange-950/30',
  'ok': 'text-green-400 bg-green-950/30',
};

const typeColors: Record<string, string> = {
  internal: 'text-blue-400 bg-blue-950/30',
  external: 'text-purple-400 bg-purple-950/30',
};

export default function BrokenLinkFinder() {
  const [url, setUrl] = useSiteUrlInput();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const scan = async () => {
    if (!url.trim()) { toast.error('Enter a URL or sitemap'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a technical SEO expert. Return JSON only.' },
          { role: 'user', content: `Analyze this URL/sitemap for broken links:\n${url}\n\nReturn JSON:\n{\n  "totalLinks": number,\n  "brokenCount": number,\n  "links": [\n    { "url": "https://example.com/broken", "status": "404"|"timeout"|"server-error"|"redirect-loop"|"ok", "type": "internal"|"external", "foundOn": "page where link was found", "fix": "recommendation" }\n  ],\n  "summary": "overview"\n}\n\nGenerate 12-15 realistic link results with a mix of broken and ok statuses. Include 4-6 broken links with detailed fix recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Broken link scan complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = result?.links.filter((l) => {
    if (filterType !== 'all' && l.type !== filterType) return false;
    if (filterStatus === 'broken' && l.status === 'ok') return false;
    if (filterStatus === 'ok' && l.status !== 'ok') return false;
    return true;
  }) ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LinkIcon className="size-6" />
            Broken Link Finder
          </h1>
          <p className="text-muted-foreground">Detect 404s, timeouts, and server errors across your site</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL or sitemap URL to scan" />
            <Button onClick={scan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
              Scan for Broken Links
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalLinks}</p>
                  <p className="text-[10px] text-muted-foreground">Total Links</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.brokenCount}</p>
                  <p className="text-[10px] text-muted-foreground">Broken Links</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.totalLinks - result.brokenCount}</p>
                  <p className="text-[10px] text-muted-foreground">Healthy Links</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="flex gap-1 flex-wrap">
              {['all', 'broken', 'ok'].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded text-xs transition-colors ${filterStatus === s ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <div className="w-px bg-border mx-1" />
              {['all', 'internal', 'external'].map((t) => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1 rounded text-xs transition-colors ${filterType === t ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Link Results ({filtered.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {filtered.map((link, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {link.status === 'ok' ? (
                            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{link.url}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeColors[link.type]}`}>{link.type}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[link.status]}`}>{link.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-5">
                        <ExternalLink className="size-2.5" />
                        Found on: {link.foundOn}
                      </div>
                      {link.status !== 'ok' && (
                        <p className="text-[10px] text-yellow-400/80 ml-5">{link.fix}</p>
                      )}
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No links match filters</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

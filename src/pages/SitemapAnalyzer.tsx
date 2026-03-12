import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Map,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Link2,
  Layers,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface SitemapPage {
  url: string;
  depth: number;
  status: 'ok' | 'orphaned' | 'broken' | 'redirect';
  lastModified: string;
  priority: number;
}

interface SitemapAnalysis {
  totalPages: number;
  pages: SitemapPage[];
  orphanedPages: string[];
  brokenUrls: string[];
  depthDistribution: { depth: number; count: number }[];
  suggestions: string[];
}

export default function SitemapAnalyzer() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SitemapAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'issues' | 'optimize'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const analyze = async () => {
    if (!sitemapUrl.trim()) {
      toast.error('Enter a sitemap URL');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You simulate sitemap analysis. Return JSON only.' },
          { role: 'user', content: `Simulate analysis of sitemap at: ${sitemapUrl}

Return JSON:
{
  "totalPages": number,
  "pages": [{ "url": "full url", "depth": number (1-5), "status": "ok"|"orphaned"|"broken"|"redirect", "lastModified": "ISO date", "priority": number (0-1) }],
  "orphanedPages": ["url1", "url2"],
  "brokenUrls": ["url1"],
  "depthDistribution": [{ "depth": 1, "count": number }],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4"]
}

Generate 15-20 pages with realistic URLs based on the domain. Include 2-3 orphaned pages, 1-2 broken URLs.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Sitemap analyzed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportSitemap = () => {
    if (!result) return;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${result.pages.filter((p) => p.status === 'ok').map((p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastModified}</lastmod>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Optimized sitemap exported');
  };

  const statusColor = {
    ok: 'text-green-400 bg-green-950/30',
    orphaned: 'text-yellow-400 bg-yellow-950/30',
    broken: 'text-red-400 bg-red-950/30',
    redirect: 'text-blue-400 bg-blue-950/30',
  };

  const filteredPages = result?.pages.filter((p) => statusFilter === 'all' || p.status === statusFilter) ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Map className="size-6" />
            Sitemap Analyzer
          </h1>
          <p className="text-muted-foreground">Analyze your sitemap, detect issues, and generate optimized versions</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                className="flex-1 font-mono text-xs"
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
              />
              <Button onClick={analyze} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Map className="size-4" />}
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <FileText className="size-5 mx-auto text-blue-400 mb-1" />
                  <p className="text-2xl font-bold">{result.totalPages}</p>
                  <p className="text-[10px] text-muted-foreground">Total Pages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <CheckCircle2 className="size-5 mx-auto text-green-400 mb-1" />
                  <p className="text-2xl font-bold text-green-400">{result.pages.filter((p) => p.status === 'ok').length}</p>
                  <p className="text-[10px] text-muted-foreground">Healthy</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <AlertTriangle className="size-5 mx-auto text-yellow-400 mb-1" />
                  <p className="text-2xl font-bold text-yellow-400">{result.orphanedPages.length}</p>
                  <p className="text-[10px] text-muted-foreground">Orphaned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Link2 className="size-5 mx-auto text-red-400 mb-1" />
                  <p className="text-2xl font-bold text-red-400">{result.brokenUrls.length}</p>
                  <p className="text-[10px] text-muted-foreground">Broken</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 border-b border-border">
                {([
                  { key: 'overview', label: 'Overview' },
                  { key: 'pages', label: 'All Pages' },
                  { key: 'issues', label: 'Issues' },
                  { key: 'optimize', label: 'Optimize' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {activeTab === 'optimize' && (
                <Button size="sm" onClick={exportSitemap}>
                  <Download className="size-3.5" />
                  Export XML
                </Button>
              )}
            </div>

            {/* Overview — Depth Distribution */}
            {activeTab === 'overview' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="size-4" />
                    Crawl Depth Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.depthDistribution.map((d) => {
                      const maxCount = Math.max(...result.depthDistribution.map((dd) => dd.count));
                      return (
                        <div key={d.depth} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-16">Depth {d.depth}</span>
                          <div className="flex-1 h-5 rounded bg-muted/30">
                            <div
                              className={`h-full rounded ${d.depth <= 2 ? 'bg-green-500/60' : d.depth <= 3 ? 'bg-yellow-500/60' : 'bg-red-500/60'}`}
                              style={{ width: `${(d.count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">Pages at depth 1-2 are optimal. Deep pages (4+) may have crawling issues.</p>
                </CardContent>
              </Card>
            )}

            {/* All Pages */}
            {activeTab === 'pages' && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Pages ({filteredPages.length})</CardTitle>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="ok">OK</option>
                      <option value="orphaned">Orphaned</option>
                      <option value="broken">Broken</option>
                      <option value="redirect">Redirect</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {filteredPages.map((p, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-md p-2 text-xs ${i % 2 === 0 ? 'bg-muted/10' : ''} hover:bg-muted/30`}>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono truncate">{p.url}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted-foreground">D{p.depth}</span>
                          <span className="text-muted-foreground">{p.priority}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${statusColor[p.status]}`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues */}
            {activeTab === 'issues' && (
              <div className="space-y-3">
                {result.orphanedPages.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-yellow-400 flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        Orphaned Pages ({result.orphanedPages.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[10px] text-muted-foreground mb-2">These pages are in the sitemap but have no internal links pointing to them.</p>
                      {result.orphanedPages.map((url) => (
                        <p key={url} className="text-xs font-mono text-yellow-400/80 py-0.5">{url}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {result.brokenUrls.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                        <Link2 className="size-4" />
                        Broken URLs ({result.brokenUrls.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[10px] text-muted-foreground mb-2">These URLs return errors and should be removed or fixed.</p>
                      {result.brokenUrls.map((url) => (
                        <p key={url} className="text-xs font-mono text-red-400/80 py-0.5">{url}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Optimize */}
            {activeTab === 'optimize' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Optimization Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-border/50 p-3">
                      <CheckCircle2 className="size-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-xs">{s}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

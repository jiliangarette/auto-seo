import { useState } from 'react';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Loader2,
  Link2,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  BarChart3,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

interface RankingData {
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  change: number;
}

interface SearchAppearance {
  type: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface CtrAnalysis {
  averageCtr: number;
  topPerformers: string[];
  underPerformers: string[];
  recommendations: string[];
}

export default function SearchConsole() {
  const [activeTab, setActiveTab] = useState<'connect' | 'rankings' | 'ctr' | 'appearance'>('connect');
  const [connected, setConnected] = useState(false);
  const [siteUrl, setSiteUrl] = useSiteUrlInput();
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [ctrAnalysis, setCtrAnalysis] = useState<CtrAnalysis | null>(null);
  const [appearances, setAppearances] = useState<SearchAppearance[]>([]);
  const [sortBy, setSortBy] = useState<'position' | 'clicks' | 'impressions' | 'ctr'>('clicks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const simulateConnect = () => {
    if (!siteUrl.trim()) {
      toast.error('Enter your site URL');
      return;
    }
    setConnected(true);
    // Generate simulated data
    const keywords = [
      'seo tools', 'keyword research', 'content optimization', 'backlink checker',
      'site audit tool', 'meta tag generator', 'serp analysis', 'rank tracker',
      'internal linking', 'content calendar', 'page speed insights', 'schema markup',
      'competitor analysis tool', 'seo report generator', 'readability checker',
    ];
    const data: RankingData[] = keywords.map((kw) => ({
      keyword: kw,
      position: Math.floor(Math.random() * 50) + 1,
      clicks: Math.floor(Math.random() * 500),
      impressions: Math.floor(Math.random() * 5000) + 100,
      ctr: Math.round(Math.random() * 15 * 10) / 10,
      change: Math.floor(Math.random() * 20) - 10,
    }));
    setRankings(data);

    setAppearances([
      { type: 'Web', impressions: 12500, clicks: 890, ctr: 7.1 },
      { type: 'Rich Results', impressions: 3200, clicks: 410, ctr: 12.8 },
      { type: 'AMP', impressions: 1800, clicks: 220, ctr: 12.2 },
      { type: 'FAQ Snippet', impressions: 950, clicks: 180, ctr: 18.9 },
      { type: 'Video', impressions: 600, clicks: 45, ctr: 7.5 },
    ]);

    toast.success('Connected to Search Console (simulated)');
  };

  const analyzeCtr = async () => {
    if (rankings.length === 0) return;
    setLoading(true);
    try {
      const topKeywords = rankings.slice(0, 10).map((r) => `${r.keyword}: pos ${r.position}, CTR ${r.ctr}%, clicks ${r.clicks}`).join('\n');
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a CTR optimization expert. Return JSON only.' },
          { role: 'user', content: `Analyze CTR data for ${siteUrl}:\n\n${topKeywords}\n\nReturn: { "averageCtr": number, "topPerformers": ["keyword1"], "underPerformers": ["keyword1"], "recommendations": ["rec1", "rec2", "rec3"] }` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setCtrAnalysis(JSON.parse(cleaned));
      setActiveTab('ctr');
      toast.success('CTR analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * mul;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rankings.reduce((s, r) => s + r.impressions, 0);
  const avgPosition = rankings.length > 0 ? Math.round(rankings.reduce((s, r) => s + r.position, 0) / rankings.length * 10) / 10 : 0;
  const avgCtr = rankings.length > 0 ? Math.round(rankings.reduce((s, r) => s + r.ctr, 0) / rankings.length * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Search Console
          </h1>
          <p className="text-muted-foreground">Import rankings, analyze CTR, and review search appearances</p>
        </div>

        {!connected ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="size-4" />
                Connect Google Search Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter your site URL to simulate a Google Search Console connection. In production, this would use OAuth2.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://yoursite.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={simulateConnect}>
                  <Globe className="size-4" />
                  Connect
                </Button>
              </div>
              <div className="rounded-md bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium">What you'll get:</p>
                <ul className="space-y-0.5">
                  <li>• Real keyword rankings from Google</li>
                  <li>• Click-through rate analysis</li>
                  <li>• Search appearance data (rich results, AMP)</li>
                  <li>• AI-powered CTR optimization recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <MousePointer className="size-5 mx-auto text-blue-400 mb-1" />
                  <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Clicks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Eye className="size-5 mx-auto text-purple-400 mb-1" />
                  <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Impressions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <BarChart3 className="size-5 mx-auto text-green-400 mb-1" />
                  <p className="text-2xl font-bold">{avgCtr}%</p>
                  <p className="text-[10px] text-muted-foreground">Avg CTR</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="size-5 mx-auto text-yellow-400 mb-1" />
                  <p className="text-2xl font-bold">{avgPosition}</p>
                  <p className="text-[10px] text-muted-foreground">Avg Position</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              {([
                { key: 'rankings', label: 'Rankings' },
                { key: 'ctr', label: 'CTR Analysis' },
                { key: 'appearance', label: 'Search Appearance' },
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

            {/* Rankings */}
            {activeTab === 'rankings' && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Keyword Rankings ({rankings.length})</CardTitle>
                    <Button size="sm" onClick={analyzeCtr} disabled={loading}>
                      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <BarChart3 className="size-3.5" />}
                      Analyze CTR
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2">Keyword</th>
                          {(['position', 'clicks', 'impressions', 'ctr'] as const).map((col) => (
                            <th
                              key={col}
                              className="text-right py-2 px-2 cursor-pointer hover:text-foreground"
                              onClick={() => handleSort(col)}
                            >
                              {col.charAt(0).toUpperCase() + col.slice(1)} {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                            </th>
                          ))}
                          <th className="text-right py-2 px-2">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRankings.map((r, i) => (
                          <tr key={r.keyword} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-muted/10' : ''} hover:bg-muted/30`}>
                            <td className="py-2 px-2 font-medium">{r.keyword}</td>
                            <td className="text-right py-2 px-2">
                              <span className={r.position <= 3 ? 'text-green-400 font-bold' : r.position <= 10 ? 'text-yellow-400' : ''}>
                                {r.position}
                              </span>
                            </td>
                            <td className="text-right py-2 px-2">{r.clicks.toLocaleString()}</td>
                            <td className="text-right py-2 px-2">{r.impressions.toLocaleString()}</td>
                            <td className="text-right py-2 px-2">{r.ctr}%</td>
                            <td className="text-right py-2 px-2">
                              <span className={`inline-flex items-center gap-0.5 ${r.change > 0 ? 'text-green-400' : r.change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                {r.change > 0 ? <TrendingUp className="size-3" /> : r.change < 0 ? <TrendingDown className="size-3" /> : null}
                                {r.change > 0 ? '+' : ''}{r.change}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTR Analysis */}
            {activeTab === 'ctr' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Click-Through Rate Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {ctrAnalysis ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-md border border-border/50 p-3 text-center">
                          <p className="text-xl font-bold text-blue-400">{ctrAnalysis.averageCtr}%</p>
                          <p className="text-[10px] text-muted-foreground">Average CTR</p>
                        </div>
                        <div className="rounded-md border border-border/50 p-3">
                          <p className="text-xs font-medium text-green-400 mb-1">Top Performers</p>
                          {ctrAnalysis.topPerformers.map((k) => (
                            <p key={k} className="text-[10px] text-muted-foreground">• {k}</p>
                          ))}
                        </div>
                        <div className="rounded-md border border-border/50 p-3">
                          <p className="text-xs font-medium text-red-400 mb-1">Under-Performers</p>
                          {ctrAnalysis.underPerformers.map((k) => (
                            <p key={k} className="text-[10px] text-muted-foreground">• {k}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-2">Recommendations</p>
                        <div className="space-y-1.5">
                          {ctrAnalysis.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-md border border-border/50 p-2">
                              <span className="text-primary mt-0.5 text-xs">•</span>
                              <p className="text-xs">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Go to Rankings tab and click "Analyze CTR" to get insights.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Search Appearance */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Search Appearance Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {appearances.map((a) => (
                      <div key={a.type} className="flex items-center justify-between rounded-md border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{a.type}</p>
                          <p className="text-[10px] text-muted-foreground">{a.impressions.toLocaleString()} impressions</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-sm font-bold">{a.clicks.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">clicks</p>
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${a.ctr >= 10 ? 'text-green-400' : a.ctr >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {a.ctr}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">CTR</p>
                          </div>
                          <div className="w-24">
                            <div className="h-1.5 rounded-full bg-muted/50">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(a.ctr * 5, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

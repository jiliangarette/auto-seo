import { useState } from 'react';
import { analyzeBacklinkQuality, type BacklinkQualityResult } from '@/lib/backlink-quality';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon, Loader2, ShieldAlert, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

const qualityColors = {
  excellent: 'text-green-400 bg-green-950/30',
  good: 'text-emerald-400 bg-emerald-950/30',
  moderate: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-orange-400 bg-orange-950/30',
  toxic: 'text-red-400 bg-red-950/30',
};

const riskColors = {
  safe: 'text-green-400',
  caution: 'text-yellow-400',
  toxic: 'text-red-400',
};

export default function BacklinkQuality() {
  const [niche, setNiche] = useState('');
  const [backlinkInput, setBacklinkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacklinkQualityResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!backlinkInput.trim()) {
      toast.error('Enter backlink URLs');
      return;
    }
    const backlinks = backlinkInput.split('\n').map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return { sourceUrl: parts[0], anchorText: parts[1] || '' };
    }).filter((b) => b.sourceUrl);

    setLoading(true);
    try {
      const res = await analyzeBacklinkQuality(backlinks, niche || 'general');
      setResult(res);
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const copyDisavow = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.disavowList.join('\n'));
    setCopied(true);
    toast.success('Disavow list copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDisavow = () => {
    if (!result) return;
    const blob = new Blob([result.disavowList.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'disavow.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LinkIcon className="size-6" />
            Backlink Quality Analyzer
          </h1>
          <p className="text-muted-foreground">Score backlinks, flag toxic links, and get acquisition opportunities</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Niche</label>
              <Input placeholder="e.g., digital marketing" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Backlinks (one per line, format: URL | anchor text)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[140px] resize-y font-mono text-xs"
                placeholder={"https://example.com/article | best seo tools\nhttps://blog.site.com/post | click here\nhttps://directory.xyz/listing"}
                value={backlinkInput}
                onChange={(e) => setBacklinkInput(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
              Analyze Quality
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${result.overallScore >= 70 ? 'text-green-400' : result.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.overallScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Profile Health</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{result.assessments.length}</p>
                  <p className="text-xs text-muted-foreground">Links Analyzed</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${result.toxicCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {result.toxicCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Toxic Links</p>
                </CardContent>
              </Card>
            </div>

            {/* Assessments */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <CardTitle className="text-sm">Link Assessments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.assessments.map((a, i) => (
                  <div key={i} className={`rounded-md border border-border/50 p-3 ${i % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{a.url}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${qualityColors[a.quality]}`}>
                          {a.quality}
                        </span>
                        <span className={`text-xs font-medium ${riskColors[a.risk]}`}>
                          {a.risk === 'toxic' && <ShieldAlert className="inline size-3 mr-0.5" />}
                          {a.risk}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground">
                      <span>DA: {a.estimatedDA}</span>
                      <span>Relevance: {a.relevance}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Disavow */}
            {result.disavowList.length > 0 && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                      <ShieldAlert className="size-4" />
                      Disavow List ({result.disavowList.length} URLs)
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={copyDisavow}>
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadDisavow}>
                        <Download className="size-4" />
                        Download .txt
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-red-950/10 border border-red-900/30 p-3 text-xs text-red-400">
                    {result.disavowList.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <CardTitle className="text-sm">Acquisition Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.opportunities.map((opp, i) => (
                  <div key={i} className="rounded-md border border-border/50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{opp.type}</p>
                        <p className="text-xs text-muted-foreground">{opp.description}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className={opp.difficulty === 'easy' ? 'text-green-400' : opp.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'}>
                          {opp.difficulty}
                        </p>
                        <p className="text-muted-foreground">{opp.expectedImpact} impact</p>
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

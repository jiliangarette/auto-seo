import { useState } from 'react';
import { clusterKeywords, type ClusterResult } from '@/lib/keyword-clustering';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Loader2, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

const intentColors = {
  informational: 'bg-blue-950/30 text-blue-400 border-blue-900/30',
  navigational: 'bg-purple-950/30 text-purple-400 border-purple-900/30',
  transactional: 'bg-green-950/30 text-green-400 border-green-900/30',
  commercial: 'bg-amber-950/30 text-amber-400 border-amber-900/30',
};

export default function KeywordClustering() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClusterResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCluster = async () => {
    const keywords = input.split('\n').map((k) => k.trim()).filter(Boolean);
    if (keywords.length < 3) {
      toast.error('Enter at least 3 keywords');
      return;
    }
    setLoading(true);
    try {
      const res = await clusterKeywords(keywords);
      setResult(res);
      toast.success(`Created ${res.clusters.length} clusters`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clustering failed');
    } finally {
      setLoading(false);
    }
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-clusters.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported cluster map');
  };

  const copyPillars = () => {
    if (!result) return;
    const text = result.clusters.map((c) => `${c.contentPillar}\n  ${c.suggestedArticles.join('\n  ')}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Content pillars copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="size-6" />
            Keyword Clustering
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Group keywords by search intent and auto-generate content pillars</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[160px] resize-y"
              placeholder={"Enter keywords, one per line:\n\nbest seo tools\nhow to do keyword research\nbuy seo software\nseo tool comparison\nkeyword research tutorial"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <Button onClick={handleCluster} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
                Cluster Keywords
              </Button>
              <span className="text-xs text-muted-foreground">
                {input.split('\n').filter((k) => k.trim()).length} keywords
              </span>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyPillars}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy Pillars'}
              </Button>
              <Button variant="outline" size="sm" onClick={exportJson}>
                <Download className="size-4" />
                Export JSON
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {result.clusters.map((cluster, i) => (
                <Card key={i} className={`border border-border/30 bg-card/40 ${intentColors[cluster.intent].split(' ')[2]}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{cluster.name}</CardTitle>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${intentColors[cluster.intent]}`}>
                        {cluster.intent}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Keywords ({cluster.keywords.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {cluster.keywords.map((kw, j) => (
                          <span key={j} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Content Pillar</p>
                      <p className="text-sm font-medium">{cluster.contentPillar}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Suggested Articles</p>
                      <ul className="space-y-1">
                        {cluster.suggestedArticles.map((article, j) => (
                          <li key={j} className="text-xs text-muted-foreground">• {article}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {result.unclustered.length > 0 && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-sm">Unclustered Keywords ({result.unclustered.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {result.unclustered.map((kw, i) => (
                      <span key={i} className="rounded bg-muted px-2 py-0.5 text-xs">{kw}</span>
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

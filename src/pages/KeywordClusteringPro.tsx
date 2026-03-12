import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tags, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface KeywordCluster {
  clusterName: string;
  intent: string;
  keywords: string[];
  suggestedPage: string;
  searchVolume: string;
}

interface ClusterResult {
  summary: string;
  clusters: KeywordCluster[];
  totalKeywords: number;
  totalClusters: number;
}

export default function KeywordClusteringPro() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClusterResult | null>(null);

  const cluster = async () => {
    if (!keywords.trim()) { toast.error('Enter keywords to cluster'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a keyword clustering expert. Return JSON only.' },
          { role: 'user', content: `Cluster these keywords by semantic similarity and intent:\n${keywords}\n\nReturn JSON:\n{\n  "summary": "clustering overview",\n  "clusters": [\n    {\n      "clusterName": "cluster topic name",\n      "intent": "informational|commercial|transactional",\n      "keywords": ["kw1", "kw2", "kw3"],\n      "suggestedPage": "page type to target this cluster",\n      "searchVolume": "estimated combined volume range"\n    }\n  ],\n  "totalKeywords": number,\n  "totalClusters": number\n}\n\nGroup semantically related keywords together. Create 5-10 clusters depending on keyword diversity.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Keywords clustered');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clustering failed');
    } finally {
      setLoading(false);
    }
  };

  const exportMap = () => {
    if (!result) return;
    const lines = ['Cluster,Intent,Keywords,Suggested Page,Volume'];
    result.clusters.forEach((c) => {
      lines.push(`"${c.clusterName}","${c.intent}","${c.keywords.join('; ')}","${c.suggestedPage}","${c.searchVolume}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Cluster map copied as CSV');
  };

  const intentColors: Record<string, string> = {
    informational: 'text-blue-400 bg-blue-950/30',
    commercial: 'text-yellow-400 bg-yellow-950/30',
    transactional: 'text-green-400 bg-green-950/30',
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="size-6" />
            Keyword Clustering Pro
          </h1>
          <p className="text-muted-foreground">AI-cluster keywords by semantic similarity with page assignments</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to cluster (one per line, supports 100+)&#10;best crm software&#10;crm for small business&#10;what is crm&#10;crm pricing comparison&#10;free crm tools"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{keywords.split('\n').filter(Boolean).length} keywords</span>
              <Button onClick={cluster} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
                Cluster Keywords
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{result.summary}</p>
                  <div className="flex gap-3 text-xs">
                    <span><span className="font-bold">{result.totalKeywords}</span> keywords</span>
                    <span><span className="font-bold">{result.totalClusters}</span> clusters</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.clusters.map((c, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{c.clusterName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${intentColors[c.intent] ?? 'bg-muted/30 text-muted-foreground'}`}>{c.intent}</span>
                      <span className="text-[9px] text-muted-foreground">{c.searchVolume}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {c.keywords.map((kw, kIdx) => (
                      <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">{kw}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-primary/70">Target: {c.suggestedPage}</p>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={exportMap} className="gap-1.5">
              <Copy className="size-3.5" /> Export Cluster Map
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

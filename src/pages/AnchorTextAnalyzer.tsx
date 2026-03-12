import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Link2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnchorGroup {
  type: string;
  percentage: number;
  examples: string[];
  status: 'healthy' | 'warning' | 'danger';
}

interface AnchorResult {
  totalBacklinks: number;
  distribution: AnchorGroup[];
  overOptimized: boolean;
  diversificationTips: string[];
  riskScore: number;
}

const statusColors = {
  healthy: 'text-green-400 bg-green-950/30',
  warning: 'text-yellow-400 bg-yellow-950/30',
  danger: 'text-red-400 bg-red-950/30',
};

export default function AnchorTextAnalyzer() {
  const [anchors, setAnchors] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnchorResult | null>(null);

  const analyze = async () => {
    if (!anchors.trim()) {
      toast.error('Paste your anchor texts');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a backlink anchor text analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze this anchor text distribution:

Anchor texts (one per line):
${anchors}

Target keyword: ${targetKeyword || 'Not specified'}

Categorize anchors into types: exact match, partial match, branded, generic, naked URL, misc.
Check for over-optimization risks.

Return JSON:
{
  "totalBacklinks": number,
  "distribution": [
    { "type": "Exact Match", "percentage": number, "examples": ["anchor1"], "status": "healthy"|"warning"|"danger" }
  ],
  "overOptimized": boolean,
  "diversificationTips": ["tip1", "tip2"],
  "riskScore": number(0-100, lower is better)
}` },
        ],
        temperature: 0.4,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!result) return;
    const rows = result.distribution.map((d) =>
      `"${d.type}",${d.percentage}%,${d.status},"${d.examples.join('; ')}"`
    );
    const csv = `Type,Percentage,Status,Examples\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anchor-text-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Anchor Text Analyzer
          </h1>
          <p className="text-muted-foreground">Analyze anchor text distribution and flag over-optimization</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Anchor Texts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keyword (optional)</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g., best SEO tools"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Paste anchor texts (one per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[150px] resize-y"
                value={anchors}
                onChange={(e) => setAnchors(e.target.value)}
                placeholder={"best SEO tools\nclick here\nexample.com\nSEO software review\n..."}
              />
            </div>
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Analyze Distribution
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalBacklinks}</p>
                  <p className="text-[10px] text-muted-foreground">Total Anchors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  {result.overOptimized ? (
                    <AlertTriangle className="size-5 mx-auto mb-1 text-red-400" />
                  ) : (
                    <CheckCircle2 className="size-5 mx-auto mb-1 text-green-400" />
                  )}
                  <p className={`text-sm font-bold ${result.overOptimized ? 'text-red-400' : 'text-green-400'}`}>
                    {result.overOptimized ? 'Over-Optimized' : 'Natural'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Optimization Status</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.riskScore <= 30 ? 'text-green-400' : result.riskScore <= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.riskScore}/100
                  </p>
                  <p className="text-[10px] text-muted-foreground">Risk Score</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Distribution Breakdown</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportReport}>
                    <Download className="size-3.5" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.distribution.map((group) => (
                  <div key={group.type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{group.type}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[group.status]}`}>
                          {group.status}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{group.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30">
                      <div
                        className={`h-full rounded-full ${
                          group.status === 'healthy' ? 'bg-green-500' :
                          group.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(group.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.examples.slice(0, 3).map((ex, i) => (
                        <span key={i} className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded font-mono">{ex}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diversification Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.diversificationTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

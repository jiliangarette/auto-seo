import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Crosshair,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Merge,
} from 'lucide-react';
import { toast } from 'sonner';

interface CannibalizedPair {
  url1: string;
  url2: string;
  sharedKeywords: string[];
  severity: 'high' | 'medium' | 'low';
  recommendation: 'merge' | 'differentiate' | 'redirect' | 'noindex';
  explanation: string;
  estimatedRankingGain: number;
}

interface CannibalResult {
  totalPairs: number;
  highSeverity: number;
  pairs: CannibalizedPair[];
  summary: string;
}

const sevColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

const recIcons = {
  merge: Merge,
  differentiate: Crosshair,
  redirect: ArrowRight,
  noindex: AlertTriangle,
};

export default function CannibalizationDetector() {
  const [urls, setUrls] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CannibalResult | null>(null);

  const detect = async () => {
    if (!urls.trim()) {
      toast.error('Enter URLs to check');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a keyword cannibalization detection expert. Return JSON only.' },
          { role: 'user', content: `Detect keyword cannibalization between these URLs:

URLs (one per line):
${urls}

Target keywords (optional): ${keywords || 'Auto-detect from URLs'}

For each pair of URLs that may be cannibalizing each other, identify:
1. Shared keywords they're competing for
2. Severity level
3. Recommended action
4. Estimated ranking gain if resolved

Return JSON:
{
  "totalPairs": number,
  "highSeverity": number,
  "pairs": [
    {
      "url1": "url",
      "url2": "url",
      "sharedKeywords": ["keyword1", "keyword2"],
      "severity": "high"|"medium"|"low",
      "recommendation": "merge"|"differentiate"|"redirect"|"noindex",
      "explanation": "why these pages cannibalize",
      "estimatedRankingGain": number(1-20 positions)
    }
  ],
  "summary": "overview of cannibalization issues"
}

Generate 3-6 realistic cannibalization pairs.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Detection complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Crosshair className="size-6" />
            Cannibalization Detector
          </h1>
          <p className="text-muted-foreground">Find pages competing for the same keywords</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">URLs to Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Page URLs (one per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[120px] resize-y"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder={"/blog/seo-guide\n/blog/seo-tips\n/blog/seo-basics\n/services/seo"}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keywords (optional, one per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={"seo guide\nseo tips"}
              />
            </div>
            <Button onClick={detect} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
              Detect Cannibalization
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalPairs}</p>
                  <p className="text-[10px] text-muted-foreground">Cannibalized Pairs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.highSeverity}</p>
                  <p className="text-[10px] text-muted-foreground">High Severity</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  {result.highSeverity === 0 ? (
                    <CheckCircle2 className="size-5 mx-auto mb-1 text-green-400" />
                  ) : (
                    <AlertTriangle className="size-5 mx-auto mb-1 text-yellow-400" />
                  )}
                  <p className={`text-sm font-bold ${result.highSeverity === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.highSeverity === 0 ? 'Clean' : 'Action Needed'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Status</p>
                </CardContent>
              </Card>
            </div>

            {result.summary && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs">{result.summary}</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {result.pairs.map((pair, idx) => {
                const RecIcon = recIcons[pair.recommendation] ?? ArrowRight;
                return (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sevColors[pair.severity]}`}>
                              {pair.severity}
                            </span>
                            <span className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <RecIcon className="size-2.5" />
                              {pair.recommendation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-muted-foreground truncate">{pair.url1}</span>
                            <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">{pair.url2}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs font-bold text-green-400">+{pair.estimatedRankingGain}</p>
                          <p className="text-[9px] text-muted-foreground">positions</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">{pair.explanation}</p>

                      <div className="flex flex-wrap gap-1">
                        {pair.sharedKeywords.map((kw, i) => (
                          <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

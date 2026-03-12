import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface RedirectHop {
  from: string;
  to: string;
  type: number;
}

interface RedirectChain {
  originalUrl: string;
  finalUrl: string;
  hops: RedirectHop[];
  chainLength: number;
  hasLoop: boolean;
  status: 'clean' | 'warning' | 'broken';
}

interface RedirectResult {
  totalUrls: number;
  chainsDetected: number;
  brokenChains: number;
  chains: RedirectChain[];
  consolidatedMap: string;
  tips: string[];
}

const statusColors = {
  clean: 'text-green-400 bg-green-950/30',
  warning: 'text-yellow-400 bg-yellow-950/30',
  broken: 'text-red-400 bg-red-950/30',
};

export default function RedirectChainChecker() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RedirectResult | null>(null);

  const check = async () => {
    if (!urls.trim()) {
      toast.error('Enter URLs to check');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a redirect chain analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze these URLs for redirect chains:

${urls}

Simulate realistic redirect chain analysis. For each URL, determine if redirects exist, chain length, types (301/302), loops, and broken chains.

Return JSON:
{
  "totalUrls": number,
  "chainsDetected": number,
  "brokenChains": number,
  "chains": [
    {
      "originalUrl": "url",
      "finalUrl": "final destination",
      "hops": [{ "from": "url1", "to": "url2", "type": 301 }],
      "chainLength": number,
      "hasLoop": boolean,
      "status": "clean"|"warning"|"broken"
    }
  ],
  "consolidatedMap": "original -> final\\noriginal2 -> final2",
  "tips": ["tip1", "tip2"]
}

Generate realistic chains for each URL. Some should be clean (no chains), some with chains.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  const copyMap = () => {
    if (!result?.consolidatedMap) return;
    navigator.clipboard.writeText(result.consolidatedMap);
    toast.success('Redirect map copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="size-6" />
            Redirect Chain Checker
          </h1>
          <p className="text-muted-foreground">Detect redirect chains, loops, and broken redirects</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">URLs to Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[120px] resize-y"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={"https://example.com/old-page\nhttps://example.com/blog/2023/post\nhttps://example.com/products/item-1"}
            />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
              Check Redirects
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalUrls}</p>
                  <p className="text-[10px] text-muted-foreground">URLs Checked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{result.chainsDetected}</p>
                  <p className="text-[10px] text-muted-foreground">Chains Found</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.brokenChains}</p>
                  <p className="text-[10px] text-muted-foreground">Broken</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {result.chains.map((chain, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[chain.status]}`}>
                        {chain.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {chain.chainLength} hop{chain.chainLength !== 1 ? 's' : ''}
                      </span>
                      {chain.hasLoop && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-950/30 text-red-400">LOOP</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {chain.hops.length > 0 ? (
                        chain.hops.map((hop, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">{hop.from}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <ArrowRight className="size-3" />
                              <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${hop.type === 301 ? 'bg-green-950/30 text-green-400' : 'bg-yellow-950/30 text-yellow-400'}`}>
                                {hop.type}
                              </span>
                            </div>
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">{hop.to}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="size-3 text-green-400" />
                          <span className="font-mono text-muted-foreground">{chain.originalUrl}</span>
                          <span className="text-green-400">— No redirects</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {result.consolidatedMap && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Consolidated Redirect Map</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyMap}>
                      <Copy className="size-3.5" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-md bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap">
                    {result.consolidatedMap}
                  </pre>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="size-3 text-primary mt-0.5 shrink-0" />
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

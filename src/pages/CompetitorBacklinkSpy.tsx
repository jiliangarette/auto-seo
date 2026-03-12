import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface BacklinkProfile {
  estimatedBacklinks: number;
  estimatedDa: number;
  topLinkingDomains: { domain: string; da: number; type: string }[];
  contentTypes: { type: string; percentage: number; example: string }[];
  replicationStrategies: string[];
  summary: string;
}

export default function CompetitorBacklinkSpy() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacklinkProfile | null>(null);

  const spy = async () => {
    if (!domain.trim()) { toast.error('Enter a competitor domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a backlink intelligence expert. Return JSON only.' },
          { role: 'user', content: `Analyze the estimated backlink profile of: ${domain}

Return JSON:
{
  "estimatedBacklinks": number,
  "estimatedDa": number(1-100),
  "topLinkingDomains": [
    { "domain": "linking-site.com", "da": number, "type": "blog|news|directory|forum|resource" }
  ],
  "contentTypes": [
    { "type": "content type that earns links", "percentage": number, "example": "example topic" }
  ],
  "replicationStrategies": ["strategy 1", "strategy 2"],
  "summary": "backlink profile overview"
}

Generate 10 top linking domains and 5 content types. Provide 5-7 replication strategies.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Backlink spy complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="size-6" />
            Competitor Backlink Spy
          </h1>
          <p className="text-muted-foreground">Analyze competitor backlink profiles and replication strategies</p>
        </div>

        <Card>
          <CardContent className="pt-6 flex gap-2">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="competitor.com" className="font-mono text-xs" />
            <Button onClick={spy} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              Spy on Backlinks
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.estimatedBacklinks.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Estimated Backlinks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.estimatedDa >= 50 ? 'text-green-400' : result.estimatedDa >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    DA {result.estimatedDa}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Domain Authority</p>
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Linking Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.topLinkingDomains.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="size-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{d.domain}</span>
                        <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{d.type}</span>
                      </div>
                      <span className={`text-xs font-bold ${d.da >= 50 ? 'text-green-400' : d.da >= 30 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                        DA {d.da}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Link-Worthy Content Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.contentTypes.map((ct, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ct.type}</span>
                      <span className="text-xs text-muted-foreground">{ct.percentage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${ct.percentage}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">e.g., {ct.example}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Replication Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.replicationStrategies.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <Sparkles className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{s}</span>
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

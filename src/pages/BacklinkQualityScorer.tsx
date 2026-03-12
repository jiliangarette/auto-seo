import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface BacklinkScore {
  url: string;
  domain: string;
  authorityScore: number;
  relevanceScore: number;
  overallQuality: 'excellent' | 'good' | 'moderate' | 'toxic';
  anchorText: string;
  followType: 'dofollow' | 'nofollow';
  recommendation: string;
}

interface ScorerResult {
  domain: string;
  summary: string;
  totalBacklinks: number;
  averageQuality: number;
  backlinks: BacklinkScore[];
  toxicLinks: { url: string; reason: string; action: string }[];
  acquisitionPriority: { source: string; type: string; difficulty: string }[];
}

const qualityColors: Record<string, string> = {
  excellent: 'text-green-400',
  good: 'text-blue-400',
  moderate: 'text-yellow-400',
  toxic: 'text-red-400',
};

export default function BacklinkQualityScorer() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScorerResult | null>(null);

  const score = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a backlink quality analysis expert. Return JSON only.' },
          { role: 'user', content: `Score backlink profile for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "backlink profile overview",\n  "totalBacklinks": number,\n  "averageQuality": number(0-100),\n  "backlinks": [\n    { "url": "backlink source URL", "domain": "source domain", "authorityScore": number(0-100), "relevanceScore": number(0-100), "overallQuality": "excellent"|"good"|"moderate"|"toxic", "anchorText": "anchor text used", "followType": "dofollow"|"nofollow", "recommendation": "keep|monitor|disavow" }\n  ],\n  "toxicLinks": [\n    { "url": "toxic link URL", "reason": "why it's toxic", "action": "recommended action" }\n  ],\n  "acquisitionPriority": [\n    { "source": "target site", "type": "guest post|resource|broken link", "difficulty": "easy|medium|hard" }\n  ]\n}\n\nGenerate 8 backlinks, 2 toxic links, and 4 acquisition targets.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Backlink scoring complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Backlink Quality Scorer
          </h1>
          <p className="text-muted-foreground">Score backlinks on authority, relevance, and toxicity</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain to analyze (e.g., example.com)" />
            <Button onClick={score} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Score Backlinks
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.domain} — {result.totalBacklinks} Backlinks</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${result.averageQuality >= 70 ? 'text-green-400' : result.averageQuality >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{result.averageQuality}</p>
                    <p className="text-[9px] text-muted-foreground">Avg Quality</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Backlink Profile</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.backlinks.map((b, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium truncate flex-1">{b.domain}</span>
                        <span className={`text-[9px] ${qualityColors[b.overallQuality]}`}>{b.overallQuality}</span>
                        <span className="text-[9px] text-muted-foreground">{b.followType}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Auth: {b.authorityScore}</span>
                        <span>Rel: {b.relevanceScore}</span>
                        <span>Anchor: "{b.anchorText}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {result.toxicLinks.length > 0 && (
              <Card className="border-red-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Toxic Links — Disavow Candidates</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.toxicLinks.map((t, idx) => (
                      <div key={idx} className="rounded-md border border-red-500/20 p-2.5">
                        <p className="text-xs font-mono text-muted-foreground truncate">{t.url}</p>
                        <p className="text-[10px] text-red-400 mt-1">{t.reason}</p>
                        <p className="text-[10px] text-primary/80 mt-1">{t.action}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Acquisition Targets</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.acquisitionPriority.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <div>
                        <p className="text-xs font-medium">{a.source}</p>
                        <p className="text-[10px] text-muted-foreground">{a.type}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${a.difficulty === 'easy' ? 'bg-green-950/30 text-green-400' : a.difficulty === 'medium' ? 'bg-yellow-950/30 text-yellow-400' : 'bg-red-950/30 text-red-400'}`}>{a.difficulty}</span>
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

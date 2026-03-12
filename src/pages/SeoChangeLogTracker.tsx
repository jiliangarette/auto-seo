import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileBarChart } from 'lucide-react';
import { toast } from 'sonner';

interface ChangeEntry {
  date: string;
  change: string;
  category: 'technical' | 'content' | 'backlinks' | 'structure';
  trafficImpact: 'positive' | 'neutral' | 'negative';
  impactDetails: string;
  rollbackRecommended: boolean;
}

interface ChangeLogResult {
  domain: string;
  summary: string;
  changes: ChangeEntry[];
  correlations: { change: string; impact: string; confidence: string }[];
  rollbackCandidates: { change: string; reason: string; action: string }[];
}

const impactColors: Record<string, string> = {
  positive: 'text-green-400',
  neutral: 'text-yellow-400',
  negative: 'text-red-400',
};

const categoryColors: Record<string, string> = {
  technical: 'bg-blue-950/30 text-blue-400',
  content: 'bg-green-950/30 text-green-400',
  backlinks: 'bg-purple-950/30 text-purple-400',
  structure: 'bg-orange-950/30 text-orange-400',
};

export default function SeoChangeLogTracker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChangeLogResult | null>(null);

  const track = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO change tracking and impact analysis expert. Return JSON only.' },
          { role: 'user', content: `Track SEO changes for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "change log overview",\n  "changes": [\n    { "date": "2026-MM-DD", "change": "what changed", "category": "technical"|"content"|"backlinks"|"structure", "trafficImpact": "positive"|"neutral"|"negative", "impactDetails": "traffic impact description", "rollbackRecommended": boolean }\n  ],\n  "correlations": [\n    { "change": "change name", "impact": "correlated impact", "confidence": "high|medium|low" }\n  ],\n  "rollbackCandidates": [\n    { "change": "change to rollback", "reason": "why rollback", "action": "how to rollback" }\n  ]\n}\n\nGenerate 8 change entries over the last 2 months, 3 correlations, and 2 rollback candidates.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Change log generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="size-6" />
            SEO Change Log Tracker
          </h1>
          <p className="text-muted-foreground">Track SEO changes and correlate with traffic impact</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain to track (e.g., example.com)" />
            <Button onClick={track} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
              Track Changes
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.domain} Change Log</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Changes ({result.changes.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.changes.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground">{c.date}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${categoryColors[c.category]}`}>{c.category}</span>
                        <span className="text-xs font-medium flex-1">{c.change}</span>
                        <span className={`text-[9px] ${impactColors[c.trafficImpact]}`}>{c.trafficImpact}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{c.impactDetails}</p>
                      {c.rollbackRecommended && <p className="text-[9px] text-red-400 mt-1">Rollback recommended</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Impact Correlations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.correlations.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-medium">{c.change}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{c.impact}</p>
                      <p className="text-[9px] text-primary mt-1">Confidence: {c.confidence}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {result.rollbackCandidates.length > 0 && (
              <Card className="border-red-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Rollback Candidates</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.rollbackCandidates.map((r, idx) => (
                      <div key={idx} className="rounded-md border border-red-500/20 p-2.5">
                        <p className="text-xs font-medium">{r.change}</p>
                        <p className="text-[10px] text-red-400 mt-1">{r.reason}</p>
                        <p className="text-[10px] text-primary/80 mt-1">{r.action}</p>
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

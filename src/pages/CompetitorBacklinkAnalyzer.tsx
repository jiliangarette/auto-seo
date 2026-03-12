import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface BacklinkResult {
  competitor: string;
  summary: string;
  distribution: { type: string; count: number; quality: string; percentage: number }[];
  opportunities: { site: string; da: number; relevance: string; difficulty: string; approach: string }[];
  patterns: { pattern: string; frequency: string; impact: string }[];
  outreachTemplates: { targetType: string; subject: string; body: string }[];
}

export default function CompetitorBacklinkAnalyzer() {
  const [competitor, setCompetitor] = useState('');
  const [yourSite, setYourSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacklinkResult | null>(null);

  const analyze = async () => {
    if (!competitor.trim()) { toast.error('Enter competitor URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a backlink analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze competitor backlink profile:\nCompetitor: ${competitor}\nYour site: ${yourSite || 'not provided'}\n\nReturn JSON:\n{\n  "competitor": "${competitor}",\n  "summary": "backlink analysis overview",\n  "distribution": [\n    { "type": "link type", "count": number, "quality": "high/medium/low", "percentage": number }\n  ],\n  "opportunities": [\n    { "site": "target site", "da": number, "relevance": "high/medium/low", "difficulty": "easy/medium/hard", "approach": "how to get the link" }\n  ],\n  "patterns": [\n    { "pattern": "pattern name", "frequency": "how common", "impact": "SEO impact" }\n  ],\n  "outreachTemplates": [\n    { "targetType": "type of site", "subject": "email subject", "body": "email body" }\n  ]\n}\n\nGenerate 5 link types, 6 opportunities, 4 patterns, and 3 outreach templates.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Backlink analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
            <Link2 className="size-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Competitor Backlink Analyzer</h1>
            <p className="text-xs text-muted-foreground">Reverse-engineer competitor link profiles and find opportunities</p>
          </div>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="pt-5 pb-5 space-y-3">
            <Input value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="Competitor URL (e.g., competitor.com)" className="bg-background/50 border-border/40" />
            <Input value={yourSite} onChange={(e) => setYourSite(e.target.value)} placeholder="Your site URL (optional — for gap analysis)" className="bg-background/50 border-border/40" />
            <Button onClick={analyze} disabled={loading} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-0 text-white">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              {loading ? 'Analyzing...' : 'Analyze Backlinks'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-4 pb-4">
                <h2 className="text-sm font-bold">{result.competitor}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Link Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.distribution.map((d, idx) => (
                    <div key={idx} className="rounded-lg border border-border/30 p-2.5 bg-background/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">{d.type}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`font-bold ${d.quality === 'high' ? 'text-emerald-400' : d.quality === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>{d.quality}</span>
                          <span className="text-muted-foreground">{d.count} links</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${d.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Link Building Opportunities</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.opportunities.map((o, idx) => (
                    <div key={idx} className="rounded-lg border border-border/30 p-2.5 bg-background/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{o.site}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-orange-400">DA: {o.da}</span>
                          <span className={`font-bold ${o.difficulty === 'easy' ? 'text-emerald-400' : o.difficulty === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>{o.difficulty}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{o.approach}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Link Patterns</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.patterns.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5 bg-background/30">
                      <span className="text-xs font-medium">{p.pattern}</span>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{p.frequency}</span>
                        <span className="text-orange-400">{p.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Outreach Templates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.outreachTemplates.map((t, idx) => (
                    <div key={idx} className="rounded-lg border border-border/30 p-3 bg-background/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{t.targetType}</span>
                      </div>
                      <p className="text-xs font-bold">{t.subject}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">{t.body}</p>
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

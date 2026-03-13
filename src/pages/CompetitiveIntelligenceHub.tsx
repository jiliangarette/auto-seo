import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface CompetitorProfile {
  name: string;
  strengths: string[];
  weaknesses: string[];
  topStrategy: string;
  estimatedTraffic: string;
  contentFrequency: string;
}

interface MarketShare {
  category: string;
  yourShare: number;
  topCompetitor: string;
  competitorShare: number;
  opportunity: string;
}

interface IntelResult {
  domain: string;
  summary: string;
  competitors: CompetitorProfile[];
  marketShare: MarketShare[];
  advantages: { advantage: string; howToExploit: string }[];
  actionPlan: string[];
}

export default function CompetitiveIntelligenceHub() {
  const [domain, setDomain] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<IntelResult | null>(null);

  const analyze = async () => {
    if (!domain.trim() || !competitors.trim()) { toast.error('Enter domain and competitors'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a competitive intelligence and SEO strategy expert. Return JSON only.' },
          { role: 'user', content: `Competitive intelligence analysis:\nYour Domain: ${domain}\nCompetitors: ${competitors}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "competitive intelligence overview",\n  "competitors": [\n    { "name": "competitor", "strengths": ["str1", "str2"], "weaknesses": ["weak1"], "topStrategy": "their main strategy", "estimatedTraffic": "monthly estimate", "contentFrequency": "posts per month" }\n  ],\n  "marketShare": [\n    { "category": "keyword category", "yourShare": number(0-100), "topCompetitor": "competitor name", "competitorShare": number(0-100), "opportunity": "market opportunity" }\n  ],\n  "advantages": [\n    { "advantage": "your competitive advantage", "howToExploit": "how to capitalize" }\n  ],\n  "actionPlan": ["action 1", "action 2", "action 3"]\n}\n\nGenerate profiles for each competitor, 4 market share categories, 3 advantages, and 5 action items.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Intelligence gathered');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="size-6" />
            Competitive Intelligence Hub
          </h1>
          <p className="text-muted-foreground">Comprehensive competitive analysis with action plans</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Your domain (e.g., example.com)" />
            <Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="Competitors (comma-separated, e.g., comp1.com, comp2.com)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              Gather Intelligence
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Intelligence Report: {result.domain}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            {result.competitors.map((c, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    <div className="text-right text-[10px] text-muted-foreground">
                      <p>{c.estimatedTraffic}/mo</p>
                      <p>{c.contentFrequency}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-primary/80 mb-2">Strategy: {c.topStrategy}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-bold text-green-400 mb-1">Strengths</p>
                      {c.strengths.map((s, i) => <p key={i} className="text-[10px] text-muted-foreground">+ {s}</p>)}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-red-400 mb-1">Weaknesses</p>
                      {c.weaknesses.map((w, i) => <p key={i} className="text-[10px] text-muted-foreground">- {w}</p>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Market Share by Category</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.marketShare.map((m, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-medium mb-1">{m.category}</p>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-primary">You: {m.yourShare}%</span>
                        <span className="text-muted-foreground">{m.topCompetitor}: {m.competitorShare}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 mt-1.5">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${m.yourShare}%` }} />
                      </div>
                      <p className="text-[10px] text-green-400 mt-1">{m.opportunity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Your Competitive Advantages</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.advantages.map((a, idx) => (
                    <div key={idx} className="rounded-md border border-green-500/20 p-2.5">
                      <p className="text-xs font-medium text-green-400">{a.advantage}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{a.howToExploit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Action Plan</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.actionPlan.map((a, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

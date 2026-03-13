import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Swords, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface StrategyItem {
  area: string;
  competitorApproach: string;
  gap: string;
  counterStrategy: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

interface PlaybookResult {
  competitor: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  strategies: StrategyItem[];
  quickWins: string[];
  longTermPlays: string[];
}

const priorityColors: Record<string, string> = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-green-400 bg-green-950/30',
};

export default function SeoCompetitorPlaybook() {
  const [domain, setDomain] = useState('');
  const [yourDomain, setYourDomain] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<PlaybookResult | null>(null);

  const generate = async () => {
    if (!domain.trim()) { toast.error('Enter competitor domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a competitive SEO strategist. Return JSON only.' },
          { role: 'user', content: `Generate an SEO competitor playbook:\nCompetitor: ${domain}\nYour domain: ${yourDomain || 'not specified'}\n\nReturn JSON:\n{\n  "competitor": "${domain}",\n  "summary": "competitor strategy overview",\n  "strengths": ["strength 1", "strength 2", "strength 3"],\n  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],\n  "strategies": [\n    {\n      "area": "Content|Technical|Links|Local|Brand",\n      "competitorApproach": "what they do",\n      "gap": "opportunity you can exploit",\n      "counterStrategy": "specific action to take",\n      "priority": "high"|"medium"|"low",\n      "effort": "low"|"medium"|"high"\n    }\n  ],\n  "quickWins": ["quick win 1", "quick win 2", "quick win 3"],\n  "longTermPlays": ["long term strategy 1", "long term strategy 2"]\n}\n\nGenerate 6-8 strategies across different SEO areas.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Competitor playbook generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportPlaybook = () => {
    if (!result) return;
    const lines = [
      `# SEO Competitor Playbook: ${result.competitor}`,
      '', result.summary, '',
      '## Strengths', ...result.strengths.map((s) => `- ${s}`), '',
      '## Weaknesses', ...result.weaknesses.map((w) => `- ${w}`), '',
      '## Strategies', ...result.strategies.map((s) => `### ${s.area} [${s.priority}]\n- Competitor: ${s.competitorApproach}\n- Gap: ${s.gap}\n- Counter: ${s.counterStrategy}`), '',
      '## Quick Wins', ...result.quickWins.map((q) => `- ${q}`), '',
      '## Long-Term Plays', ...result.longTermPlays.map((l) => `- ${l}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Playbook copied as markdown');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="size-6" />
            SEO Competitor Playbook
          </h1>
          <p className="text-muted-foreground">Deep competitor analysis with counter-strategies and action plan</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Competitor domain (e.g., competitor.com)" />
            <Input value={yourDomain} onChange={(e) => setYourDomain(e.target.value)} placeholder="Your domain (optional)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              Generate Playbook
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Playbook: {result.competitor}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-3">
              <Card className="border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-400">Their Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {result.strengths.map((s, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-400 shrink-0">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-400">Their Weaknesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {result.weaknesses.map((w, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-red-400 shrink-0">-</span> {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Counter-Strategies ({result.strategies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.strategies.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{s.area}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${priorityColors[s.priority] ?? 'bg-muted/30'}`}>{s.priority}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">Effort: {s.effort}</span>
                      </div>
                      <p className="text-xs"><span className="text-muted-foreground">They do:</span> {s.competitorApproach}</p>
                      <p className="text-xs"><span className="text-yellow-400">Gap:</span> {s.gap}</p>
                      <p className="text-xs font-medium"><span className="text-primary">Counter:</span> {s.counterStrategy}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-3">
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Wins</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {result.quickWins.map((q, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary font-bold shrink-0">{idx + 1}.</span> {q}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Long-Term Plays</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {result.longTermPlays.map((l, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary font-bold shrink-0">{idx + 1}.</span> {l}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Button variant="outline" onClick={exportPlaybook} className="gap-1.5">
              <Copy className="size-3.5" /> Export Playbook
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

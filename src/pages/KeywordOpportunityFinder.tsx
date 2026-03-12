import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Opportunity {
  keyword: string;
  volume: string;
  difficulty: number;
  opportunityScore: number;
  intent: string;
  suggestedContent: string;
}

interface OpportunityResult {
  summary: string;
  opportunities: Opportunity[];
  quickWins: string[];
  longTail: string[];
}

export default function KeywordOpportunityFinder() {
  const [seeds, setSeeds] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OpportunityResult | null>(null);

  const find = async () => {
    if (!seeds.trim()) { toast.error('Enter seed keywords'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a keyword research expert. Return JSON only.' },
          { role: 'user', content: `Find untapped keyword opportunities:\nSeed keywords: ${seeds}\nNiche: ${niche || 'auto-detect'}\n\nReturn JSON:\n{\n  "summary": "opportunity analysis overview",\n  "opportunities": [\n    {\n      "keyword": "keyword phrase",\n      "volume": "estimated monthly volume range",\n      "difficulty": number(1-100),\n      "opportunityScore": number(1-100, higher = better opportunity),\n      "intent": "informational|commercial|transactional",\n      "suggestedContent": "content type to target this keyword"\n    }\n  ],\n  "quickWins": ["low difficulty, high opportunity keywords"],\n  "longTail": ["long tail opportunities with high intent"]\n}\n\nGenerate 15-20 keyword opportunities sorted by opportunity score. Include a mix of difficulty levels.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Opportunities found');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const exportList = () => {
    if (!result) return;
    const lines = ['Keyword,Volume,Difficulty,Opportunity Score,Intent,Content Type'];
    result.opportunities.forEach((o) => {
      lines.push(`"${o.keyword}","${o.volume}",${o.difficulty},${o.opportunityScore},"${o.intent}","${o.suggestedContent}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Keyword list copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Keyword Opportunity Finder
          </h1>
          <p className="text-muted-foreground">Discover untapped keywords with difficulty vs volume scoring</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={seeds} onChange={(e) => setSeeds(e.target.value)} placeholder="Seed keywords (comma-separated)" />
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche (optional, e.g., SaaS, e-commerce)" />
            <Button onClick={find} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Find Opportunities
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-3">
              <Card className="border-green-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-green-400">Quick Wins</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{result.quickWins.map((q, i) => <li key={i} className="text-xs text-muted-foreground">• {q}</li>)}</ul>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400">Long-Tail Gems</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{result.longTail.map((l, i) => <li key={i} className="text-xs text-muted-foreground">• {l}</li>)}</ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Opportunities ({result.opportunities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.opportunities
                    .sort((a, b) => b.opportunityScore - a.opportunityScore)
                    .map((o, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                        <span className={`text-xs font-bold w-8 text-center ${o.opportunityScore >= 70 ? 'text-green-400' : o.opportunityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{o.opportunityScore}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{o.keyword}</p>
                          <p className="text-[10px] text-muted-foreground">{o.suggestedContent} · {o.intent}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{o.volume}</span>
                        <span className={`text-[10px] ${o.difficulty <= 30 ? 'text-green-400' : o.difficulty <= 60 ? 'text-yellow-400' : 'text-red-400'}`}>D:{o.difficulty}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportList} className="gap-1.5">
              <Copy className="size-3.5" /> Export Keyword List
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Prospect {
  domain: string;
  authority: number;
  linksToCompetitors: number;
  relevance: string;
  outreachDifficulty: 'easy' | 'medium' | 'hard';
}

interface GapResult {
  yourDomain: string;
  competitors: string[];
  prospects: Prospect[];
  summary: string;
  totalGaps: number;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400 bg-green-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  hard: 'text-red-400 bg-red-950/30',
};

export default function BacklinkGapAnalyzer() {
  const [domain, setDomain] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);

  const analyze = async () => {
    if (!domain.trim()) { toast.error('Enter your domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a backlink analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze backlink gaps:\nYour domain: ${domain}\nCompetitor domains: ${competitors || 'auto-detect top 3 competitors'}\n\nReturn JSON:\n{\n  "yourDomain": "${domain}",\n  "competitors": ["comp1.com", "comp2.com"],\n  "prospects": [\n    { "domain": "prospect.com", "authority": number(1-100), "linksToCompetitors": number, "relevance": "why this site is relevant", "outreachDifficulty": "easy"|"medium"|"hard" }\n  ],\n  "summary": "gap analysis overview",\n  "totalGaps": number\n}\n\nGenerate 10-15 realistic prospect domains that would link to competitors in this niche but not to the user's domain.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Backlink gap analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportList = () => {
    if (!result) return;
    const lines = ['Domain,Authority,Links to Competitors,Relevance,Difficulty'];
    result.prospects.forEach((p) => {
      lines.push(`"${p.domain}",${p.authority},${p.linksToCompetitors},"${p.relevance}","${p.outreachDifficulty}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Outreach list copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Backlink Gap Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find domains linking to competitors but not you</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Your domain (e.g., yourdomain.com)" />
            <textarea
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Competitor domains (one per line, optional)&#10;competitor1.com&#10;competitor2.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Analyze Gaps
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-border/30 bg-card/40 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.totalGaps} Link Gap Opportunities</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    vs {result.competitors.join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prospect Domains ({result.prospects.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.prospects
                    .sort((a, b) => b.authority - a.authority)
                    .map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                        <span className="text-xs font-bold text-primary w-8 text-center">{p.authority}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.domain}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{p.relevance}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.linksToCompetitors} links</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${difficultyColors[p.outreachDifficulty] ?? 'bg-muted/30'}`}>
                          {p.outreachDifficulty}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportList} className="gap-1.5">
              <Copy className="size-3.5" /> Export Outreach List
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

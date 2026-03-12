import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GitCompareArrows,
  Loader2,
  Download,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

interface GapKeyword {
  keyword: string;
  competitorRank: number;
  estimatedVolume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  opportunityScore: number;
  intent: string;
}

interface GapResult {
  yourDomain: string;
  competitors: string[];
  gaps: GapKeyword[];
  summary: string;
}

export default function KeywordGap() {
  const [yourDomain, setYourDomain] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [sortBy, setSortBy] = useState<'opportunityScore' | 'estimatedVolume' | 'competitorRank'>('opportunityScore');

  const analyze = async () => {
    if (!yourDomain.trim() || !competitors.trim()) {
      toast.error('Enter your domain and at least one competitor');
      return;
    }
    setLoading(true);
    try {
      const compList = competitors.split('\n').map((c) => c.trim()).filter(Boolean);
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO keyword gap analysis expert. Return JSON only.' },
          { role: 'user', content: `Perform keyword gap analysis:
Your domain: ${yourDomain}
Competitors: ${compList.join(', ')}

Find keywords competitors rank for that ${yourDomain} likely doesn't.

Return JSON:
{
  "yourDomain": "${yourDomain}",
  "competitors": ${JSON.stringify(compList)},
  "gaps": [
    { "keyword": "string", "competitorRank": number(1-50), "estimatedVolume": number, "difficulty": "easy"|"medium"|"hard", "opportunityScore": number(1-100), "intent": "informational"|"commercial"|"transactional" }
  ],
  "summary": "brief analysis summary"
}

Generate 15-20 realistic keyword gaps sorted by opportunity score.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Gap analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = result.gaps.map((g) => `"${g.keyword}",${g.competitorRank},${g.estimatedVolume},${g.difficulty},${g.opportunityScore},${g.intent}`);
    const csv = `Keyword,Competitor Rank,Est Volume,Difficulty,Opportunity Score,Intent\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-gap-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const sorted = result?.gaps.slice().sort((a, b) => b[sortBy] - a[sortBy]) ?? [];

  const diffColor = { easy: 'text-green-400 bg-green-950/30', medium: 'text-yellow-400 bg-yellow-950/30', hard: 'text-red-400 bg-red-950/30' };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompareArrows className="size-6" />
            Keyword Gap Analysis
          </h1>
          <p className="text-muted-foreground">Find keywords your competitors rank for that you don't</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Domain</label>
              <Input value={yourDomain} onChange={(e) => setYourDomain(e.target.value)} placeholder="yourdomain.com" className="font-mono text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Competitor Domains (one per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs min-h-[80px] resize-y"
                placeholder={"competitor1.com\ncompetitor2.com\ncompetitor3.com"}
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
              />
            </div>
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <GitCompareArrows className="size-4" />}
              Find Keyword Gaps
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.gaps.length}</p>
                  <p className="text-[10px] text-muted-foreground">Keywords Found</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {result.gaps.filter((g) => g.difficulty === 'easy').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Easy Wins</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round(result.gaps.reduce((s, g) => s + g.estimatedVolume, 0) / 1000)}K
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total Volume</p>
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

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {(['opportunityScore', 'estimatedVolume', 'competitorRank'] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => setSortBy(col)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${sortBy === col ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                  >
                    {col === 'opportunityScore' ? 'Opportunity' : col === 'estimatedVolume' ? 'Volume' : 'Rank'}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Keyword Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {sorted.map((g, i) => (
                    <div
                      key={g.keyword}
                      className={`flex items-center justify-between rounded-md border border-border/50 p-2.5 ${i % 2 === 0 ? 'bg-muted/10' : ''} hover:bg-muted/30 transition-colors`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{g.keyword}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${diffColor[g.difficulty]}`}>
                            {g.difficulty}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{g.intent} intent</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-xs font-medium">{g.estimatedVolume.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">volume</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">#{g.competitorRank}</p>
                          <p className="text-[9px] text-muted-foreground">comp rank</p>
                        </div>
                        <div className="w-12">
                          <div className="flex items-center gap-1">
                            <Target className={`size-3 ${g.opportunityScore >= 70 ? 'text-green-400' : g.opportunityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`} />
                            <span className={`text-sm font-bold ${g.opportunityScore >= 70 ? 'text-green-400' : g.opportunityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {g.opportunityScore}
                            </span>
                          </div>
                        </div>
                      </div>
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

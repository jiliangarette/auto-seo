import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Loader2,
  Download,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  cpc: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  isLongTail: boolean;
}

interface ResearchResult {
  seedKeyword: string;
  suggestions: KeywordSuggestion[];
  relatedTopics: string[];
  questions: string[];
}

export default function AiKeywordResearch() {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  const research = async () => {
    if (!seedKeyword.trim()) {
      toast.error('Enter a seed keyword');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO keyword research expert. Return JSON only.' },
          { role: 'user', content: `Research keywords for seed: "${seedKeyword}"${niche ? ` in the "${niche}" niche` : ''}.

Return JSON:
{
  "seedKeyword": "${seedKeyword}",
  "suggestions": [
    { "keyword": "string", "searchVolume": number, "competition": "low"|"medium"|"high", "cpc": number, "intent": "informational"|"commercial"|"transactional"|"navigational", "isLongTail": boolean }
  ],
  "relatedTopics": ["topic1", "topic2"],
  "questions": ["question1", "question2"]
}

Generate 15-20 keyword suggestions including both short-tail and long-tail variants.
Include 5 related topics and 5 "People Also Ask" questions.
Estimates should be realistic.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      setSelectedKeywords(new Set());
      toast.success('Research complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  };

  const selectAll = () => {
    if (!result) return;
    if (selectedKeywords.size === result.suggestions.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(result.suggestions.map((s) => s.keyword)));
    }
  };

  const copySelected = () => {
    const keywords = [...selectedKeywords].join('\n');
    navigator.clipboard.writeText(keywords);
    setCopied(true);
    toast.success(`${selectedKeywords.size} keywords copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = result.suggestions
      .filter((s) => selectedKeywords.size === 0 || selectedKeywords.has(s.keyword))
      .map((s) => `"${s.keyword}",${s.searchVolume},${s.competition},${s.cpc},${s.intent},${s.isLongTail}`);
    const csv = `Keyword,Volume,Competition,CPC,Intent,Long-Tail\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${seedKeyword.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const competitionColor = {
    low: 'text-green-400 bg-green-950/30',
    medium: 'text-yellow-400 bg-yellow-950/30',
    high: 'text-red-400 bg-red-950/30',
  };

  const intentColor = {
    informational: 'text-blue-400',
    commercial: 'text-purple-400',
    transactional: 'text-green-400',
    navigational: 'text-gray-400',
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            AI Keyword Research
          </h1>
          <p className="text-muted-foreground">Discover keywords with AI-powered volume and competition estimates</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Seed Keyword</label>
                <Input value={seedKeyword} onChange={(e) => setSeedKeyword(e.target.value)} placeholder="e.g., seo tools" onKeyDown={(e) => e.key === 'Enter' && research()} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Niche (optional)</label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g., digital marketing" />
              </div>
            </div>
            <Button onClick={research} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Research Keywords
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedKeywords.size === result.suggestions.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedKeywords.size > 0 && (
                  <span className="text-xs text-muted-foreground">{selectedKeywords.size} selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copySelected} disabled={selectedKeywords.size === 0}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="size-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Keywords Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Keyword Suggestions ({result.suggestions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2 w-8"></th>
                        <th className="text-left py-2 px-2">Keyword</th>
                        <th className="text-right py-2 px-2">Volume</th>
                        <th className="text-right py-2 px-2">Competition</th>
                        <th className="text-right py-2 px-2">CPC</th>
                        <th className="text-right py-2 px-2">Intent</th>
                        <th className="text-right py-2 px-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.suggestions.map((s, i) => (
                        <tr
                          key={s.keyword}
                          className={`border-b border-border/30 cursor-pointer transition-colors ${
                            selectedKeywords.has(s.keyword) ? 'bg-primary/5' : i % 2 === 0 ? 'bg-muted/10' : ''
                          } hover:bg-muted/30`}
                          onClick={() => toggleKeyword(s.keyword)}
                        >
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={selectedKeywords.has(s.keyword)}
                              onChange={() => toggleKeyword(s.keyword)}
                              className="rounded"
                            />
                          </td>
                          <td className="py-2 px-2 font-medium">{s.keyword}</td>
                          <td className="text-right py-2 px-2">{s.searchVolume.toLocaleString()}</td>
                          <td className="text-right py-2 px-2">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${competitionColor[s.competition]}`}>
                              {s.competition}
                            </span>
                          </td>
                          <td className="text-right py-2 px-2">${s.cpc.toFixed(2)}</td>
                          <td className="text-right py-2 px-2">
                            <span className={`text-[10px] ${intentColor[s.intent]}`}>{s.intent}</span>
                          </td>
                          <td className="text-right py-2 px-2">
                            {s.isLongTail && <span className="text-[9px] bg-muted rounded px-1.5 py-0.5">long-tail</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Related Topics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="size-4" />
                    Related Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {result.relatedTopics.map((topic) => (
                      <span key={topic} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{topic}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* People Also Ask */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">People Also Ask</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.questions.map((q) => (
                      <div key={q} className="flex items-start gap-1.5 text-xs">
                        <span className="text-primary mt-0.5 shrink-0">?</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

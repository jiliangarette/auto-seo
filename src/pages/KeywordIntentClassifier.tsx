import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ClassifiedKeyword {
  keyword: string;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  confidence: number;
  suggestedContentType: string;
  reasoning: string;
}

interface ClassifierResult {
  keywords: ClassifiedKeyword[];
  intentDistribution: { intent: string; count: number; percentage: number }[];
  summary: string;
}

const intentColors: Record<string, string> = {
  informational: 'text-blue-400 bg-blue-950/30',
  navigational: 'text-purple-400 bg-purple-950/30',
  commercial: 'text-yellow-400 bg-yellow-950/30',
  transactional: 'text-green-400 bg-green-950/30',
};

export default function KeywordIntentClassifier() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifierResult | null>(null);

  const classify = async () => {
    if (!input.trim()) { toast.error('Enter keywords'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a search intent analysis expert. Return JSON only.' },
          { role: 'user', content: `Classify the search intent for these keywords:\n${input}\n\nReturn JSON:\n{\n  "keywords": [\n    { "keyword": "keyword", "intent": "informational"|"navigational"|"commercial"|"transactional", "confidence": number(0-100), "suggestedContentType": "blog post, guide, product page, etc.", "reasoning": "why this intent" }\n  ],\n  "intentDistribution": [\n    { "intent": "informational", "count": number, "percentage": number }\n  ],\n  "summary": "overview"\n}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Keywords classified');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const lines = ['Keyword,Intent,Confidence,Content Type,Reasoning'];
    result.keywords.forEach((k) => {
      lines.push(`"${k.keyword}","${k.intent}",${k.confidence},"${k.suggestedContentType}","${k.reasoning}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('CSV copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Keyword Intent Classifier
          </h1>
          <p className="text-muted-foreground">Classify keywords by search intent with content type suggestions</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter keywords (one per line)&#10;how to start a blog&#10;best crm software 2026&#10;buy running shoes online&#10;hubspot login"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <Button onClick={classify} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Classify Intent
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Intent Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  {result.intentDistribution.map((d, idx) => (
                    <div key={idx} className="text-center">
                      <p className={`text-xl font-bold ${intentColors[d.intent]?.split(' ')[0] ?? ''}`}>{d.count}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{d.intent}</p>
                      <div className="h-1 rounded-full bg-muted/30 mt-1">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${d.percentage}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{d.percentage}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Classified Keywords ({result.keywords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.keywords.map((kw, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{kw.keyword}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{kw.confidence}%</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded capitalize ${intentColors[kw.intent]}`}>{kw.intent}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="bg-muted/30 px-1.5 py-0.5 rounded">{kw.suggestedContentType}</span>
                        <span>{kw.reasoning}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportCsv} className="gap-1.5">
              <Copy className="size-3.5" /> Export as CSV
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MappedKeyword {
  keyword: string;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  contentFormat: string;
  priority: number;
}

interface IntentResult {
  summary: string;
  keywords: MappedKeyword[];
  funnelDistribution: { stage: string; count: number; percentage: number }[];
}

const intentColors: Record<string, string> = {
  informational: 'text-blue-400 bg-blue-950/30',
  navigational: 'text-purple-400 bg-purple-950/30',
  commercial: 'text-yellow-400 bg-yellow-950/30',
  transactional: 'text-green-400 bg-green-950/30',
};

const funnelColors: Record<string, string> = {
  TOFU: 'text-blue-400',
  MOFU: 'text-yellow-400',
  BOFU: 'text-green-400',
};

export default function SearchIntentMapper() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);

  const mapIntent = async () => {
    if (!keywords.trim()) { toast.error('Enter keywords to map'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a search intent classification expert. Return JSON only.' },
          { role: 'user', content: `Map search intent and funnel stages for these keywords:\n${keywords}\n\nReturn JSON:\n{\n  "summary": "intent mapping overview",\n  "keywords": [\n    {\n      "keyword": "keyword",\n      "intent": "informational"|"navigational"|"commercial"|"transactional",\n      "funnelStage": "TOFU"|"MOFU"|"BOFU",\n      "contentFormat": "suggested content format (e.g., blog guide, comparison page, product page)",\n      "priority": number(1-10)\n    }\n  ],\n  "funnelDistribution": [\n    { "stage": "TOFU (Top of Funnel)", "count": number, "percentage": number },\n    { "stage": "MOFU (Middle of Funnel)", "count": number, "percentage": number },\n    { "stage": "BOFU (Bottom of Funnel)", "count": number, "percentage": number }\n  ]\n}\n\nClassify each keyword and suggest the optimal content format.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Intent mapping complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Mapping failed');
    } finally {
      setLoading(false);
    }
  };

  const exportMapping = () => {
    if (!result) return;
    const lines = ['Keyword,Intent,Funnel Stage,Content Format,Priority'];
    result.keywords.forEach((k) => {
      lines.push(`"${k.keyword}","${k.intent}","${k.funnelStage}","${k.contentFormat}",${k.priority}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Mapping copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Search Intent Mapper
          </h1>
          <p className="text-muted-foreground">Map keywords to funnel stages with content format suggestions</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to map (one per line)&#10;what is CRM software&#10;best CRM for small business&#10;HubSpot vs Salesforce&#10;buy CRM software online"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={mapIntent} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Map Intent
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
                <CardTitle className="text-sm">Funnel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {result.funnelDistribution.map((f, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3 text-center">
                      <p className="text-2xl font-bold">{f.count}</p>
                      <p className="text-[10px] text-muted-foreground">{f.stage}</p>
                      <div className="h-1.5 rounded-full bg-muted/30 mt-2">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${f.percentage}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">{f.percentage}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Keyword Intent Map ({result.keywords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.keywords
                    .sort((a, b) => b.priority - a.priority)
                    .map((kw, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                        <span className={`text-xs font-bold w-10 ${funnelColors[kw.funnelStage] ?? ''}`}>{kw.funnelStage}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${intentColors[kw.intent] ?? 'bg-muted/30'}`}>{kw.intent}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{kw.keyword}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{kw.contentFormat}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">P{kw.priority}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportMapping} className="gap-1.5">
              <Copy className="size-3.5" /> Export Mapping
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

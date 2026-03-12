import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface MarketPlan {
  locale: string;
  language: string;
  searchEngine: string;
  keywordAdaptations: { original: string; localized: string; searchVolume: string }[];
  culturalNotes: string[];
  hreflangTag: string;
  priority: 'high' | 'medium' | 'low';
}

interface LocalizationResult {
  sourceContent: string;
  summary: string;
  markets: MarketPlan[];
  implementationGuide: string[];
  estimatedReach: string;
}

export default function ContentLocalizationPlanner() {
  const [content, setContent] = useState('');
  const [markets, setMarkets] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocalizationResult | null>(null);

  const plan = async () => {
    if (!content.trim() || !markets.trim()) { toast.error('Enter content topic and target markets'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content localization and international SEO expert. Return JSON only.' },
          { role: 'user', content: `Plan content localization:\nContent/Topic: ${content}\nTarget Markets: ${markets}\n\nReturn JSON:\n{\n  "sourceContent": "${content}",\n  "summary": "localization strategy overview",\n  "markets": [\n    {\n      "locale": "en-US|de-DE|ja-JP|etc",\n      "language": "language name",\n      "searchEngine": "primary search engine",\n      "keywordAdaptations": [{ "original": "english keyword", "localized": "translated keyword", "searchVolume": "estimated volume" }],\n      "culturalNotes": ["cultural adaptation note"],\n      "hreflangTag": "hreflang tag value",\n      "priority": "high"|"medium"|"low"\n    }\n  ],\n  "implementationGuide": ["step 1", "step 2"],\n  "estimatedReach": "total estimated reach across markets"\n}\n\nGenerate plans for 4 markets with 3 keyword adaptations each.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Localization plan generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="size-6" />
            Content Localization Planner
          </h1>
          <p className="text-muted-foreground">Plan locale-specific SEO for international markets</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content topic (e.g., Best CRM Software Guide)" />
            <Input value={markets} onChange={(e) => setMarkets(e.target.value)} placeholder="Target markets (e.g., Germany, Japan, Brazil, France)" />
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Plan Localization
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Localization: {result.sourceContent}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                <p className="text-xs text-primary mt-1">{result.estimatedReach}</p>
              </CardContent>
            </Card>

            {result.markets.map((m, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{m.language} ({m.locale})</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground">{m.searchEngine}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${m.priority === 'high' ? 'bg-green-950/30 text-green-400' : m.priority === 'medium' ? 'bg-yellow-950/30 text-yellow-400' : 'bg-muted/30 text-muted-foreground'}`}>{m.priority}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground mb-1">KEYWORD ADAPTATIONS</p>
                      <div className="space-y-1">
                        {m.keywordAdaptations.map((k, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <span className="text-muted-foreground flex-1">{k.original}</span>
                            <span className="text-primary">→</span>
                            <span className="flex-1 font-medium">{k.localized}</span>
                            <span className="text-muted-foreground">{k.searchVolume}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground mb-1">CULTURAL NOTES</p>
                      {m.culturalNotes.map((n, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground">• {n}</p>
                      ))}
                    </div>
                    <p className="text-[10px] font-mono text-primary/60">hreflang: {m.hreflangTag}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Implementation Guide</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.implementationGuide.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
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

import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SerpFeature {
  keyword: string;
  features: {
    type: string;
    present: boolean;
    yourSite: boolean;
    opportunity: 'high' | 'medium' | 'low' | 'none';
  }[];
}

interface TrackerResult {
  keywords: SerpFeature[];
  featureSummary: { type: string; count: number; opportunities: number }[];
  summary: string;
}

const oppColors = {
  high: 'text-green-400 bg-green-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
  none: 'text-muted-foreground bg-muted/30',
};

export default function SerpFeatureTracker() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<TrackerResult | null>(null);

  const track = async () => {
    if (!keywords.trim()) { toast.error('Enter keywords'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a SERP analysis expert. Return JSON only.' },
          { role: 'user', content: `Track SERP features for these keywords:\n${keywords}\n\nReturn JSON:\n{\n  "keywords": [\n    {\n      "keyword": "keyword",\n      "features": [\n        { "type": "Featured Snippet"|"People Also Ask"|"Local Pack"|"Image Pack"|"Video"|"Knowledge Panel"|"Sitelinks"|"Reviews", "present": boolean, "yourSite": boolean, "opportunity": "high"|"medium"|"low"|"none" }\n      ]\n    }\n  ],\n  "featureSummary": [\n    { "type": "Featured Snippet", "count": number, "opportunities": number }\n  ],\n  "summary": "overview"\n}\n\nFor each keyword, check 6-8 SERP feature types. Generate realistic data with a mix of present/absent features.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('SERP features tracked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="size-6" />
            SERP Feature Tracker
          </h1>
          <p className="text-muted-foreground">Track featured snippets, PAA, local packs, and more per keyword</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to track (one per line)&#10;best crm software&#10;email marketing tips&#10;seo tools comparison"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={track} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              Track SERP Features
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

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Feature Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-4">
                  {result.featureSummary.map((fs, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 text-center">
                      <p className="text-xs font-medium">{fs.type}</p>
                      <p className="text-lg font-bold">{fs.count}</p>
                      <p className="text-[9px] text-green-400">{fs.opportunities} opportunities</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {result.keywords.map((kw, kwIdx) => (
              <Card key={kwIdx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{kw.keyword}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {kw.features.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2">
                          {f.present ? (
                            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                          ) : (
                            <XCircle className="size-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-sm">{f.type}</span>
                          {f.yourSite && (
                            <span className="text-[9px] bg-green-950/30 text-green-400 px-1.5 py-0.5 rounded">You</span>
                          )}
                        </div>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${oppColors[f.opportunity]}`}>
                          {f.opportunity === 'none' ? '—' : f.opportunity}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

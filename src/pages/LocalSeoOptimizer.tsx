import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface GbpCheck {
  area: string;
  status: 'optimized' | 'needs_work' | 'missing';
  suggestion: string;
}

interface CitationIssue {
  platform: string;
  issue: string;
  fix: string;
}

interface LocalResult {
  business: string;
  location: string;
  summary: string;
  localScore: number;
  gbpChecks: GbpCheck[];
  citations: CitationIssue[];
  reviewStrategy: { action: string; template: string }[];
  localKeywords: { keyword: string; intent: string; volume: string }[];
}

const gbpColors: Record<string, string> = {
  optimized: 'text-green-400',
  needs_work: 'text-yellow-400',
  missing: 'text-red-400',
};

export default function LocalSeoOptimizer() {
  const [business, setBusiness] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocalResult | null>(null);

  const optimize = async () => {
    if (!business.trim() || !location.trim()) { toast.error('Enter business and location'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a local SEO expert. Return JSON only.' },
          { role: 'user', content: `Optimize local SEO:\nBusiness: ${business}\nLocation: ${location}\n\nReturn JSON:\n{\n  "business": "${business}",\n  "location": "${location}",\n  "summary": "local SEO overview",\n  "localScore": number(0-100),\n  "gbpChecks": [\n    { "area": "GBP section", "status": "optimized"|"needs_work"|"missing", "suggestion": "what to do" }\n  ],\n  "citations": [\n    { "platform": "citation platform", "issue": "consistency issue", "fix": "how to fix" }\n  ],\n  "reviewStrategy": [\n    { "action": "review action", "template": "response template" }\n  ],\n  "localKeywords": [\n    { "keyword": "local keyword", "intent": "search intent", "volume": "estimated volume" }\n  ]\n}\n\nGenerate 6 GBP checks, 4 citation issues, 3 review strategies, and 5 local keywords.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Local SEO optimized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Local SEO Optimizer
          </h1>
          <p className="text-muted-foreground">Optimize Google Business Profile, citations, and reviews</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name (e.g., Joe's Coffee Shop)" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (e.g., Austin, TX)" />
            <Button onClick={optimize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Optimize Local SEO
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.business} — {result.location}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <p className={`text-3xl font-bold ${result.localScore >= 70 ? 'text-green-400' : result.localScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{result.localScore}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Google Business Profile</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.gbpChecks.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-border/50 p-2.5">
                      <span className={`text-[9px] w-16 shrink-0 ${gbpColors[g.status]}`}>{g.status.replace('_', ' ')}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{g.area}</p>
                        <p className="text-[10px] text-muted-foreground">{g.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Citation Consistency</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.citations.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold">{c.platform}</p>
                      <p className="text-[10px] text-red-400 mt-1">{c.issue}</p>
                      <p className="text-[10px] text-primary/80 mt-1">{c.fix}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Review Strategy</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.reviewStrategy.map((r, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-medium">{r.action}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 italic">"{r.template}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Local Keywords</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.localKeywords.map((k, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2">
                      <span className="text-xs font-medium">{k.keyword}</span>
                      <span className="text-[9px] text-muted-foreground">{k.intent}</span>
                      <span className="text-[9px] text-primary">{k.volume}</span>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface CannibalizationIssue {
  keyword: string;
  pages: { url: string; title: string; currentRank: number }[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  trafficLoss: string;
  mergeStrategy: string;
  primaryPage: string;
}

interface CannibalizationResult {
  domain: string;
  summary: string;
  totalIssues: number;
  estimatedTrafficLoss: string;
  issues: CannibalizationIssue[];
  recommendations: string[];
}

const severityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-950/30',
  high: 'text-orange-400 bg-orange-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-muted-foreground bg-muted/30',
};

export default function KeywordCannibalizationDetector() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CannibalizationResult | null>(null);

  const detect = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a keyword cannibalization expert. Return JSON only.' },
          { role: 'user', content: `Detect keyword cannibalization for: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "summary": "cannibalization audit overview",\n  "totalIssues": number,\n  "estimatedTrafficLoss": "estimated monthly traffic loss",\n  "issues": [\n    {\n      "keyword": "cannibalized keyword",\n      "pages": [{ "url": "page url", "title": "page title", "currentRank": number }],\n      "severity": "critical"|"high"|"medium"|"low",\n      "trafficLoss": "estimated loss for this keyword",\n      "mergeStrategy": "how to consolidate",\n      "primaryPage": "which page should be primary"\n    }\n  ],\n  "recommendations": ["rec 1", "rec 2", "rec 3"]\n}\n\nGenerate 5 cannibalization issues, each with 2-3 competing pages.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Cannibalization scan complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
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
            Keyword Cannibalization Detector
          </h1>
          <p className="text-muted-foreground">Find pages competing for the same keywords</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain to scan (e.g., example.com)" />
            <Button onClick={detect} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Detect Cannibalization
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.domain} — {result.totalIssues} Issues Found</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">{result.estimatedTrafficLoss}</p>
                    <p className="text-[9px] text-muted-foreground">Est. Traffic Loss</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cannibalization Issues</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.issues.map((issue, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold">"{issue.keyword}"</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${severityColors[issue.severity]}`}>{issue.severity}</span>
                          <span className="text-[9px] text-red-400">{issue.trafficLoss}</span>
                        </div>
                      </div>
                      <div className="space-y-1 mb-2">
                        {issue.pages.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <span className="text-muted-foreground w-8">#{p.currentRank}</span>
                            <span className={`flex-1 truncate ${p.url === issue.primaryPage ? 'text-green-400' : 'text-muted-foreground'}`}>{p.title}</span>
                            {p.url === issue.primaryPage && <span className="text-[8px] px-1 py-0.5 rounded bg-green-950/30 text-green-400">primary</span>}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-primary/80">{issue.mergeStrategy}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.recommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{r}</span>
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

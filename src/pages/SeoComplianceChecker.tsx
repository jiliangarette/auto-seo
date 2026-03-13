import { useState } from 'react';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceItem {
  category: string;
  check: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  fix: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface ComplianceResult {
  url: string;
  overallScore: number;
  summary: string;
  items: ComplianceItem[];
  coreWebVitals: { metric: string; status: 'good' | 'needs_improvement' | 'poor'; value: string }[];
  fixPriorities: string[];
}

const statusColors: Record<string, string> = {
  pass: 'text-green-400',
  warning: 'text-yellow-400',
  fail: 'text-red-400',
};

const statusBg: Record<string, string> = {
  pass: 'bg-green-950/30',
  warning: 'bg-yellow-950/30',
  fail: 'bg-red-950/30',
};

export default function SeoComplianceChecker() {
  const [url, setUrl] = useSiteUrlInput();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  const check = async () => {
    if (!url.trim()) { toast.error('Enter URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO compliance and web standards expert. Return JSON only.' },
          { role: 'user', content: `Run SEO compliance audit for: ${url}\n\nReturn JSON:\n{\n  "url": "${url}",\n  "overallScore": number(0-100),\n  "summary": "compliance overview",\n  "items": [\n    { "category": "Technical SEO|Content|Accessibility|Performance|Security", "check": "check name", "status": "pass"|"warning"|"fail", "description": "what was checked", "fix": "how to fix if not passing", "priority": "critical"|"high"|"medium"|"low" }\n  ],\n  "coreWebVitals": [\n    { "metric": "LCP|FID|CLS|INP|TTFB", "status": "good"|"needs_improvement"|"poor", "value": "metric value" }\n  ],\n  "fixPriorities": ["priority fix 1", "priority fix 2", "priority fix 3"]\n}\n\nGenerate 10 compliance checks across categories and 5 Core Web Vitals.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Compliance check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Check className="size-6" />
            SEO Compliance Checker
          </h1>
          <p className="text-muted-foreground">Audit against Google guidelines, accessibility, and Core Web Vitals</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL to audit (e.g., https://example.com)" />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Run Compliance Check
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">Compliance Report</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${result.overallScore >= 80 ? 'text-green-400' : result.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{result.overallScore}</p>
                    <p className="text-[9px] text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Core Web Vitals</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {result.coreWebVitals.map((v, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 text-center">
                      <p className="text-xs font-bold">{v.metric}</p>
                      <p className={`text-sm font-bold mt-1 ${v.status === 'good' ? 'text-green-400' : v.status === 'needs_improvement' ? 'text-yellow-400' : 'text-red-400'}`}>{v.value}</p>
                      <p className={`text-[8px] mt-0.5 ${v.status === 'good' ? 'text-green-400' : v.status === 'needs_improvement' ? 'text-yellow-400' : 'text-red-400'}`}>{v.status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance Checks ({result.items.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusBg[item.status]} ${statusColors[item.status]}`}>{item.status}</span>
                        <span className="text-[9px] text-muted-foreground">{item.category}</span>
                        <span className="text-xs font-medium flex-1">{item.check}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.description}</p>
                      {item.status !== 'pass' && <p className="text-[10px] text-primary/80 mt-1">{item.fix}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Fix Priorities</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.fixPriorities.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{f}</span>
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

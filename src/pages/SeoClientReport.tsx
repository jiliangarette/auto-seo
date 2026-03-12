import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileBarChart, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ReportSection {
  title: string;
  content: string;
  metrics: { label: string; value: string; change: string }[];
}

interface ClientReport {
  clientName: string;
  domain: string;
  period: string;
  executiveSummary: string;
  sections: ReportSection[];
  recommendations: string[];
  htmlReport: string;
}

export default function SeoClientReport() {
  const [client, setClient] = useState('');
  const [domain, setDomain] = useState('');
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClientReport | null>(null);

  const generate = async () => {
    if (!client.trim()) { toast.error('Enter client name'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO reporting expert who creates executive-level client reports. Return JSON only.' },
          { role: 'user', content: `Generate an SEO client report:\nClient: ${client}\nDomain: ${domain || 'client-domain.com'}\nPeriod: ${period || 'Last 30 days'}\n\nReturn JSON:\n{\n  "clientName": "${client}",\n  "domain": "${domain || 'client-domain.com'}",\n  "period": "${period || 'Last 30 days'}",\n  "executiveSummary": "2-3 sentence executive summary of SEO performance",\n  "sections": [\n    {\n      "title": "section name",\n      "content": "section narrative",\n      "metrics": [{ "label": "metric name", "value": "current value", "change": "+X% vs last period" }]\n    }\n  ],\n  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],\n  "htmlReport": "complete formatted HTML report string"\n}\n\nInclude sections for: Organic Traffic, Keyword Rankings, Backlink Profile, Technical Health, Content Performance. Generate 3-4 metrics per section.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Client report generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportHtml = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.htmlReport);
    toast.success('HTML report copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="size-6" />
            SEO Client Report Generator
          </h1>
          <p className="text-muted-foreground">Generate executive-level SEO reports for clients</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" />
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain (optional)" />
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Period (e.g., March 2026)" />
            </div>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold">{result.clientName} — {result.period}</h2>
                  <span className="text-[10px] text-muted-foreground">{result.domain}</span>
                </div>
                <p className="text-xs text-muted-foreground">{result.executiveSummary}</p>
              </CardContent>
            </Card>

            {result.sections.map((section, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{section.content}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {section.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="rounded-md border border-border/50 p-2 text-center">
                        <p className="text-sm font-bold">{m.value}</p>
                        <p className="text-[9px] text-muted-foreground">{m.label}</p>
                        <p className={`text-[9px] font-medium ${m.change.startsWith('+') ? 'text-green-400' : m.change.startsWith('-') ? 'text-red-400' : 'text-muted-foreground'}`}>{m.change}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportHtml} className="gap-1.5">
              <Copy className="size-3.5" /> Export HTML Report
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

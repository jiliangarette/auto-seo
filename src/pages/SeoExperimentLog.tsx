import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Experiment {
  id: number;
  hypothesis: string;
  variables: string;
  status: 'running' | 'completed' | 'inconclusive';
  beforeMetric: string;
  afterMetric: string;
  insight: string;
  date: string;
}

interface LogResult {
  experiments: Experiment[];
  insights: string[];
  summary: string;
}

const statusColors: Record<string, string> = {
  running: 'text-blue-400 bg-blue-950/30',
  completed: 'text-green-400 bg-green-950/30',
  inconclusive: 'text-yellow-400 bg-yellow-950/30',
};

export default function SeoExperimentLog() {
  const [hypothesis, setHypothesis] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);
  const [search, setSearch] = useState('');

  const generate = async () => {
    if (!hypothesis.trim()) { toast.error('Enter experiment hypothesis'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO experimentation expert. Return JSON only.' },
          { role: 'user', content: `Design an SEO experiment and generate sample log entries:\nHypothesis: ${hypothesis}\nContext: ${context || 'general website'}\n\nReturn JSON:\n{\n  "experiments": [\n    {\n      "id": number,\n      "hypothesis": "experiment hypothesis",\n      "variables": "what was changed",\n      "status": "running"|"completed"|"inconclusive",\n      "beforeMetric": "metric before change",\n      "afterMetric": "metric after change",\n      "insight": "key learning from experiment",\n      "date": "2026-MM-DD"\n    }\n  ],\n  "insights": ["cross-experiment insight 1", "insight 2"],\n  "summary": "experiment log overview"\n}\n\nGenerate the requested experiment plus 4-5 related example experiments with realistic before/after metrics.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Experiment log generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = result?.experiments.filter(
    (e) => !search || e.hypothesis.toLowerCase().includes(search.toLowerCase()) || e.variables.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            SEO Experiment Log
          </h1>
          <p className="text-muted-foreground">Log experiments with hypotheses, track results, and generate insights</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="Experiment hypothesis (e.g., Adding FAQ schema increases CTR by 15%)" />
            <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (optional, e.g., e-commerce product pages)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Generate Experiment
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

            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search experiments..." className="h-8 text-xs" />
            </div>

            <div className="space-y-2">
              {filtered.map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{exp.id}</span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[exp.status] ?? 'bg-muted/30'}`}>{exp.status}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{exp.date}</span>
                    </div>
                    <p className="text-sm font-medium">{exp.hypothesis}</p>
                    <p className="text-xs text-muted-foreground">Variables: {exp.variables}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-border/50 p-2">
                        <p className="text-[9px] text-muted-foreground">Before</p>
                        <p className="text-xs font-medium">{exp.beforeMetric}</p>
                      </div>
                      <div className="rounded-md border border-border/50 p-2">
                        <p className="text-[9px] text-muted-foreground">After</p>
                        <p className="text-xs font-medium text-primary">{exp.afterMetric}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-400/80 italic">{exp.insight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cross-Experiment Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{insight}</span>
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

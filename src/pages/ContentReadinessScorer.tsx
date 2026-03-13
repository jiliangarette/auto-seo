import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  fix: string;
}

interface ReadinessResult {
  title: string;
  readinessScore: number;
  verdict: 'ready' | 'needs_work' | 'not_ready';
  summary: string;
  checklist: ChecklistItem[];
  finalOptimizations: string[];
}

const statusIcons: Record<string, string> = { pass: '✓', warning: '!', fail: '✗' };
const statusColors: Record<string, string> = { pass: 'text-green-400', warning: 'text-yellow-400', fail: 'text-red-400' };
const statusBg: Record<string, string> = { pass: 'bg-green-950/30', warning: 'bg-yellow-950/30', fail: 'bg-red-950/30' };

export default function ContentReadinessScorer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);

  const score = async () => {
    if (!content.trim()) { toast.error('Enter content'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content quality and SEO readiness expert. Return JSON only.' },
          { role: 'user', content: `Score content readiness for publication:\n\n${content}\n\nReturn JSON:\n{\n  "title": "detected or suggested title",\n  "readinessScore": number(0-100),\n  "verdict": "ready"|"needs_work"|"not_ready",\n  "summary": "readiness assessment",\n  "checklist": [\n    { "check": "check name", "status": "pass"|"warning"|"fail", "details": "what was found", "fix": "how to fix if not passing" }\n  ],\n  "finalOptimizations": ["final tweak 1", "final tweak 2"]\n}\n\nCheck 10 items: title tag, meta description, heading structure, keyword density, internal links, image alt tags, readability, content length, CTA presence, schema markup readiness.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Readiness scored');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Check className="size-6" />
            Content Readiness Scorer
          </h1>
          <p className="text-muted-foreground">Score draft content for publication readiness</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste draft content to score..."
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={score} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Score Readiness
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                    <p className={`text-xs font-bold mt-1 ${result.verdict === 'ready' ? 'text-green-400' : result.verdict === 'needs_work' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {result.verdict === 'ready' ? 'Ready to Publish' : result.verdict === 'needs_work' ? 'Needs Work' : 'Not Ready'}
                    </p>
                  </div>
                  <p className={`text-3xl font-bold ${result.readinessScore >= 80 ? 'text-green-400' : result.readinessScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{result.readinessScore}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pre-Publish Checklist</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.checklist.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold w-5 text-center ${statusColors[c.status]}`}>{statusIcons[c.status]}</span>
                        <span className="text-xs font-medium flex-1">{c.check}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusBg[c.status]} ${statusColors[c.status]}`}>{c.status}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-7">{c.details}</p>
                      {c.status !== 'pass' && <p className="text-[10px] text-primary/80 ml-7 mt-1">{c.fix}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Final Optimizations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.finalOptimizations.map((o, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{o}</span>
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

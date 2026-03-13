import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tags } from 'lucide-react';
import { toast } from 'sonner';

interface PrioritizedTask {
  task: string;
  impact: number;
  effort: number;
  urgency: 'immediate' | 'this_week' | 'this_month' | 'next_quarter';
  quadrant: 'do_first' | 'schedule' | 'delegate' | 'eliminate';
  score: number;
  reasoning: string;
}

interface SprintPlan {
  week: number;
  tasks: string[];
  goal: string;
}

interface PrioritizerResult {
  goal: string;
  summary: string;
  tasks: PrioritizedTask[];
  sprintPlan: SprintPlan[];
  quickWins: string[];
}

const quadrantColors: Record<string, string> = {
  do_first: 'text-red-400 bg-red-950/30',
  schedule: 'text-blue-400 bg-blue-950/30',
  delegate: 'text-yellow-400 bg-yellow-950/30',
  eliminate: 'text-muted-foreground bg-muted/30',
};

const quadrantLabels: Record<string, string> = {
  do_first: 'Do First',
  schedule: 'Schedule',
  delegate: 'Delegate',
  eliminate: 'Eliminate',
};

export default function SeoTaskPrioritizer() {
  const [goal, setGoal] = useState('');
  const [tasks, setTasks] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<PrioritizerResult | null>(null);

  const prioritize = async () => {
    if (!goal.trim() || !tasks.trim()) { toast.error('Enter goal and tasks'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO task prioritization expert. Return JSON only.' },
          { role: 'user', content: `Prioritize SEO tasks:\nGoal: ${goal}\nTasks: ${tasks}\n\nReturn JSON:\n{\n  "goal": "${goal}",\n  "summary": "prioritization overview",\n  "tasks": [\n    { "task": "task name", "impact": number(1-10), "effort": number(1-10), "urgency": "immediate"|"this_week"|"this_month"|"next_quarter", "quadrant": "do_first"|"schedule"|"delegate"|"eliminate", "score": number(0-100), "reasoning": "why this priority" }\n  ],\n  "sprintPlan": [\n    { "week": number, "tasks": ["task 1", "task 2"], "goal": "sprint goal" }\n  ],\n  "quickWins": ["quick win 1", "quick win 2", "quick win 3"]\n}\n\nGenerate 8 prioritized tasks, 3 weekly sprints, and 3 quick wins.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Tasks prioritized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Prioritization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="size-6" />
            SEO Task Prioritizer
          </h1>
          <p className="text-muted-foreground">Score and prioritize SEO tasks by impact, effort, and urgency</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="SEO goal (e.g., Increase organic traffic 50%)" />
            <Input value={tasks} onChange={(e) => setTasks(e.target.value)} placeholder="Tasks (comma-separated, e.g., fix meta tags, build backlinks, update blog)" />
            <Button onClick={prioritize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
              Prioritize Tasks
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.goal}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Prioritized Tasks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.tasks.sort((a, b) => b.score - a.score).map((t, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-primary">{t.score}</span>
                        <span className="text-xs font-medium flex-1">{t.task}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${quadrantColors[t.quadrant]}`}>{quadrantLabels[t.quadrant]}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Impact: {t.impact}/10</span>
                        <span>Effort: {t.effort}/10</span>
                        <span>{t.urgency.replace('_', ' ')}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">{t.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.sprintPlan.map((s) => (
                <Card key={s.week}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Week {s.week}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">{s.goal}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {s.tasks.map((t, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary shrink-0">•</span>{t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Wins</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.quickWins.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-green-400 font-bold shrink-0">★</span>
                      <span className="text-muted-foreground">{w}</span>
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

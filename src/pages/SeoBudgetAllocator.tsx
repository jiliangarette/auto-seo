import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Gauge, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetCategory {
  category: string;
  allocation: number;
  percentage: number;
  roi: string;
  activities: string[];
}

interface MonthlyPlan {
  month: string;
  spend: number;
  milestone: string;
}

interface BudgetResult {
  summary: string;
  totalBudget: number;
  categories: BudgetCategory[];
  monthlyPlan: MonthlyPlan[];
  expectedOutcome: string;
}

export default function SeoBudgetAllocator() {
  const [budget, setBudget] = useState('');
  const [goals, setGoals] = useState('');
  const [timeline, setTimeline] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BudgetResult | null>(null);

  const allocate = async () => {
    if (!budget.trim()) { toast.error('Enter SEO budget'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO budget planning expert. Return JSON only.' },
          { role: 'user', content: `Allocate SEO budget:\nTotal budget: $${budget}/month\nGoals: ${goals || 'increase organic traffic and rankings'}\nTimeline: ${timeline || '6 months'}\n\nReturn JSON:\n{\n  "summary": "budget allocation strategy",\n  "totalBudget": ${parseInt(budget) || 5000},\n  "categories": [\n    { "category": "Content Creation", "allocation": number, "percentage": number, "roi": "expected ROI description", "activities": ["activity 1", "activity 2"] }\n  ],\n  "monthlyPlan": [\n    { "month": "Month 1", "spend": number, "milestone": "what to achieve" }\n  ],\n  "expectedOutcome": "projected results after timeline"\n}\n\nAllocate across content, link building, technical SEO, tools, and other relevant categories. Generate 6-month plan.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Budget allocated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportPlan = () => {
    if (!result) return;
    const lines = ['Category,Allocation,Percentage,ROI,Activities'];
    result.categories.forEach((c) => {
      lines.push(`"${c.category}",$${c.allocation},${c.percentage}%,"${c.roi}","${c.activities.join('; ')}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Budget plan copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            SEO Budget Allocator
          </h1>
          <p className="text-muted-foreground">AI-optimized budget allocation with ROI projections</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Monthly budget ($)" />
              <Input value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="SEO goals (optional)" />
              <Input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="Timeline (e.g., 6 months)" />
            </div>
            <Button onClick={allocate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Allocate Budget
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex-1">{result.summary}</p>
                  <p className="text-2xl font-bold text-primary ml-4">${result.totalBudget.toLocaleString()}/mo</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Budget Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.categories.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold">{c.category}</span>
                        <span className="text-xs font-medium text-primary">${c.allocation.toLocaleString()} ({c.percentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 mb-2">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${c.percentage}%` }} />
                      </div>
                      <p className="text-[10px] text-green-400/70 mb-1">{c.roi}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.activities.map((a, aIdx) => (
                          <span key={aIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground">{a}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Monthly Spend Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.monthlyPlan.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2">
                      <span className="text-xs font-mono text-muted-foreground w-16">{m.month}</span>
                      <span className="text-xs font-bold w-16">${m.spend.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground flex-1">{m.milestone}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardContent className="pt-4">
                <h3 className="text-sm font-bold text-green-400">Expected Outcome</h3>
                <p className="text-xs text-muted-foreground mt-1">{result.expectedOutcome}</p>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportPlan} className="gap-1.5">
              <Copy className="size-3.5" /> Export Budget Plan
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

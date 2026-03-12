import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface VelocityScenario {
  name: string;
  postsPerMonth: number;
  estimatedTraffic: number;
  timeToGoal: string;
  writersNeeded: number;
  monthlyCost: number;
}

interface VelocityResult {
  summary: string;
  currentRate: number;
  targetTraffic: number;
  scenarios: VelocityScenario[];
  resources: { role: string; count: number; costPerMonth: number }[];
  timeline: { month: string; content: number; projectedTraffic: number }[];
}

export default function ContentVelocityCalc() {
  const [currentRate, setCurrentRate] = useState('');
  const [trafficGoal, setTrafficGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VelocityResult | null>(null);

  const calculate = async () => {
    if (!currentRate.trim()) { toast.error('Enter current publishing rate'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a content operations strategist. Return JSON only.' },
          { role: 'user', content: `Calculate content velocity:\nCurrent rate: ${currentRate} posts/month\nTraffic goal: ${trafficGoal || '50000'} monthly visits\nBudget: $${budget || '5000'}/month\n\nReturn JSON:\n{\n  "summary": "velocity analysis",\n  "currentRate": ${parseInt(currentRate) || 4},\n  "targetTraffic": ${parseInt(trafficGoal) || 50000},\n  "scenarios": [\n    { "name": "Conservative", "postsPerMonth": number, "estimatedTraffic": number, "timeToGoal": "X months", "writersNeeded": number, "monthlyCost": number },\n    { "name": "Moderate", "postsPerMonth": number, "estimatedTraffic": number, "timeToGoal": "X months", "writersNeeded": number, "monthlyCost": number },\n    { "name": "Aggressive", "postsPerMonth": number, "estimatedTraffic": number, "timeToGoal": "X months", "writersNeeded": number, "monthlyCost": number }\n  ],\n  "resources": [{ "role": "role name", "count": number, "costPerMonth": number }],\n  "timeline": [{ "month": "Month 1", "content": number, "projectedTraffic": number }]\n}\n\nGenerate 3 scenarios and a 6-month timeline.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Velocity calculated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            Content Velocity Calculator
          </h1>
          <p className="text-muted-foreground">Calculate publishing rate needed to hit traffic goals</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} placeholder="Current posts/month" />
              <Input value={trafficGoal} onChange={(e) => setTrafficGoal(e.target.value)} placeholder="Traffic goal (monthly)" />
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Content budget ($)" />
            </div>
            <Button onClick={calculate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Calculate Velocity
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

            <div className="grid md:grid-cols-3 gap-3">
              {result.scenarios.map((s, idx) => (
                <Card key={idx} className={idx === 1 ? 'border-primary/30' : ''}>
                  <CardContent className="pt-4">
                    <h3 className="text-sm font-bold mb-2">{s.name}</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Posts/mo</span><span className="font-bold">{s.postsPerMonth}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Est. traffic</span><span className="font-bold">{s.estimatedTraffic.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Time to goal</span><span className="font-bold text-primary">{s.timeToGoal}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Writers</span><span className="font-bold">{s.writersNeeded}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Cost/mo</span><span className="font-bold">${s.monthlyCost.toLocaleString()}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resource Plan</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.resources.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 text-xs">
                      <span>{r.role}</span>
                      <span className="text-muted-foreground">{r.count}x</span>
                      <span className="font-bold">${r.costPerMonth.toLocaleString()}/mo</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline Projection</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.timeline.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 text-xs">
                      <span className="font-mono text-muted-foreground w-16">{t.month}</span>
                      <span className="w-20">{t.content} pieces</span>
                      <span className="font-bold text-primary">{t.projectedTraffic.toLocaleString()} visits</span>
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

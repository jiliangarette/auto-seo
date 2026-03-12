import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChannelPlan {
  platform: string;
  contentFormat: string;
  adaptation: string;
  bestTime: string;
  hashtags: string[];
  expectedReach: string;
}

interface DistributionResult {
  content: string;
  summary: string;
  channels: ChannelPlan[];
  schedule: { day: string; platform: string; action: string }[];
  trackingMetrics: { metric: string; tool: string; target: string }[];
}

export default function ContentDistributionPlanner() {
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DistributionResult | null>(null);

  const plan = async () => {
    if (!content.trim() || !audience.trim()) { toast.error('Enter content and audience'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content distribution and multi-channel marketing expert. Return JSON only.' },
          { role: 'user', content: `Plan content distribution:\nContent: ${content}\nTarget Audience: ${audience}\n\nReturn JSON:\n{\n  "content": "${content}",\n  "summary": "distribution strategy overview",\n  "channels": [\n    { "platform": "platform name", "contentFormat": "post type", "adaptation": "how to adapt for this platform", "bestTime": "optimal posting time", "hashtags": ["tag1", "tag2"], "expectedReach": "estimated reach" }\n  ],\n  "schedule": [\n    { "day": "Day 1|Day 2|etc", "platform": "platform", "action": "what to post" }\n  ],\n  "trackingMetrics": [\n    { "metric": "metric name", "tool": "tracking tool", "target": "target value" }\n  ]\n}\n\nGenerate 6 channel plans, 7-day posting schedule, and 4 tracking metrics.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Distribution plan generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="size-6" />
            Content Distribution Planner
          </h1>
          <p className="text-muted-foreground">Plan multi-channel content distribution with platform adaptations</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content title or topic (e.g., Ultimate Guide to SEO in 2026)" />
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target audience (e.g., SaaS marketers, small business owners)" />
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Plan Distribution
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Distribution Plan: {result.content}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.channels.map((c, idx) => (
                <Card key={idx} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-4">
                    <p className="text-sm font-bold">{c.platform}</p>
                    <p className="text-[9px] text-primary mt-0.5">{c.contentFormat}</p>
                    <p className="text-xs text-muted-foreground mt-2">{c.adaptation}</p>
                    <div className="mt-2 space-y-1 text-[10px]">
                      <p className="text-muted-foreground">Best: {c.bestTime}</p>
                      <p className="text-muted-foreground">Reach: {c.expectedReach}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.hashtags.map((h, i) => (
                          <span key={i} className="px-1 py-0.5 rounded bg-primary/10 text-primary text-[8px]">#{h}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">7-Day Posting Schedule</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.schedule.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-bold text-primary w-12 shrink-0">{s.day}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground shrink-0">{s.platform}</span>
                      <span className="text-xs text-muted-foreground">{s.action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tracking Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.trackingMetrics.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <div>
                        <p className="text-xs font-medium">{m.metric}</p>
                        <p className="text-[10px] text-muted-foreground">{m.tool}</p>
                      </div>
                      <span className="text-xs text-primary font-bold">{m.target}</span>
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

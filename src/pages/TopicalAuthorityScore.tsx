import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SubtopicGap {
  subtopic: string;
  coverage: number;
  priority: 'high' | 'medium' | 'low';
  suggestedContent: string;
}

interface RoadmapItem {
  phase: string;
  actions: string[];
  expectedImpact: string;
}

interface AuthorityResult {
  domain: string;
  topic: string;
  authorityScore: number;
  summary: string;
  subtopicGaps: SubtopicGap[];
  roadmap: RoadmapItem[];
}

export default function TopicalAuthorityScore() {
  const [domain, setDomain] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthorityResult | null>(null);

  const analyze = async () => {
    if (!topic.trim()) { toast.error('Enter a niche topic'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a topical authority SEO expert. Return JSON only.' },
          { role: 'user', content: `Calculate topical authority score:\nDomain: ${domain || 'not specified'}\nTopic: ${topic}\n\nReturn JSON:\n{\n  "domain": "${domain || 'your-site.com'}",\n  "topic": "${topic}",\n  "authorityScore": number(0-100),\n  "summary": "topical authority analysis",\n  "subtopicGaps": [\n    { "subtopic": "subtopic name", "coverage": number(0-100), "priority": "high"|"medium"|"low", "suggestedContent": "content to create" }\n  ],\n  "roadmap": [\n    { "phase": "Phase 1: Foundation", "actions": ["action 1", "action 2"], "expectedImpact": "impact description" }\n  ]\n}\n\nGenerate 8-10 subtopic gaps and 3-4 roadmap phases.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Authority score calculated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-400 bg-red-950/30',
    medium: 'text-yellow-400 bg-yellow-950/30',
    low: 'text-green-400 bg-green-950/30',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="size-6" />
            Topical Authority Score
          </h1>
          <p className="text-muted-foreground">Calculate authority score with coverage gaps and building roadmap</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Your domain (optional)" />
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Niche topic (e.g., email marketing, SaaS pricing)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Calculate Authority
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.topic}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${result.authorityScore >= 70 ? 'text-green-400' : result.authorityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {result.authorityScore}
                    </p>
                    <p className="text-[9px] text-muted-foreground">/ 100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Coverage Gaps ({result.subtopicGaps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.subtopicGaps
                    .sort((a, b) => a.coverage - b.coverage)
                    .map((gap, idx) => (
                      <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium flex-1">{gap.subtopic}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${priorityColors[gap.priority] ?? 'bg-muted/30'}`}>{gap.priority}</span>
                          <span className="text-xs font-bold">{gap.coverage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/30 mb-1.5">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${gap.coverage}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{gap.suggestedContent}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Authority Building Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.roadmap.map((phase, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3">
                      <h3 className="text-sm font-bold text-primary mb-1.5">{phase.phase}</h3>
                      <ul className="space-y-1 mb-2">
                        {phase.actions.map((action, aIdx) => (
                          <li key={aIdx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary shrink-0">{aIdx + 1}.</span> {action}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-green-400 italic">{phase.expectedImpact}</p>
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

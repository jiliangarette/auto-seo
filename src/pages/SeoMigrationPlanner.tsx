import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Code2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface RedirectMapping {
  oldUrl: string;
  newUrl: string;
  type: '301' | '302';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface RiskItem {
  risk: string;
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface ChecklistItem {
  phase: 'pre' | 'during' | 'post';
  task: string;
  critical: boolean;
}

interface MigrationResult {
  summary: string;
  redirects: RedirectMapping[];
  risks: RiskItem[];
  checklist: ChecklistItem[];
  estimatedTrafficImpact: string;
}

const priorityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-950/30',
  high: 'text-orange-400 bg-orange-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-green-400 bg-green-950/30',
};

export default function SeoMigrationPlanner() {
  const [oldUrls, setOldUrls] = useState('');
  const [newUrls, setNewUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const plan = async () => {
    if (!oldUrls.trim()) { toast.error('Enter old URL structure'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO migration specialist. Return JSON only.' },
          { role: 'user', content: `Create an SEO migration plan:\nOld URLs:\n${oldUrls}\nNew URLs:\n${newUrls || 'auto-suggest new structure'}\n\nReturn JSON:\n{\n  "summary": "migration plan overview",\n  "redirects": [\n    { "oldUrl": "/old-path", "newUrl": "/new-path", "type": "301"|"302", "priority": "critical"|"high"|"medium"|"low" }\n  ],\n  "risks": [\n    { "risk": "risk description", "impact": "high"|"medium"|"low", "mitigation": "how to mitigate" }\n  ],\n  "checklist": [\n    { "phase": "pre"|"during"|"post", "task": "task description", "critical": boolean }\n  ],\n  "estimatedTrafficImpact": "expected traffic impact description"\n}\n\nGenerate comprehensive redirect mappings, 4-5 risks, and 12-15 checklist items across all phases.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Migration plan generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
    } finally {
      setLoading(false);
    }
  };

  const exportRedirects = () => {
    if (!result) return;
    const lines = result.redirects.map((r) => `${r.type === '301' ? 'Redirect 301' : 'Redirect 302'} ${r.oldUrl} ${r.newUrl}`);
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Redirect rules copied (.htaccess format)');
  };

  const phases = ['pre', 'during', 'post'] as const;
  const phaseLabels: Record<string, string> = { pre: 'Pre-Migration', during: 'During Migration', post: 'Post-Migration' };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="size-6" />
            SEO Migration Planner
          </h1>
          <p className="text-muted-foreground">Generate redirect maps, risk assessments, and migration checklists</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={oldUrls}
              onChange={(e) => setOldUrls(e.target.value)}
              placeholder="Old URL structure (one per line)&#10;/blog/2024/post-title&#10;/products/category/item&#10;/about-us"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
            <textarea
              value={newUrls}
              onChange={(e) => setNewUrls(e.target.value)}
              placeholder="New URL structure (optional, one per line)&#10;/blog/post-title&#10;/shop/item&#10;/about"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
            />
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Code2 className="size-4" />}
              Generate Migration Plan
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
                <p className="text-xs font-medium text-yellow-400 mt-2">{result.estimatedTrafficImpact}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Redirect Mappings ({result.redirects.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.redirects.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors text-xs">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${priorityColors[r.priority] ?? 'bg-muted/30'}`}>{r.priority}</span>
                      <span className="font-mono text-muted-foreground truncate flex-1">{r.oldUrl}</span>
                      <span className="text-muted-foreground shrink-0">{r.type} →</span>
                      <span className="font-mono text-primary truncate flex-1">{r.newUrl}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={exportRedirects} className="mt-2 gap-1 h-6 text-xs">
                  <Copy className="size-3" /> Copy as .htaccess
                </Button>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.risks.map((r, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${r.impact === 'high' ? 'text-red-400 bg-red-950/30' : r.impact === 'medium' ? 'text-yellow-400 bg-yellow-950/30' : 'text-green-400 bg-green-950/30'}`}>{r.impact} impact</span>
                        <span className="text-xs font-medium">{r.risk}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{r.mitigation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {phases.map((phase) => {
              const items = result.checklist.filter((c) => c.phase === phase);
              if (items.length === 0) return null;
              return (
                <Card key={phase}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{phaseLabels[phase]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs rounded-md border border-border/50 p-2">
                          <span className={`size-1.5 rounded-full shrink-0 ${item.critical ? 'bg-red-400' : 'bg-muted-foreground'}`} />
                          <span className={item.critical ? 'font-medium' : 'text-muted-foreground'}>{item.task}</span>
                          {item.critical && <span className="text-[8px] text-red-400 ml-auto">CRITICAL</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PenaltySignal {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  evidence: string;
}

interface RecoveryAction {
  step: number;
  action: string;
  timeline: string;
  priority: 'critical' | 'high' | 'medium';
}

interface PenaltyResult {
  domain: string;
  riskLevel: 'safe' | 'at_risk' | 'likely_penalized';
  riskScore: number;
  summary: string;
  signals: PenaltySignal[];
  recoveryPlan: RecoveryAction[];
  trafficImpact: string;
}

const riskColors: Record<string, string> = {
  safe: 'text-green-400',
  at_risk: 'text-yellow-400',
  likely_penalized: 'text-red-400',
};

export default function SeoPenaltyChecker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PenaltyResult | null>(null);

  const check = async () => {
    if (!domain.trim()) { toast.error('Enter domain'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO penalty detection expert. Return JSON only.' },
          { role: 'user', content: `Check for SEO penalties:\nDomain: ${domain}\n\nReturn JSON:\n{\n  "domain": "${domain}",\n  "riskLevel": "safe"|"at_risk"|"likely_penalized",\n  "riskScore": number(0-100),\n  "summary": "penalty risk assessment",\n  "signals": [\n    { "type": "signal type", "severity": "high"|"medium"|"low", "description": "what was detected", "evidence": "supporting evidence" }\n  ],\n  "recoveryPlan": [\n    { "step": number, "action": "recovery action", "timeline": "expected duration", "priority": "critical"|"high"|"medium" }\n  ],\n  "trafficImpact": "estimated traffic impact if penalized"\n}\n\nGenerate 5-7 penalty signals and a 4-6 step recovery plan.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Penalty check complete');
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
            <Shield className="size-6" />
            SEO Penalty Checker
          </h1>
          <p className="text-muted-foreground">Detect penalty signals with recovery action plan</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain to check (e.g., example.com)" />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Check Penalties
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className={`border-${result.riskLevel === 'safe' ? 'green' : result.riskLevel === 'at_risk' ? 'yellow' : 'red'}-500/20`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold ${riskColors[result.riskLevel] ?? ''}`}>
                      {result.riskLevel === 'safe' ? 'Safe' : result.riskLevel === 'at_risk' ? 'At Risk' : 'Likely Penalized'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                    <p className="text-xs text-yellow-400 mt-1">{result.trafficImpact}</p>
                  </div>
                  <p className={`text-3xl font-bold ${riskColors[result.riskLevel] ?? ''}`}>{result.riskScore}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Penalty Signals ({result.signals.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.signals.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${s.severity === 'high' ? 'text-red-400 bg-red-950/30' : s.severity === 'medium' ? 'text-yellow-400 bg-yellow-950/30' : 'text-green-400 bg-green-950/30'}`}>{s.severity}</span>
                        <span className="text-xs font-medium">{s.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Evidence: {s.evidence}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recovery Plan</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.recoveryPlan.map((r) => (
                    <div key={r.step} className="flex items-start gap-3 rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-bold text-primary shrink-0">Step {r.step}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{r.action}</p>
                        <p className="text-[10px] text-muted-foreground">{r.timeline}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${r.priority === 'critical' ? 'text-red-400 bg-red-950/30' : r.priority === 'high' ? 'text-orange-400 bg-orange-950/30' : 'text-yellow-400 bg-yellow-950/30'}`}>{r.priority}</span>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MousePointerClick,
  Loader2,
  Sparkles,
  Copy,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface CtaVariant {
  text: string;
  style: string;
  predictedCtr: number;
  reasoning: string;
}

interface CtaAnalysis {
  currentScore: number;
  issues: string[];
  variants: CtaVariant[];
  bestPractices: string[];
}

export default function CtaOptimizer() {
  const [pageContent, setPageContent] = useState('');
  const [currentCta, setCurrentCta] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CtaAnalysis | null>(null);

  const analyze = async () => {
    if (!currentCta.trim()) {
      toast.error('Enter your current CTA text');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a CTA optimization expert specializing in conversion rate optimization. Return JSON only.' },
          { role: 'user', content: `Analyze and optimize this CTA:

Current CTA: "${currentCta}"
Page context: ${pageContent || 'Not provided'}
Goal: ${goal || 'Increase conversions'}

Return JSON:
{
  "currentScore": number(0-100),
  "issues": ["issue with current CTA"],
  "variants": [
    { "text": "optimized CTA text", "style": "button style suggestion", "predictedCtr": number(0-15), "reasoning": "why this works" }
  ],
  "bestPractices": ["applicable best practice"]
}

Generate 5 CTA variants with different approaches (urgency, value prop, social proof, etc.).` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('CTA analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const copyCta = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('CTA copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MousePointerClick className="size-6" />
            CTA Optimizer
          </h1>
          <p className="text-muted-foreground">AI-powered call-to-action optimization for better conversions</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current CTA & Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Current CTA Text</label>
              <Input value={currentCta} onChange={(e) => setCurrentCta(e.target.value)} placeholder="e.g., Sign Up Now" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Conversion Goal (optional)</label>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Free trial signups" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Page Content (optional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                placeholder="Paste surrounding page content for better context..."
              />
            </div>
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Optimize CTA
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${result.currentScore >= 70 ? 'text-green-400' : result.currentScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.currentScore}/100
                  </p>
                  <p className="text-[10px] text-muted-foreground">Current CTA Score</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4">
                  <p className="text-xs font-medium mb-1">Issues Found</p>
                  {result.issues.map((issue, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">• {issue}</p>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimized Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.variants.map((variant, idx) => (
                  <div key={idx} className="rounded-md border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">"{variant.text}"</span>
                        <Button variant="ghost" size="sm" onClick={() => copyCta(variant.text)} className="h-6 px-1.5">
                          <Copy className="size-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="size-3 text-green-400" />
                        <span className="text-xs font-bold text-green-400">{variant.predictedCtr}% CTR</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">Style: {variant.style}</p>
                    <p className="text-xs text-muted-foreground">{variant.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {result.bestPractices.length > 0 && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CTA Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {result.bestPractices.map((bp, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <Sparkles className="size-3 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{bp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface TestVariant {
  label: string;
  title: string;
  metaDescription: string;
  changes: string;
}

interface TestResult {
  hypothesis: string;
  variants: TestVariant[];
  calculator: { sampleSize: number; duration: string; confidenceLevel: string };
  template: string;
}

export default function SeoAbTestPlanner() {
  const [url, setUrl] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const generate = async () => {
    if (!url.trim()) { toast.error('Enter a page URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO A/B testing expert. Return JSON only.' },
          { role: 'user', content: `Create an SEO A/B test plan:\nPage URL: ${url}\nHypothesis: ${hypothesis || 'Improve organic CTR'}\n\nReturn JSON:\n{\n  "hypothesis": "refined hypothesis statement",\n  "variants": [\n    { "label": "Control (A)", "title": "current title", "metaDescription": "current meta", "changes": "no changes" },\n    { "label": "Variant B", "title": "optimized title", "metaDescription": "optimized meta", "changes": "what changed and why" },\n    { "label": "Variant C", "title": "another option", "metaDescription": "another meta", "changes": "what changed and why" }\n  ],\n  "calculator": { "sampleSize": number, "duration": "estimated test duration", "confidenceLevel": "95%" },\n  "template": "markdown template for documenting test results"\n}` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('A/B test plan generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.template);
    toast.success('Template copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="size-6" />
            SEO A/B Test Planner
          </h1>
          <p className="text-muted-foreground">Generate test variants with statistical significance calculator</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Page URL to test (e.g., https://example.com/page)" />
            <Input value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="Test hypothesis (optional, e.g., Adding power words increases CTR)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              Generate Test Plan
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Hypothesis</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.hypothesis}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.variants.map((v, idx) => (
                  <div key={idx} className="rounded-md border border-border/50 p-3 space-y-1.5 hover:bg-muted/20 transition-colors">
                    <span className="text-xs font-bold text-primary">{v.label}</span>
                    <p className="text-sm font-medium">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{v.metaDescription}</p>
                    <p className="text-[10px] text-muted-foreground/70 italic">{v.changes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Statistical Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-border/50 p-2 text-center">
                    <p className="text-lg font-bold">{result.calculator.sampleSize.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Sample Size</p>
                  </div>
                  <div className="rounded-md border border-border/50 p-2 text-center">
                    <p className="text-lg font-bold">{result.calculator.duration}</p>
                    <p className="text-[10px] text-muted-foreground">Est. Duration</p>
                  </div>
                  <div className="rounded-md border border-border/50 p-2 text-center">
                    <p className="text-lg font-bold">{result.calculator.confidenceLevel}</p>
                    <p className="text-[10px] text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={copyTemplate} className="gap-1.5">
              <Copy className="size-3.5" /> Copy Result Template
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

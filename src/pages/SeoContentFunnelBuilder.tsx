import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FunnelStage {
  stage: 'TOFU' | 'MOFU' | 'BOFU';
  label: string;
  intent: string;
  contentIdeas: { title: string; format: string; keyword: string; searchVolume: string }[];
  conversionGoal: string;
}

interface FunnelResult {
  niche: string;
  summary: string;
  stages: FunnelStage[];
  conversionPath: string[];
  optimizations: string[];
}

const stageColors: Record<string, string> = {
  TOFU: 'border-blue-500/30',
  MOFU: 'border-yellow-500/30',
  BOFU: 'border-green-500/30',
};

const stageTextColors: Record<string, string> = {
  TOFU: 'text-blue-400',
  MOFU: 'text-yellow-400',
  BOFU: 'text-green-400',
};

export default function SeoContentFunnelBuilder() {
  const [niche, setNiche] = useState('');
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FunnelResult | null>(null);

  const build = async () => {
    if (!niche.trim() || !product.trim()) { toast.error('Enter niche and product'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content funnel strategy expert. Return JSON only.' },
          { role: 'user', content: `Build content funnel:\nNiche: ${niche}\nProduct/Service: ${product}\n\nReturn JSON:\n{\n  "niche": "${niche}",\n  "summary": "funnel strategy overview",\n  "stages": [\n    {\n      "stage": "TOFU"|"MOFU"|"BOFU",\n      "label": "Top of Funnel|Middle of Funnel|Bottom of Funnel",\n      "intent": "user intent at this stage",\n      "contentIdeas": [\n        { "title": "content title", "format": "blog|guide|comparison|case study|landing page", "keyword": "target keyword", "searchVolume": "estimated volume" }\n      ],\n      "conversionGoal": "what you want users to do"\n    }\n  ],\n  "conversionPath": ["step 1 in conversion journey", "step 2"],\n  "optimizations": ["optimization tip 1", "tip 2"]\n}\n\nGenerate 3 funnel stages with 3 content ideas each, 4 conversion path steps, and 3 optimizations.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content funnel built');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Build failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            SEO Content Funnel Builder
          </h1>
          <p className="text-muted-foreground">Build TOFU/MOFU/BOFU content strategies with keyword mapping</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche (e.g., project management software)" />
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product or service name" />
            <Button onClick={build} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Build Funnel
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Content Funnel: {result.niche}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            {result.stages.map((stage) => (
              <Card key={stage.stage} className={stageColors[stage.stage]}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm ${stageTextColors[stage.stage]}`}>{stage.stage} — {stage.label}</CardTitle>
                    <span className="text-[9px] text-muted-foreground">{stage.conversionGoal}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{stage.intent}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {stage.contentIdeas.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground shrink-0">{c.format}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground">Keyword: {c.keyword} · {c.searchVolume}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Conversion Path</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center">
                  {result.conversionPath.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-md border border-border/50 bg-muted/20">{step}</span>
                      {idx < result.conversionPath.length - 1 && <span className="text-primary">→</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Optimization Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.optimizations.map((o, idx) => (
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface RewriteVariant {
  text: string;
  seoScore: number;
  tone: string;
  keywordDensity: number;
}

interface RewriteResult {
  originalScore: number;
  variants: RewriteVariant[];
  bestIndex: number;
}

export default function ParagraphRewriter() {
  const [paragraph, setParagraph] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);

  const rewrite = async () => {
    if (!paragraph.trim()) { toast.error('Enter a paragraph'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO content rewriting expert. Return JSON only.' },
          { role: 'user', content: `Rewrite this paragraph for SEO:

"${paragraph}"

Target keyword: ${keyword || 'auto-detect'}

Return JSON:
{
  "originalScore": number(0-100),
  "variants": [
    { "text": "rewritten paragraph", "seoScore": number(0-100), "tone": "professional|conversational|authoritative", "keywordDensity": number(0-5) }
  ],
  "bestIndex": number(index of best variant)
}

Generate 4 variants with different tones and keyword integration approaches.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Rewrites generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rewrite failed');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wand2 className="size-6" />
            Paragraph Rewriter
          </h1>
          <p className="text-muted-foreground">AI-powered SEO paragraph rewrites with score comparison</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keyword (optional)</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., content marketing" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Paragraph to Rewrite</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                value={paragraph}
                onChange={(e) => setParagraph(e.target.value)}
                placeholder="Paste the paragraph you want to optimize..."
              />
            </div>
            <Button onClick={rewrite} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Generate Rewrites
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-xl font-bold ${result.originalScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.originalScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Original</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">
                    {result.variants[result.bestIndex]?.seoScore ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Best Rewrite</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold text-green-400">
                    +{(result.variants[result.bestIndex]?.seoScore ?? 0) - result.originalScore} pts
                  </p>
                  <p className="text-[10px] text-muted-foreground">Improvement</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {result.variants.map((variant, idx) => (
                <Card key={idx} className={idx === result.bestIndex ? 'border-green-500/30' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Variant {idx + 1}</CardTitle>
                        {idx === result.bestIndex && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded text-green-400 bg-green-950/30">BEST</span>
                        )}
                        <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{variant.tone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${variant.seoScore >= 80 ? 'text-green-400' : variant.seoScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {variant.seoScore}/100
                        </span>
                        <Button variant="outline" size="sm" onClick={() => copyText(variant.text)}>
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{variant.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">Keyword density: {variant.keywordDensity}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

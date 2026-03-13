import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FlaskConical,
  Loader2,
  Plus,
  Trash2,
  Trophy,
  BarChart3,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface Variant {
  id: string;
  title: string;
  description: string;
}

interface PredictionResult {
  variantId: string;
  predictedCtr: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
}

interface TestResult {
  predictions: PredictionResult[];
  winner: string;
  winnerConfidence: number;
  reasoning: string;
}

export default function ContentAbTest() {
  const [keyword, setKeyword] = useState('');
  const [variants, setVariants] = useState<Variant[]>([
    { id: '1', title: '', description: '' },
    { id: '2', title: '', description: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addVariant = () => {
    if (variants.length >= 5) {
      toast.error('Maximum 5 variants');
      return;
    }
    setVariants((prev) => [...prev, { id: crypto.randomUUID(), title: '', description: '' }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) {
      toast.error('Minimum 2 variants');
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: 'title' | 'description', value: string) => {
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  };

  const runTest = async () => {
    if (!keyword.trim()) {
      toast.error('Enter a target keyword');
      return;
    }
    const valid = variants.filter((v) => v.title.trim());
    if (valid.length < 2) {
      toast.error('At least 2 variants need titles');
      return;
    }
    setLoading(true);
    try {
      const variantList = valid.map((v, i) => `Variant ${String.fromCharCode(65 + i)}:\nTitle: ${v.title}\nDescription: ${v.description || '(none)'}`).join('\n\n');
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a CTR prediction expert for SEO. Predict click-through rates for title/description variants. Return JSON only.' },
          { role: 'user', content: `Target keyword: "${keyword}"

${variantList}

Predict CTR for each variant. Return JSON:
{
  "predictions": [
    { "variantId": "A", "predictedCtr": number (0-20), "confidence": number (0-100), "strengths": ["str1"], "weaknesses": ["weak1"] }
  ],
  "winner": "A",
  "winnerConfidence": number (0-100),
  "reasoning": "Why this variant wins"
}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Map variant IDs back
      const mapped: TestResult = {
        predictions: parsed.predictions.map((p: PredictionResult, i: number) => ({
          ...p,
          variantId: valid[i]?.id ?? p.variantId,
        })),
        winner: valid[parsed.predictions.findIndex((p: PredictionResult) => p.variantId === parsed.winner)]?.id ?? valid[0].id,
        winnerConfidence: parsed.winnerConfidence,
        reasoning: parsed.reasoning,
      };
      setResult(mapped);
      toast.success('A/B test predictions ready');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const copyVariant = (v: Variant) => {
    const text = `Title: ${v.title}\nDescription: ${v.description}`;
    navigator.clipboard.writeText(text);
    setCopiedId(v.id);
    toast.success('Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPrediction = (variantId: string) => result?.predictions.find((p) => p.variantId === variantId);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="size-6" />
            Content A/B Testing
          </h1>
          <p className="text-muted-foreground">Test title and description variants with AI-powered CTR predictions</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keyword</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., best seo tools 2026" />
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <div className="space-y-3">
          {variants.map((v, i) => {
            const prediction = getPrediction(v.id);
            const isWinner = result?.winner === v.id;
            return (
              <Card key={v.id} className={isWinner ? 'border-green-500/50' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className={`rounded-full size-6 flex items-center justify-center text-[10px] font-bold ${
                        isWinner ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      Variant {String.fromCharCode(65 + i)}
                      {isWinner && (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <Trophy className="size-3.5" /> Winner
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyVariant(v)}>
                        {copiedId === v.id ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => removeVariant(v.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Title tag"
                    value={v.title}
                    onChange={(e) => updateVariant(v.id, 'title', e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Meta description (optional)"
                      value={v.description}
                      onChange={(e) => updateVariant(v.id, 'description', e.target.value)}
                      className="flex-1"
                    />
                    {v.title && (
                      <span className={`ml-2 text-[10px] shrink-0 ${v.title.length > 60 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {v.title.length}/60
                      </span>
                    )}
                  </div>

                  {/* SERP Preview */}
                  {v.title && (
                    <div className="rounded bg-white dark:bg-gray-50 p-3 text-black">
                      <p className="text-xs text-green-700 truncate">example.com › page</p>
                      <p className="text-sm font-medium text-blue-700 hover:underline cursor-pointer">{v.title}</p>
                      {v.description && <p className="text-xs text-gray-600 line-clamp-2">{v.description}</p>}
                    </div>
                  )}

                  {/* Prediction */}
                  {prediction && (
                    <div className="rounded-md border border-border/50 p-3 space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className={`text-xl font-bold ${prediction.predictedCtr >= 5 ? 'text-green-400' : prediction.predictedCtr >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {prediction.predictedCtr}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">Predicted CTR</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold">{prediction.confidence}%</p>
                          <p className="text-[10px] text-muted-foreground">Confidence</p>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-muted/50">
                            <div
                              className={`h-full rounded-full ${prediction.predictedCtr >= 5 ? 'bg-green-500' : prediction.predictedCtr >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(prediction.predictedCtr * 5, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-medium text-green-400 mb-0.5">Strengths</p>
                          {prediction.strengths.map((s, si) => (
                            <p key={si} className="text-[10px] text-muted-foreground">• {s}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-red-400 mb-0.5">Weaknesses</p>
                          {prediction.weaknesses.map((w, wi) => (
                            <p key={wi} className="text-[10px] text-muted-foreground">• {w}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={addVariant} disabled={variants.length >= 5}>
            <Plus className="size-4" />
            Add Variant
          </Button>
          <Button onClick={runTest} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
            Predict CTR
          </Button>
        </div>

        {/* Winner Banner */}
        {result && (
          <Card className="border-green-500/30 bg-green-950/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Trophy className="size-6 text-green-400" />
                <div>
                  <p className="text-sm font-bold text-green-400">
                    Variant {String.fromCharCode(65 + variants.findIndex((v) => v.id === result.winner))} wins with {result.winnerConfidence}% confidence
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{result.reasoning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

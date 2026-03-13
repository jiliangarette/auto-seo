import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentPiece {
  id: string;
  title: string;
  monthlyTraffic: number;
  conversions: number;
  productionCost: number;
  revenuePerConversion: number;
}

interface RoiResult {
  roi: number;
  totalRevenue: number;
  totalCost: number;
  ranking: { title: string; roi: number; efficiency: string }[];
  recommendations: string[];
}

let nextId = 1;

export default function ContentRoi() {
  const [pieces, setPieces] = useState<ContentPiece[]>([
    { id: String(nextId++), title: '', monthlyTraffic: 0, conversions: 0, productionCost: 0, revenuePerConversion: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<RoiResult | null>(null);

  const addPiece = () => {
    setPieces([...pieces, { id: String(nextId++), title: '', monthlyTraffic: 0, conversions: 0, productionCost: 0, revenuePerConversion: 0 }]);
  };

  const removePiece = (id: string) => {
    setPieces(pieces.filter((p) => p.id !== id));
  };

  const updatePiece = (id: string, field: keyof ContentPiece, value: string | number) => {
    setPieces(pieces.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const calculate = async () => {
    const valid = pieces.filter((p) => p.title.trim());
    if (valid.length === 0) {
      toast.error('Add at least one content piece');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content marketing ROI analyst. Return JSON only.' },
          { role: 'user', content: `Calculate content ROI for these pieces:

${JSON.stringify(valid.map((p) => ({
  title: p.title,
  monthlyTraffic: p.monthlyTraffic,
  conversions: p.conversions,
  productionCost: p.productionCost,
  revenuePerConversion: p.revenuePerConversion,
  monthlyRevenue: p.conversions * p.revenuePerConversion,
})), null, 2)}

Return JSON:
{
  "roi": number (overall ROI percentage),
  "totalRevenue": number,
  "totalCost": number,
  "ranking": [
    { "title": "content title", "roi": number(percentage), "efficiency": "high"|"medium"|"low" }
  ],
  "recommendations": ["investment recommendation 1", "recommendation 2", ...]
}

Rank by ROI descending. Provide 4-6 actionable recommendations.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('ROI calculated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = result.ranking.map((r) => `"${r.title}",${r.roi}%,${r.efficiency}`);
    const csv = `Title,ROI,Efficiency\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-roi-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const effColors = { high: 'text-green-400 bg-green-950/30', medium: 'text-yellow-400 bg-yellow-950/30', low: 'text-red-400 bg-red-950/30' };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="size-6" />
            Content ROI Calculator
          </h1>
          <p className="text-muted-foreground">Calculate return on investment for your content</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content Pieces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pieces.map((piece) => (
              <div key={piece.id} className="rounded-md border border-border/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={piece.title}
                    onChange={(e) => updatePiece(piece.id, 'title', e.target.value)}
                    placeholder="Content title"
                    className="text-xs"
                  />
                  {pieces.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removePiece(piece.id)}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Monthly Traffic</label>
                    <Input type="number" value={piece.monthlyTraffic || ''} onChange={(e) => updatePiece(piece.id, 'monthlyTraffic', Number(e.target.value))} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Conversions/mo</label>
                    <Input type="number" value={piece.conversions || ''} onChange={(e) => updatePiece(piece.id, 'conversions', Number(e.target.value))} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Production Cost ($)</label>
                    <Input type="number" value={piece.productionCost || ''} onChange={(e) => updatePiece(piece.id, 'productionCost', Number(e.target.value))} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Revenue/Conversion ($)</label>
                    <Input type="number" value={piece.revenuePerConversion || ''} onChange={(e) => updatePiece(piece.id, 'revenuePerConversion', Number(e.target.value))} className="text-xs" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addPiece}>
                <Plus className="size-3.5" /> Add Content
              </Button>
              <Button onClick={calculate} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <DollarSign className="size-4" />}
                Calculate ROI
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {result.roi >= 0 ? <TrendingUp className="size-4 text-green-400" /> : <TrendingDown className="size-4 text-red-400" />}
                    <p className={`text-2xl font-bold ${result.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.roi > 0 ? '+' : ''}{result.roi}%
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Overall ROI</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">${result.totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">${result.totalCost.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Cost</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Performance Ranking</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download className="size-3.5" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.ranking.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${effColors[item.efficiency as keyof typeof effColors] ?? effColors.low}`}>
                          {item.efficiency}
                        </span>
                        <span className={`text-sm font-bold ${item.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.roi > 0 ? '+' : ''}{item.roi}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Investment Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <TrendingUp className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DensityResult {
  keyword: string;
  count: number;
  density: number;
  status: 'optimal' | 'low' | 'high';
}

export default function KeywordDensityChecker() {
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [results, setResults] = useState<DensityResult[]>([]);
  const [wordCount, setWordCount] = useState(0);

  const check = () => {
    if (!content.trim() || !keywords.trim()) {
      toast.error('Enter content and keywords');
      return;
    }

    const words = content.toLowerCase().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    const text = content.toLowerCase();

    const kwList = keywords.split('\n').map((k) => k.trim()).filter(Boolean);
    const densities: DensityResult[] = kwList.map((kw) => {
      const regex = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      const count = matches?.length ?? 0;
      const density = words.length > 0 ? (count / words.length) * 100 : 0;
      const rounded = Math.round(density * 100) / 100;

      let status: 'optimal' | 'low' | 'high' = 'optimal';
      if (rounded < 0.5) status = 'low';
      else if (rounded > 3) status = 'high';

      return { keyword: kw, count, density: rounded, status };
    });

    setResults(densities);
    toast.success('Density calculated');
  };

  const statusConfig = {
    optimal: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-950/30', label: 'Optimal (0.5-3%)' },
    low: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-950/30', label: 'Under-optimized (<0.5%)' },
    high: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-950/30', label: 'Over-optimized (>3%)' },
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hash className="size-6" />
            Keyword Density Checker
          </h1>
          <p className="text-muted-foreground">Check keyword density and optimization levels</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keywords (one per line)</label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="keyword1, keyword2 (or one per line in textarea)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Content</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px] resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your content here..."
              />
            </div>
            <Button onClick={check}>
              <Hash className="size-4" />
              Check Density
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{wordCount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Words</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Density Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.map((r) => {
                  const config = statusConfig[r.status];
                  const Icon = config.icon;
                  return (
                    <div key={r.keyword} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`size-3.5 ${config.color}`} />
                          <span className="text-sm font-medium">{r.keyword}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${config.color}`}>{r.density}%</span>
                          <span className="text-xs text-muted-foreground ml-2">({r.count}x)</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted/30">
                        <div
                          className={`h-full rounded-full ${
                            r.status === 'optimal' ? 'bg-green-500' :
                            r.status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(r.density * 20, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{config.label}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommended Density Ranges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• <span className="text-green-400">Optimal:</span> 0.5% - 3% — Natural keyword integration</p>
                  <p>• <span className="text-yellow-400">Under-optimized:</span> &lt;0.5% — Consider adding more keyword mentions</p>
                  <p>• <span className="text-red-400">Over-optimized:</span> &gt;3% — Risk of keyword stuffing penalty</p>
                  <p>• Primary keyword: aim for 1-2%</p>
                  <p>• Secondary keywords: aim for 0.5-1%</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

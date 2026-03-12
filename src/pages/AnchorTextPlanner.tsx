import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface AnchorSuggestion {
  text: string;
  type: 'exact_match' | 'branded' | 'generic' | 'naked_url' | 'partial_match';
  usage: string;
}

interface AnchorResult {
  targetPage: string;
  summary: string;
  distribution: { type: string; percentage: number; count: number }[];
  suggestions: AnchorSuggestion[];
}

const typeColors: Record<string, string> = {
  exact_match: 'text-blue-400 bg-blue-950/30',
  branded: 'text-purple-400 bg-purple-950/30',
  generic: 'text-green-400 bg-green-950/30',
  naked_url: 'text-orange-400 bg-orange-950/30',
  partial_match: 'text-yellow-400 bg-yellow-950/30',
};

export default function AnchorTextPlanner() {
  const [targetUrl, setTargetUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnchorResult | null>(null);

  const plan = async () => {
    if (!targetUrl.trim()) { toast.error('Enter target page URL'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a link building and anchor text expert. Return JSON only.' },
          { role: 'user', content: `Plan anchor text profile for:\nTarget page: ${targetUrl}\nPrimary keyword: ${keyword || 'auto-detect'}\nBrand name: ${brand || 'auto-detect'}\n\nReturn JSON:\n{\n  "targetPage": "${targetUrl}",\n  "summary": "anchor text strategy overview",\n  "distribution": [\n    { "type": "Exact Match", "percentage": number, "count": number },\n    { "type": "Branded", "percentage": number, "count": number },\n    { "type": "Generic", "percentage": number, "count": number },\n    { "type": "Naked URL", "percentage": number, "count": number },\n    { "type": "Partial Match", "percentage": number, "count": number }\n  ],\n  "suggestions": [\n    { "text": "anchor text", "type": "exact_match"|"branded"|"generic"|"naked_url"|"partial_match", "usage": "context for using this anchor" }\n  ]\n}\n\nGenerate 15-20 diverse anchor text suggestions with a natural distribution.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Anchor text plan generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
    } finally {
      setLoading(false);
    }
  };

  const exportList = () => {
    if (!result) return;
    const lines = ['Anchor Text,Type,Usage Context'];
    result.suggestions.forEach((s) => {
      lines.push(`"${s.text}","${s.type}","${s.usage}"`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Anchor text list copied as CSV');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Anchor Text Planner
          </h1>
          <p className="text-muted-foreground">Plan diverse anchor text profiles for natural link building</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="Target page URL" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Primary keyword (optional)" />
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name (optional)" />
            </div>
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Plan Anchors
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommended Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.distribution.map((d, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{d.type}</span>
                        <span className="text-muted-foreground">{d.count} anchors ({d.percentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${d.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Anchor Text Suggestions ({result.suggestions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.suggestions.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${typeColors[s.type] ?? 'bg-muted/30'}`}>
                        {s.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium">{s.text}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[200px]">{s.usage}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportList} className="gap-1.5">
              <Copy className="size-3.5" /> Export Anchor List
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

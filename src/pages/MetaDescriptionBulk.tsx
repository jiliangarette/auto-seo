import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tags, Loader2, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface MetaDescription {
  title: string;
  url: string;
  description: string;
  charCount: number;
  status: 'optimal' | 'too-short' | 'too-long';
}

interface BulkResult {
  descriptions: MetaDescription[];
  summary: string;
}

const statusColors = {
  optimal: 'text-green-400 bg-green-950/30',
  'too-short': 'text-yellow-400 bg-yellow-950/30',
  'too-long': 'text-red-400 bg-red-950/30',
};

export default function MetaDescriptionBulk() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const generate = async () => {
    if (!input.trim()) { toast.error('Enter page titles and URLs'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO copywriter. Return JSON only.' },
          { role: 'user', content: `Generate unique meta descriptions for these pages:\n${input}\n\nReturn JSON:\n{\n  "descriptions": [\n    { "title": "page title", "url": "page url", "description": "meta description (aim for 150-160 chars)", "charCount": number, "status": "optimal"|"too-short"|"too-long" }\n  ],\n  "summary": "overview"\n}\n\nEach description should be unique, include a call-to-action, and be between 150-160 characters. Mark as optimal (150-160), too-short (<150), or too-long (>160).` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Meta descriptions generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyCsv = () => {
    if (!result) return;
    const lines = ['URL,Title,Meta Description,Characters,Status'];
    result.descriptions.forEach((d) => {
      lines.push(`"${d.url}","${d.title}","${d.description}",${d.charCount},${d.status}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('CSV copied');
  };

  const copyHtml = () => {
    if (!result) return;
    const snippets = result.descriptions.map((d) =>
      `<!-- ${d.title} -->\n<meta name="description" content="${d.description.replace(/"/g, '&quot;')}" />`
    );
    navigator.clipboard.writeText(snippets.join('\n\n'));
    toast.success('HTML snippets copied');
  };

  const optimalCount = result?.descriptions.filter((d) => d.status === 'optimal').length ?? 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="size-6" />
            Meta Description Bulk Generator
          </h1>
          <p className="text-muted-foreground">Generate unique meta descriptions in bulk with character validation</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter page titles and URLs (one per line):&#10;Home Page - https://example.com/&#10;About Us - https://example.com/about&#10;Services - https://example.com/services"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
              Generate Descriptions
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.descriptions.length}</p>
                  <p className="text-[10px] text-muted-foreground">Descriptions Generated</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{optimalCount}</p>
                  <p className="text-[10px] text-muted-foreground">Optimal Length</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{result.descriptions.length - optimalCount}</p>
                  <p className="text-[10px] text-muted-foreground">Need Adjustment</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Generated Descriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.descriptions.map((d, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {d.status === 'optimal' ? (
                            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="size-3.5 text-yellow-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{d.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{d.charCount} chars</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${statusColors[d.status]}`}>{d.status}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-5">{d.url}</p>
                      <p className="text-xs ml-5 bg-muted/10 rounded p-2 border border-border/20">{d.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyCsv} className="gap-1.5">
                <Copy className="size-3.5" /> Copy as CSV
              </Button>
              <Button variant="outline" onClick={copyHtml} className="gap-1.5">
                <Copy className="size-3.5" /> Copy as HTML
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

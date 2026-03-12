import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LayoutGrid, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface HreflangTag {
  url: string;
  hreflang: string;
  language: string;
  region: string;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

interface HreflangResult {
  summary: string;
  tags: HreflangTag[];
  htmlOutput: string;
  xmlOutput: string;
  validationIssues: ValidationIssue[];
}

export default function HreflangTagGenerator() {
  const [pages, setPages] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HreflangResult | null>(null);
  const [outputFormat, setOutputFormat] = useState<'html' | 'xml'>('html');

  const generate = async () => {
    if (!pages.trim()) { toast.error('Enter page URLs with language targets'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an international SEO and hreflang expert. Return JSON only.' },
          { role: 'user', content: `Generate hreflang tags for these pages:\n${pages}\n\nReturn JSON:\n{\n  "summary": "hreflang implementation overview",\n  "tags": [\n    { "url": "https://example.com/en/page", "hreflang": "en-us", "language": "English", "region": "United States" }\n  ],\n  "htmlOutput": "complete HTML <link> tags for <head>",\n  "xmlOutput": "complete XML sitemap hreflang entries",\n  "validationIssues": [\n    { "type": "error"|"warning", "message": "issue description" }\n  ]\n}\n\nGenerate correct bidirectional hreflang references including x-default. Validate all references are bidirectional.` },
        ],
        temperature: 0.4,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Hreflang tags generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (!result) return;
    navigator.clipboard.writeText(outputFormat === 'html' ? result.htmlOutput : result.xmlOutput);
    toast.success(`${outputFormat.toUpperCase()} output copied`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="size-6" />
            Hreflang Tag Generator
          </h1>
          <p className="text-muted-foreground">Generate and validate hreflang tags for international SEO</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="Enter page URLs with language/region (one per line)&#10;https://example.com/en/about - English US&#10;https://example.com/es/about - Spanish Spain&#10;https://example.com/fr/about - French France&#10;https://example.com/de/about - German Germany"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LayoutGrid className="size-4" />}
              Generate Tags
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

            {result.validationIssues.length > 0 && (
              <Card className="border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Validation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {result.validationIssues.map((issue, idx) => (
                      <div key={idx} className={`text-xs rounded-md border p-2 ${issue.type === 'error' ? 'border-red-500/20 text-red-400' : 'border-yellow-500/20 text-yellow-400'}`}>
                        <span className="font-bold uppercase text-[9px] mr-2">[{issue.type}]</span>
                        {issue.message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hreflang References ({result.tags.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2 text-xs">
                      <span className="font-mono font-bold text-primary w-12">{tag.hreflang}</span>
                      <span className="text-muted-foreground">{tag.language} ({tag.region})</span>
                      <span className="font-mono text-muted-foreground truncate ml-auto max-w-[250px]">{tag.url}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Output</CardTitle>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOutputFormat('html')} className={`text-[9px] px-1.5 py-0.5 rounded border ${outputFormat === 'html' ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground'}`}>HTML</button>
                    <button onClick={() => setOutputFormat('xml')} className={`text-[9px] px-1.5 py-0.5 rounded border ${outputFormat === 'xml' ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground'}`}>XML Sitemap</button>
                    <Button variant="ghost" size="sm" onClick={copyOutput} className="gap-1 h-6 text-xs">
                      <Copy className="size-3" /> Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md border border-border/50 p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {outputFormat === 'html' ? result.htmlOutput : result.xmlOutput}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

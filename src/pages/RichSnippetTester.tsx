import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Code2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  fix: string;
}

interface SnippetPreview {
  title: string;
  url: string;
  description: string;
  richFeatures: string[];
}

interface SnippetResult {
  summary: string;
  markupType: string;
  schemaTypes: string[];
  valid: boolean;
  issues: ValidationIssue[];
  preview: SnippetPreview;
  fixedMarkup: string;
}

const severityColors: Record<string, string> = {
  error: 'text-red-400 bg-red-950/30 border-red-500/20',
  warning: 'text-yellow-400 bg-yellow-950/30 border-yellow-500/20',
  info: 'text-blue-400 bg-blue-950/30 border-blue-500/20',
};

export default function RichSnippetTester() {
  const [markup, setMarkup] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnippetResult | null>(null);

  const validate = async () => {
    if (!markup.trim()) { toast.error('Paste structured data markup'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a structured data and rich snippet expert. Return JSON only.' },
          { role: 'user', content: `Validate this structured data markup and preview rich snippets:\n\n${markup.slice(0, 4000)}\n\nReturn JSON:\n{\n  "summary": "validation overview",\n  "markupType": "JSON-LD"|"Microdata"|"RDFa",\n  "schemaTypes": ["Article", "FAQ", etc],\n  "valid": boolean,\n  "issues": [\n    { "severity": "error"|"warning"|"info", "field": "field name", "message": "issue description", "fix": "how to fix" }\n  ],\n  "preview": {\n    "title": "how title appears in Google",\n    "url": "displayed URL",\n    "description": "meta description text",\n    "richFeatures": ["FAQ dropdown", "Star rating", etc]\n  },\n  "fixedMarkup": "corrected version of the markup"\n}\n\nIf the input doesn't look like structured data, generate sample JSON-LD for the detected content type and validate that instead.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Markup validated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyFixed = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fixedMarkup);
    toast.success('Fixed markup copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="size-6" />
            Rich Snippet Tester
          </h1>
          <p className="text-muted-foreground">Validate structured data and preview Google rich snippets</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              placeholder='Paste your JSON-LD, Microdata, or RDFa markup here...&#10;&#10;Example:&#10;<script type="application/ld+json">&#10;{&#10;  "@context": "https://schema.org",&#10;  "@type": "Article",&#10;  "headline": "Your Article Title"&#10;}&#10;</script>'
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y font-mono text-xs"
            />
            <Button onClick={validate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Code2 className="size-4" />}
              Validate Markup
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className={result.valid ? 'border-green-500/20' : 'border-red-500/20'}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">{result.valid ? 'Valid Markup' : 'Issues Found'}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{result.markupType}</p>
                    <p className="text-[10px] text-muted-foreground">{result.schemaTypes.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Google Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border/50 p-4 bg-white/5">
                  <p className="text-xs text-green-400 truncate">{result.preview.url}</p>
                  <p className="text-sm font-medium text-blue-400 mt-0.5">{result.preview.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{result.preview.description}</p>
                  {result.preview.richFeatures.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {result.preview.richFeatures.map((f, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {result.issues.length > 0 && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Validation Issues ({result.issues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.issues.map((issue, idx) => (
                      <div key={idx} className={`rounded-md border p-2.5 ${severityColors[issue.severity] ?? ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold uppercase">{issue.severity}</span>
                          <span className="text-xs font-medium">{issue.field}</span>
                        </div>
                        <p className="text-xs">{issue.message}</p>
                        <p className="text-[10px] text-green-400/70 mt-1">Fix: {issue.fix}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Fixed Markup</CardTitle>
                  <Button variant="ghost" size="sm" onClick={copyFixed} className="gap-1 h-6 text-xs">
                    <Copy className="size-3" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md border border-border/50 p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {result.fixedMarkup}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

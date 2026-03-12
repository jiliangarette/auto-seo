import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Code2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface ValidationResult {
  valid: boolean;
  schemaType: string;
  completeness: number;
  richResultsEligible: boolean;
  issues: ValidationIssue[];
  fixedJsonLd: string;
}

const severityConfig = {
  error: { color: 'text-red-400', bg: 'bg-red-950/30', icon: XCircle },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-950/30', icon: AlertTriangle },
  info: { color: 'text-blue-400', bg: 'bg-blue-950/30', icon: CheckCircle2 },
};

const sampleJsonLd = `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Improve Your SEO",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  },
  "datePublished": "2025-01-15"
}`;

export default function StructuredDataValidator() {
  const [input, setInput] = useState(sampleJsonLd);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = async () => {
    if (!input.trim()) {
      toast.error('Paste JSON-LD to validate');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a structured data validation expert. Return JSON only.' },
          { role: 'user', content: `Validate this JSON-LD structured data:

${input}

Check for:
1. Valid JSON-LD syntax
2. Required properties for the schema type
3. Google Rich Results eligibility
4. Missing recommended properties

Return JSON:
{
  "valid": boolean,
  "schemaType": "detected type",
  "completeness": number(0-100),
  "richResultsEligible": boolean,
  "issues": [
    { "field": "fieldName", "severity": "error"|"warning"|"info", "message": "description" }
  ],
  "fixedJsonLd": "corrected and complete JSON-LD string with all recommended properties added"
}` },
        ],
        temperature: 0.3,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Validation complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyFixed = () => {
    if (!result?.fixedJsonLd) return;
    navigator.clipboard.writeText(result.fixedJsonLd);
    toast.success('Fixed JSON-LD copied');
  };

  const errors = result?.issues.filter((i) => i.severity === 'error').length ?? 0;
  const warnings = result?.issues.filter((i) => i.severity === 'warning').length ?? 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="size-6" />
            Structured Data Validator
          </h1>
          <p className="text-muted-foreground">Validate JSON-LD and check Rich Results eligibility</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Paste JSON-LD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[200px] resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"@context": "https://schema.org", ...}'
            />
            <Button onClick={validate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Validate
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  {result.valid ? (
                    <CheckCircle2 className="size-5 mx-auto mb-1 text-green-400" />
                  ) : (
                    <XCircle className="size-5 mx-auto mb-1 text-red-400" />
                  )}
                  <p className={`text-sm font-bold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.valid ? 'Valid' : 'Invalid'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Syntax</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.schemaType}</p>
                  <p className="text-[10px] text-muted-foreground">Schema Type</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.completeness >= 80 ? 'text-green-400' : result.completeness >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.completeness}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Completeness</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  {result.richResultsEligible ? (
                    <Sparkles className="size-5 mx-auto mb-1 text-green-400" />
                  ) : (
                    <XCircle className="size-5 mx-auto mb-1 text-red-400" />
                  )}
                  <p className={`text-sm font-bold ${result.richResultsEligible ? 'text-green-400' : 'text-red-400'}`}>
                    {result.richResultsEligible ? 'Eligible' : 'Not Eligible'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Rich Results</p>
                </CardContent>
              </Card>
            </div>

            {result.issues.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Issues
                    {errors > 0 && <span className="text-[9px] bg-red-950/30 text-red-400 px-1.5 py-0.5 rounded">{errors} errors</span>}
                    {warnings > 0 && <span className="text-[9px] bg-yellow-950/30 text-yellow-400 px-1.5 py-0.5 rounded">{warnings} warnings</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.issues.map((issue, idx) => {
                      const config = severityConfig[issue.severity];
                      const Icon = config.icon;
                      return (
                        <div key={idx} className={`flex items-start gap-2 rounded-md p-2 ${config.bg}`}>
                          <Icon className={`size-3.5 mt-0.5 shrink-0 ${config.color}`} />
                          <div>
                            <span className={`text-xs font-medium ${config.color}`}>{issue.field}</span>
                            <p className="text-xs text-muted-foreground">{issue.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.fixedJsonLd && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Fixed JSON-LD</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyFixed}>
                      <Copy className="size-3.5" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-md bg-muted/30 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {result.fixedJsonLd}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

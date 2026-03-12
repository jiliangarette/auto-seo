import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tags, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CanonicalIssue {
  url: string;
  canonical: string;
  status: 'correct' | 'missing' | 'self-referencing' | 'cross-domain' | 'conflicting' | 'mismatch';
  recommendation: string;
}

interface CanonicalResult {
  totalChecked: number;
  issueCount: number;
  issues: CanonicalIssue[];
  recommendations: string[];
  summary: string;
}

const statusColors: Record<string, string> = {
  correct: 'text-green-400 bg-green-950/30',
  missing: 'text-red-400 bg-red-950/30',
  'self-referencing': 'text-blue-400 bg-blue-950/30',
  'cross-domain': 'text-purple-400 bg-purple-950/30',
  conflicting: 'text-red-400 bg-red-950/30',
  mismatch: 'text-yellow-400 bg-yellow-950/30',
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  correct: CheckCircle2,
  missing: XCircle,
  'self-referencing': AlertTriangle,
  'cross-domain': AlertTriangle,
  conflicting: XCircle,
  mismatch: AlertTriangle,
};

export default function CanonicalTagChecker() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CanonicalResult | null>(null);

  const check = async () => {
    if (!urls.trim()) { toast.error('Enter URLs to check'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a technical SEO expert. Return JSON only.' },
          { role: 'user', content: `Check canonical tags for these URLs:\n${urls}\n\nReturn JSON:\n{\n  "totalChecked": number,\n  "issueCount": number,\n  "issues": [\n    { "url": "page url", "canonical": "canonical value or 'none'", "status": "correct"|"missing"|"self-referencing"|"cross-domain"|"conflicting"|"mismatch", "recommendation": "what to do" }\n  ],\n  "recommendations": ["general tip 1", "tip 2"],\n  "summary": "overview"\n}\n\nGenerate 8-10 URL checks with a realistic mix of statuses. Include 3-4 correct, and various issue types.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Canonical check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="size-6" />
            Canonical Tag Checker
          </h1>
          <p className="text-muted-foreground">Detect missing, conflicting, and cross-domain canonical tags</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter URLs to check (one per line)&#10;https://example.com/page-1&#10;https://example.com/page-2"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
            />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
              Check Canonicals
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalChecked}</p>
                  <p className="text-[10px] text-muted-foreground">URLs Checked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.issueCount}</p>
                  <p className="text-[10px] text-muted-foreground">Issues Found</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.totalChecked - result.issueCount}</p>
                  <p className="text-[10px] text-muted-foreground">Correct</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Canonical Tag Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.issues.map((issue, idx) => {
                    const Icon = statusIcons[issue.status] ?? AlertTriangle;
                    return (
                      <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Icon className={`size-3.5 shrink-0 ${issue.status === 'correct' ? 'text-green-400' : 'text-yellow-400'}`} />
                            <span className="text-sm font-medium truncate">{issue.url}</span>
                          </div>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${statusColors[issue.status]}`}>{issue.status}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-5">Canonical: {issue.canonical}</p>
                        {issue.status !== 'correct' && (
                          <p className="text-[10px] text-yellow-400/80 ml-5">{issue.recommendation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
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

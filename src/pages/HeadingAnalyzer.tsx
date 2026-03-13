import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heading,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface HeadingItem {
  level: number;
  text: string;
  issue: string | null;
}

interface HeadingResult {
  valid: boolean;
  score: number;
  headings: HeadingItem[];
  issues: string[];
  suggestedStructure: string;
}

const levelColors: Record<number, string> = {
  1: 'text-blue-400 bg-blue-950/30',
  2: 'text-green-400 bg-green-950/30',
  3: 'text-yellow-400 bg-yellow-950/30',
  4: 'text-orange-400 bg-orange-950/30',
  5: 'text-purple-400 bg-purple-950/30',
  6: 'text-pink-400 bg-pink-950/30',
};

export default function HeadingAnalyzer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HeadingResult | null>(null);

  const analyze = async () => {
    if (!content.trim()) {
      toast.error('Paste HTML or content with headings');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an HTML heading structure analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze the heading structure of this content/HTML:

${content.substring(0, 3000)}

Extract all headings (H1-H6), validate hierarchy, and check for:
1. Missing H1
2. Multiple H1s
3. Skipped heading levels (e.g., H1 → H3)
4. Empty headings
5. Too many or too few headings

Return JSON:
{
  "valid": boolean,
  "score": number(0-100),
  "headings": [
    { "level": 1, "text": "heading text", "issue": null | "issue description" }
  ],
  "issues": ["global issue 1", "global issue 2"],
  "suggestedStructure": "H1: Title\\n  H2: Section 1\\n    H3: Subsection\\n  H2: Section 2"
}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const copySuggested = () => {
    if (!result?.suggestedStructure) return;
    navigator.clipboard.writeText(result.suggestedStructure);
    toast.success('Structure copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heading className="size-6" />
            Heading Structure Analyzer
          </h1>
          <p className="text-muted-foreground">Validate H1-H6 hierarchy and detect structural issues</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Page Content or HTML</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[200px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'<h1>Main Title</h1>\n<h2>Section 1</h2>\n<h3>Subsection 1.1</h3>\n<h2>Section 2</h2>\n...'}
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Heading className="size-4" />}
              Analyze Headings
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  {result.valid ? (
                    <CheckCircle2 className="size-5 mx-auto mb-1 text-green-400" />
                  ) : (
                    <XCircle className="size-5 mx-auto mb-1 text-red-400" />
                  )}
                  <p className={`text-sm font-bold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.valid ? 'Valid' : 'Issues Found'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Hierarchy</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.score >= 80 ? 'text-green-400' : result.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.score}/100
                  </p>
                  <p className="text-[10px] text-muted-foreground">Structure Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.headings.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total Headings</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Heading Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.headings.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2" style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${levelColors[h.level] || 'text-muted-foreground bg-muted/30'}`}>
                        H{h.level}
                      </span>
                      <span className="text-sm">{h.text}</span>
                      {h.issue && (
                        <span className="text-[9px] text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <AlertTriangle className="size-2.5" />
                          {h.issue}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {result.issues.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {result.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="size-3 text-yellow-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{issue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Suggested Structure</CardTitle>
                  <Button variant="outline" size="sm" onClick={copySuggested}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap">
                  {result.suggestedStructure}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

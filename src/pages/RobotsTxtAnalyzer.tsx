import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bot,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface RobotsIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
}

interface RobotsResult {
  valid: boolean;
  issueCount: number;
  crawlBudgetScore: number;
  issues: RobotsIssue[];
  optimizedRobotsTxt: string;
  suggestions: string[];
}

const sevConfig = {
  error: { color: 'text-red-400', bg: 'bg-red-950/30' },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-950/30' },
  info: { color: 'text-blue-400', bg: 'bg-blue-950/30' },
};

const sampleRobots = `User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /search
Allow: /blog/
Sitemap: https://example.com/sitemap.xml`;

export default function RobotsTxtAnalyzer() {
  const [input, setInput] = useState(sampleRobots);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RobotsResult | null>(null);

  const analyze = async () => {
    if (!input.trim()) {
      toast.error('Paste your robots.txt content');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a robots.txt and crawl optimization expert. Return JSON only.' },
          { role: 'user', content: `Analyze this robots.txt:

${input}

Check for:
1. Syntax errors
2. Important pages being blocked
3. Crawl budget waste
4. Missing sitemaps
5. Overly restrictive or permissive rules

Return JSON:
{
  "valid": boolean,
  "issueCount": number,
  "crawlBudgetScore": number(0-100),
  "issues": [
    { "severity": "error"|"warning"|"info", "rule": "the problematic rule", "message": "explanation" }
  ],
  "optimizedRobotsTxt": "complete optimized robots.txt content",
  "suggestions": ["suggestion1", "suggestion2"]
}` },
        ],
        temperature: 0.3,
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

  const copyOptimized = () => {
    if (!result?.optimizedRobotsTxt) return;
    navigator.clipboard.writeText(result.optimizedRobotsTxt);
    toast.success('Optimized robots.txt copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="size-6" />
            Robots.txt Analyzer
          </h1>
          <p className="text-muted-foreground">Analyze and optimize your robots.txt for better crawling</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Robots.txt Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[180px] resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your robots.txt content..."
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Analyze
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
                    <AlertTriangle className="size-5 mx-auto mb-1 text-red-400" />
                  )}
                  <p className={`text-sm font-bold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.valid ? 'Valid' : 'Has Errors'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Syntax</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.issueCount}</p>
                  <p className="text-[10px] text-muted-foreground">Issues Found</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.crawlBudgetScore >= 70 ? 'text-green-400' : result.crawlBudgetScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.crawlBudgetScore}/100
                  </p>
                  <p className="text-[10px] text-muted-foreground">Crawl Budget Score</p>
                </CardContent>
              </Card>
            </div>

            {result.issues.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {result.issues.map((issue, idx) => {
                    const config = sevConfig[issue.severity];
                    return (
                      <div key={idx} className={`rounded-md p-2.5 ${config.bg}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {issue.severity}
                          </span>
                          <code className="text-xs font-mono text-foreground">{issue.rule}</code>
                        </div>
                        <p className="text-xs text-muted-foreground">{issue.message}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Optimized Robots.txt</CardTitle>
                  <Button variant="outline" size="sm" onClick={copyOptimized}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap">
                  {result.optimizedRobotsTxt}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{s}</span>
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

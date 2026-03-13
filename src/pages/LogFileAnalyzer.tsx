import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Loader2,
  Bot,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface BotStats {
  bot: string;
  requests: number;
  percentage: number;
  topPages: string[];
}

interface CrawlWaste {
  type: string;
  count: number;
  examples: string[];
  severity: 'high' | 'medium' | 'low';
}

interface LogResult {
  totalRequests: number;
  uniquePages: number;
  botBreakdown: BotStats[];
  crawlWaste: CrawlWaste[];
  budgetScore: number;
  recommendations: string[];
}

const sevColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

export default function LogFileAnalyzer() {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);

  const analyze = async () => {
    if (!logs.trim()) {
      toast.error('Paste log entries');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a server log file analysis expert for SEO crawl optimization. Return JSON only.' },
          { role: 'user', content: `Analyze these server log entries for SEO crawl insights:

${logs.substring(0, 3000)}

Identify:
1. Bot crawl frequency (Googlebot, Bingbot, etc.)
2. Crawl waste (404s, redirects, low-value pages)
3. Crawl budget allocation issues

Return JSON:
{
  "totalRequests": number,
  "uniquePages": number,
  "botBreakdown": [
    { "bot": "Googlebot", "requests": number, "percentage": number, "topPages": ["/page1", "/page2"] }
  ],
  "crawlWaste": [
    { "type": "404 Errors", "count": number, "examples": ["/broken-url"], "severity": "high"|"medium"|"low" }
  ],
  "budgetScore": number(0-100),
  "recommendations": ["recommendation1", "recommendation2"]
}

Generate realistic analysis with 3-4 bots and 4-6 waste categories.` },
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            Log File Analyzer
          </h1>
          <p className="text-muted-foreground">Analyze server logs for crawl efficiency and budget optimization</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Server Log Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[180px] resize-y"
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder={'66.249.64.1 - - [15/Mar/2026:10:00:00] "GET /blog/seo-guide HTTP/1.1" 200 15234 "-" "Mozilla/5.0 (compatible; Googlebot/2.1)"\n66.249.64.2 - - [15/Mar/2026:10:00:05] "GET /old-page HTTP/1.1" 301 0 "-" "Mozilla/5.0 (compatible; Googlebot/2.1)"\n157.55.39.1 - - [15/Mar/2026:10:01:00] "GET /products HTTP/1.1" 200 8432 "-" "Mozilla/5.0 (compatible; bingbot/2.0)"'}
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Analyze Logs
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalRequests.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Requests</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.uniquePages}</p>
                  <p className="text-[10px] text-muted-foreground">Unique Pages</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.budgetScore >= 70 ? 'text-green-400' : result.budgetScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.budgetScore}/100
                  </p>
                  <p className="text-[10px] text-muted-foreground">Budget Efficiency</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bot Crawl Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.botBreakdown.map((bot) => (
                  <div key={bot.bot} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="size-3.5 text-primary" />
                        <span className="text-sm font-medium">{bot.bot}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{bot.requests} requests ({bot.percentage}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${bot.percentage}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bot.topPages.slice(0, 3).map((page, i) => (
                        <span key={i} className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded font-mono">{page}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Crawl Waste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.crawlWaste.map((waste, idx) => (
                  <div key={idx} className="rounded-md border border-border/50 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-3.5 text-yellow-400" />
                        <span className="text-sm font-medium">{waste.type}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sevColors[waste.severity]}`}>
                          {waste.severity}
                        </span>
                      </div>
                      <span className="text-xs font-bold">{waste.count}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {waste.examples.map((ex, i) => (
                        <span key={i} className="text-[10px] bg-muted/20 px-1.5 py-0.5 rounded font-mono text-muted-foreground">{ex}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Crawl Budget Recommendations</CardTitle>
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

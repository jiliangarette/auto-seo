import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart, Loader2, Copy, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuditFinding {
  category: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  impact: string;
  fix: string;
}

interface AuditReport {
  url: string;
  overallScore: number;
  executiveSummary: string;
  priorityActions: string[];
  findings: AuditFinding[];
  categoryScores: { category: string; score: number }[];
}

const categories = ['Technical SEO', 'On-Page SEO', 'Content Quality', 'Link Profile', 'Mobile & UX', 'Page Speed'];

const sevColors = {
  critical: 'text-red-400 bg-red-950/30',
  warning: 'text-yellow-400 bg-yellow-950/30',
  info: 'text-blue-400 bg-blue-950/30',
};

const sevIcons = {
  critical: XCircle,
  warning: AlertTriangle,
  info: CheckCircle2,
};

export default function SeoAuditReportBuilder() {
  const [url, setUrl] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(categories));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditReport | null>(null);

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const generate = async () => {
    if (!url.trim()) { toast.error('Enter a URL'); return; }
    if (selectedCats.size === 0) { toast.error('Select at least one category'); return; }
    setLoading(true);
    try {
      const cats = [...selectedCats].join(', ');
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a senior SEO auditor. Return JSON only.' },
          { role: 'user', content: `Generate a comprehensive SEO audit report for: ${url}\nCategories to audit: ${cats}\n\nReturn JSON:\n{\n  "url": "${url}",\n  "overallScore": number(0-100),\n  "executiveSummary": "2-3 sentence summary",\n  "priorityActions": ["action 1", "action 2", ...],\n  "findings": [\n    { "category": "Technical SEO", "issue": "description", "severity": "critical"|"warning"|"info", "impact": "business impact", "fix": "how to fix" }\n  ],\n  "categoryScores": [\n    { "category": "Technical SEO", "score": number(0-100) }\n  ]\n}\n\nGenerate 4-5 priority actions, 12-15 findings across selected categories, and scores for each category.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Audit report generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportHtml = () => {
    if (!result) return;
    const html = `<!DOCTYPE html><html><head><title>SEO Audit — ${result.url}</title><style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;color:#e0e0e0;background:#1a1a2e}h1,h2,h3{color:#fff}.score{font-size:48px;font-weight:bold}.critical{color:#f87171}.warning{color:#fbbf24}.info{color:#60a5fa}.card{border:1px solid #333;border-radius:8px;padding:16px;margin:12px 0;background:#16213e}</style></head><body><h1>SEO Audit Report</h1><p>URL: ${result.url}</p><div class="card"><p class="score" style="color:${result.overallScore >= 80 ? '#4ade80' : result.overallScore >= 50 ? '#fbbf24' : '#f87171'}">${result.overallScore}/100</p><p>${result.executiveSummary}</p></div><h2>Priority Actions</h2><ul>${result.priorityActions.map((a) => `<li>${a}</li>`).join('')}</ul><h2>Findings</h2>${result.findings.map((f) => `<div class="card"><strong class="${f.severity}">[${f.severity.toUpperCase()}]</strong> <strong>${f.category}</strong><p>${f.issue}</p><p><em>Impact:</em> ${f.impact}</p><p><em>Fix:</em> ${f.fix}</p></div>`).join('')}</body></html>`;
    navigator.clipboard.writeText(html);
    toast.success('HTML report copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="size-6" />
            SEO Audit Report Builder
          </h1>
          <p className="text-muted-foreground">Generate comprehensive audit reports with priority actions</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to audit (e.g., https://example.com)" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Select audit categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${selectedCats.has(cat) ? 'bg-primary/20 text-primary font-medium' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
              Generate Audit Report
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-3xl font-bold ${result.overallScore >= 80 ? 'text-green-400' : result.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.overallScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{result.executiveSummary}</p>
              </CardContent>
            </Card>

            <div className="grid gap-3 md:grid-cols-3">
              {result.categoryScores.map((cs, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">{cs.category}</span>
                      <span className={`text-sm font-bold ${cs.score >= 80 ? 'text-green-400' : cs.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{cs.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30">
                      <div className={`h-full rounded-full ${cs.score >= 80 ? 'bg-green-500' : cs.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${cs.score}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Priority Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.priorityActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Findings ({result.findings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.findings.map((finding, idx) => {
                    const Icon = sevIcons[finding.severity];
                    return (
                      <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Icon className={`size-3.5 shrink-0 ${finding.severity === 'critical' ? 'text-red-400' : finding.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`} />
                            <span className="text-sm font-medium">{finding.issue}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{finding.category}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sevColors[finding.severity]}`}>{finding.severity}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-5">{finding.impact}</p>
                        <p className="text-[10px] text-green-400/80 ml-5">{finding.fix}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportHtml} className="gap-1.5">
              <Copy className="size-3.5" /> Export as HTML Report
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

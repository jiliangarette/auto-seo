import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Loader2, CheckCircle2, Circle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  task: string;
  category: string;
  priority: 'critical' | 'important' | 'nice-to-have';
}

interface ChecklistResult {
  pageType: string;
  items: ChecklistItem[];
  summary: string;
}

const prioColors = {
  critical: 'text-red-400 bg-red-950/30',
  important: 'text-yellow-400 bg-yellow-950/30',
  'nice-to-have': 'text-blue-400 bg-blue-950/30',
};

const pageTypes = ['Blog Post', 'Product Page', 'Landing Page', 'Homepage', 'Category Page', 'Service Page'];

export default function SeoChecklistGenerator() {
  const [pageType, setPageType] = useState('Blog Post');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChecklistResult | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const generate = async () => {
    setLoading(true);
    setChecked(new Set());
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO expert. Return JSON only.' },
          { role: 'user', content: `Generate a comprehensive SEO checklist for a "${pageType}" page.\n\nReturn JSON:\n{\n  "pageType": "${pageType}",\n  "items": [\n    { "task": "Add unique meta title under 60 chars", "category": "On-Page", "priority": "critical"|"important"|"nice-to-have" }\n  ],\n  "summary": "checklist overview"\n}\n\nGenerate 18-22 checklist items across categories: On-Page, Technical, Content, Links, UX. Mix priorities realistically.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Checklist generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const completionPct = result ? Math.round((checked.size / result.items.length) * 100) : 0;

  const exportMarkdown = () => {
    if (!result) return;
    const lines = [`# SEO Checklist — ${result.pageType}\n`];
    const categories = [...new Set(result.items.map((i) => i.category))];
    for (const cat of categories) {
      lines.push(`\n## ${cat}\n`);
      result.items.forEach((item, idx) => {
        if (item.category === cat) {
          lines.push(`- [${checked.has(idx) ? 'x' : ' '}] ${item.task} (${item.priority})`);
        }
      });
    }
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Checklist copied as markdown');
  };

  const categories = result ? [...new Set(result.items.map((i) => i.category))] : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-6" />
            SEO Checklist Generator
          </h1>
          <p className="text-muted-foreground">Generate customized SEO checklists by page type</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {pageTypes.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setPageType(pt)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${pageType === pt ? 'bg-primary/20 text-primary font-medium' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                >
                  {pt}
                </button>
              ))}
            </div>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardList className="size-4" />}
              Generate Checklist
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{result.pageType} Checklist</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{result.summary}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${completionPct === 100 ? 'text-green-400' : completionPct >= 50 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                      {completionPct}%
                    </p>
                    <p className="text-[9px] text-muted-foreground">{checked.size}/{result.items.length}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted/30 mt-2">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
                </div>
              </CardContent>
            </Card>

            {categories.map((cat) => (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {result.items.map((item, idx) => {
                      if (item.category !== cat) return null;
                      const done = checked.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleCheck(idx)}
                          className="w-full flex items-center gap-2.5 rounded-md p-2 hover:bg-muted/20 transition-colors text-left"
                        >
                          {done ? (
                            <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={`text-sm flex-1 ${done ? 'line-through text-muted-foreground' : ''}`}>{item.task}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${prioColors[item.priority]}`}>{item.priority}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={exportMarkdown} className="gap-1.5">
              <Copy className="size-3.5" /> Export as Markdown
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

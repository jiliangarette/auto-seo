import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarClock,
  Loader2,
  Sparkles,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentEntry {
  title: string;
  lastUpdated: string;
  topic: string;
}

interface FreshnessItem {
  title: string;
  freshnessScore: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  suggestedUpdateDate: string;
  updateReason: string;
}

interface SeasonalSuggestion {
  month: string;
  topics: string[];
}

interface FreshnessResult {
  items: FreshnessItem[];
  seasonalCalendar: SeasonalSuggestion[];
  summary: string;
}

const priorityColors = {
  urgent: 'text-red-400 bg-red-950/30',
  high: 'text-orange-400 bg-orange-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-green-400 bg-green-950/30',
};

export default function ContentFreshnessPlanner() {
  const [entries, setEntries] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreshnessResult | null>(null);

  const plan = async () => {
    if (!entries.trim()) {
      toast.error('Enter your content inventory');
      return;
    }
    setLoading(true);
    try {
      const parsed: ContentEntry[] = entries.split('\n').filter(Boolean).map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return { title: parts[0] || line, lastUpdated: parts[1] || 'unknown', topic: parts[2] || '' };
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content freshness and editorial calendar expert. Return JSON only.' },
          { role: 'user', content: `Create a content freshness plan:

Content inventory:
${JSON.stringify(parsed, null, 2)}

Niche/Industry: ${niche || 'General'}

For each piece, calculate freshness score and prioritize updates.
Also suggest seasonal content opportunities.

Return JSON:
{
  "items": [
    { "title": "content title", "freshnessScore": number(0-100), "priority": "urgent"|"high"|"medium"|"low", "suggestedUpdateDate": "YYYY-MM", "updateReason": "why update" }
  ],
  "seasonalCalendar": [
    { "month": "January", "topics": ["topic1", "topic2"] }
  ],
  "summary": "overview of freshness state"
}

Sort items by priority (urgent first). Include 6 months of seasonal suggestions.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Plan generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="size-6" />
            Content Freshness Planner
          </h1>
          <p className="text-muted-foreground">Prioritize content updates and plan seasonal refreshes</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Industry/Niche (optional)</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., SaaS, ecommerce, healthcare"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Content entries (format: Title | Last Updated | Topic — one per line)
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] resize-y"
                value={entries}
                onChange={(e) => setEntries(e.target.value)}
                placeholder={"SEO Guide 2024 | 2024-03-15 | SEO\nKeyword Research Tips | 2025-01-10 | Keywords\nLink Building Strategies | 2024-08-20 | Backlinks"}
              />
            </div>
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
              Generate Plan
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {result.summary && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs">{result.summary}</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Update Priority Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${priorityColors[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.updateReason}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{item.suggestedUpdateDate}</span>
                        </div>
                        <p className={`text-xs font-bold ${item.freshnessScore >= 60 ? 'text-green-400' : item.freshnessScore >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {item.freshnessScore}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Seasonal Content Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {result.seasonalCalendar.map((month) => (
                    <div key={month.month} className="rounded-md border border-border/50 p-3">
                      <p className="text-xs font-medium mb-1.5">{month.month}</p>
                      {month.topics.map((topic, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] mb-0.5">
                          <Sparkles className="size-2.5 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{topic}</span>
                        </div>
                      ))}
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

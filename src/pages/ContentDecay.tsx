import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Leaf,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  ageMonths: number;
  trafficTrend: 'up' | 'stable' | 'declining' | 'crashed';
  trafficChange: number;
  status: 'fresh' | 'aging' | 'stale' | 'decayed';
  currentTraffic: number;
}

interface RefreshSuggestion {
  title: string;
  suggestions: string[];
}

const sampleContent: ContentItem[] = [
  { id: '1', title: 'Complete Guide to SEO in 2025', url: '/blog/seo-guide-2025', publishedDate: '2025-01-15', ageMonths: 14, trafficTrend: 'declining', trafficChange: -35, status: 'decayed', currentTraffic: 450 },
  { id: '2', title: '10 Best Keyword Research Tools', url: '/blog/keyword-tools', publishedDate: '2025-06-20', ageMonths: 9, trafficTrend: 'declining', trafficChange: -18, status: 'aging', currentTraffic: 1200 },
  { id: '3', title: 'How to Write Meta Descriptions', url: '/blog/meta-descriptions', publishedDate: '2025-09-10', ageMonths: 6, trafficTrend: 'stable', trafficChange: -3, status: 'fresh', currentTraffic: 890 },
  { id: '4', title: 'Backlink Building Strategies', url: '/blog/backlinks', publishedDate: '2024-11-01', ageMonths: 16, trafficTrend: 'crashed', trafficChange: -52, status: 'decayed', currentTraffic: 200 },
  { id: '5', title: 'Technical SEO Checklist', url: '/blog/tech-seo', publishedDate: '2025-03-22', ageMonths: 12, trafficTrend: 'declining', trafficChange: -22, status: 'stale', currentTraffic: 680 },
  { id: '6', title: 'Content Marketing for SaaS', url: '/blog/saas-content', publishedDate: '2025-12-01', ageMonths: 3, trafficTrend: 'up', trafficChange: 15, status: 'fresh', currentTraffic: 1500 },
  { id: '7', title: 'Local SEO Tips', url: '/blog/local-seo', publishedDate: '2025-04-15', ageMonths: 11, trafficTrend: 'stable', trafficChange: -5, status: 'aging', currentTraffic: 750 },
  { id: '8', title: 'Voice Search Optimization', url: '/blog/voice-search', publishedDate: '2024-08-10', ageMonths: 19, trafficTrend: 'crashed', trafficChange: -68, status: 'decayed', currentTraffic: 90 },
];

const statusConfig = {
  fresh: { color: 'text-green-400', bg: 'bg-green-950/30', icon: Leaf, label: 'Fresh' },
  aging: { color: 'text-yellow-400', bg: 'bg-yellow-950/30', icon: Clock, label: 'Aging' },
  stale: { color: 'text-orange-400', bg: 'bg-orange-950/30', icon: AlertTriangle, label: 'Stale' },
  decayed: { color: 'text-red-400', bg: 'bg-red-950/30', icon: TrendingDown, label: 'Decayed' },
};

export default function ContentDecay() {
  const [content] = useState<ContentItem[]>(sampleContent);
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Map<string, RefreshSuggestion>>(new Map());

  const filtered = filter === 'all' ? content : content.filter((c) => c.status === filter);

  const getRefreshSuggestions = async (item: ContentItem) => {
    if (suggestions.has(item.id)) return;
    setRefreshing(item.id);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content refresh expert. Return JSON only.' },
          { role: 'user', content: `This content is ${item.ageMonths} months old and traffic has changed ${item.trafficChange}%:
Title: "${item.title}"
URL: ${item.url}

Generate refresh suggestions. Return JSON:
{ "title": "${item.title}", "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"] }

Include specific, actionable suggestions like updating stats, adding new sections, refreshing examples, etc.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as RefreshSuggestion;
      setSuggestions((prev) => new Map(prev).set(item.id, parsed));
      toast.success('Suggestions ready');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setRefreshing(null);
    }
  };

  const stats = {
    fresh: content.filter((c) => c.status === 'fresh').length,
    aging: content.filter((c) => c.status === 'aging').length,
    stale: content.filter((c) => c.status === 'stale').length,
    decayed: content.filter((c) => c.status === 'decayed').length,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="size-6" />
            Content Decay Detector
          </h1>
          <p className="text-muted-foreground">Track content freshness and get AI-powered refresh suggestions</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {(Object.entries(stats) as [keyof typeof statusConfig, number][]).map(([status, count]) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <Card
                key={status}
                className={`cursor-pointer transition-colors ${filter === status ? 'border-primary/50' : ''}`}
                onClick={() => setFilter(filter === status ? 'all' : status)}
              >
                <CardContent className="pt-4 text-center">
                  <Icon className={`size-5 mx-auto mb-1 ${config.color}`} />
                  <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-2">
          {filtered.map((item) => {
            const config = statusConfig[item.status];
            const Icon = config.icon;
            const hasSuggestions = suggestions.has(item.id);
            return (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${config.bg} ${config.color}`}>
                          <Icon className="size-2.5" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.url}</p>
                      <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                        <span>Published: {item.publishedDate}</span>
                        <span>Age: {item.ageMonths}mo</span>
                        <span>Traffic: {item.currentTraffic.toLocaleString()}/mo</span>
                        <span className={item.trafficChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {item.trafficChange > 0 ? '+' : ''}{item.trafficChange}%
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => getRefreshSuggestions(item)}
                      disabled={refreshing === item.id || hasSuggestions}
                    >
                      {refreshing === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : hasSuggestions ? (
                        <Sparkles className="size-3.5 text-green-400" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      {hasSuggestions ? 'Done' : 'Refresh Tips'}
                    </Button>
                  </div>

                  {hasSuggestions && (
                    <div className="mt-3 rounded-md border border-border/50 p-3 space-y-1.5">
                      <p className="text-[10px] font-medium text-primary">Refresh Suggestions</p>
                      {suggestions.get(item.id)!.suggestions.map((s, si) => (
                        <div key={si} className="flex items-start gap-1.5 text-xs">
                          <Sparkles className="size-3 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Traffic bar */}
                  <div className="mt-2 h-1 rounded-full bg-muted/30">
                    <div
                      className={`h-full rounded-full ${
                        item.trafficTrend === 'up' ? 'bg-green-500' :
                        item.trafficTrend === 'stable' ? 'bg-yellow-500' :
                        item.trafficTrend === 'declining' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(Math.min((item.currentTraffic / 1500) * 100, 100), 5)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

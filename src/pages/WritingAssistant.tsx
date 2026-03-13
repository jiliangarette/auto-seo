import { useState, useMemo, useCallback } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { calculateBasicMetrics } from '@/lib/readability';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Loader2, RefreshCw, Link2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Suggestion {
  type: 'seo' | 'readability' | 'link' | 'rewrite';
  text: string;
  paragraph?: number;
  rewrittenText?: string;
}

export default function WritingAssistant() {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [existingPages, setExistingPages] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [appliedRewrites, setAppliedRewrites] = useState<Set<number>>(new Set());

  // Real-time readability metrics
  const metrics = useMemo(() => {
    if (!content.trim()) return null;
    return calculateBasicMetrics(content);
  }, [content]);

  // Keyword density
  const keywordDensity = useMemo(() => {
    if (!keyword.trim() || !content.trim()) return 0;
    const words = content.toLowerCase().split(/\s+/);
    const kw = keyword.toLowerCase();
    const count = words.filter((w) => w.includes(kw)).length;
    return Math.round((count / words.length) * 1000) / 10;
  }, [content, keyword]);

  const densityColor = keywordDensity >= 0.5 && keywordDensity <= 2.5 ? 'text-green-400' : keywordDensity > 2.5 ? 'text-red-400' : 'text-yellow-400';

  const getSuggestions = useCallback(async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const pages = existingPages.split('\n').map((p) => p.trim()).filter(Boolean);
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO writing assistant. Analyze content and provide suggestions. Return JSON only.',
          },
          {
            role: 'user',
            content: `Analyze this content${keyword ? ` for keyword "${keyword}"` : ''}:

${content.slice(0, 3000)}

${pages.length ? `Existing pages for internal linking:\n${pages.join('\n')}` : ''}

Return JSON array of suggestions:
[{ type: "seo"|"readability"|"link"|"rewrite", text: "suggestion description", paragraph?: number (1-indexed, for rewrite only), rewrittenText?: "improved version" }]

Include:
- 2-3 SEO suggestions (keyword usage, heading tips, meta guidance)
- 2-3 readability suggestions (sentence length, passive voice, jargon)
${pages.length ? '- 2-3 internal link suggestions (where to add links to existing pages)' : ''}
- 2-3 rewrite suggestions for weak paragraphs (include paragraph number and rewritten version)`,
          },
        ],
      });

      const raw = response.choices[0].message.content ?? '[]';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as Suggestion[];
      setSuggestions(parsed);
      setAppliedRewrites(new Set());
      toast.success(`${parsed.length} suggestions generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  }, [content, keyword, existingPages]);

  const applyRewrite = (suggestion: Suggestion, index: number) => {
    if (!suggestion.rewrittenText || suggestion.paragraph == null) return;
    const paragraphs = content.split('\n\n');
    const pIdx = suggestion.paragraph - 1;
    if (pIdx >= 0 && pIdx < paragraphs.length) {
      paragraphs[pIdx] = suggestion.rewrittenText;
      setContent(paragraphs.join('\n\n'));
      setAppliedRewrites((prev) => new Set([...prev, index]));
      toast.success('Rewrite applied');
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'seo': return <Lightbulb className="size-3.5 text-yellow-400" />;
      case 'readability': return <PenTool className="size-3.5 text-blue-400" />;
      case 'link': return <Link2 className="size-3.5 text-purple-400" />;
      case 'rewrite': return <RefreshCw className="size-3.5 text-green-400" />;
      default: return null;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'seo': return 'bg-yellow-950/30 text-yellow-400';
      case 'readability': return 'bg-blue-950/30 text-blue-400';
      case 'link': return 'bg-purple-950/30 text-purple-400';
      case 'rewrite': return 'bg-green-950/30 text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PenTool className="size-6" />
            AI Writing Assistant
          </h1>
          <p className="text-muted-foreground">Write with real-time SEO feedback and AI suggestions</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/30 bg-card/40">
              <CardContent className="pt-6 space-y-3">
                <div className="flex gap-3">
                  <Input
                    placeholder="Target keyword (optional)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={getSuggestions} disabled={loading || !content.trim()}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Lightbulb className="size-4" />}
                    Get Suggestions
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[400px] resize-y leading-relaxed"
                  placeholder="Start writing your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Existing pages for internal linking (one URL per line)</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y text-xs"
                    placeholder={"/blog/seo-guide\n/tools/keyword-research\n/about"}
                    value={existingPages}
                    onChange={(e) => setExistingPages(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Live metrics */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Live Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {metrics ? (
                  <>
                    <MetricRow label="Words" value={metrics.wordCount} />
                    <MetricRow label="Sentences" value={metrics.sentenceCount} />
                    <MetricRow label="Paragraphs" value={metrics.paragraphCount} />
                    <MetricRow
                      label="Flesch Score"
                      value={metrics.fleschScore}
                      color={metrics.fleschScore >= 60 ? 'text-green-400' : metrics.fleschScore >= 30 ? 'text-yellow-400' : 'text-red-400'}
                    />
                    <MetricRow label="Grade Level" value={metrics.gradeLevel} />
                    <MetricRow label="Avg Words/Sentence" value={metrics.avgSentenceLength} />
                    {keyword && (
                      <MetricRow label="Keyword Density" value={`${keywordDensity}%`} color={densityColor} />
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Start typing to see stats...</p>
                )}
              </CardContent>
            </Card>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Suggestions ({suggestions.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {typeIcon(s.type)}
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${typeColor(s.type)}`}>
                          {s.type}
                        </span>
                      </div>
                      <p className="text-xs">{s.text}</p>
                      {s.type === 'rewrite' && s.rewrittenText && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-green-400 bg-green-950/10 rounded p-1.5">{s.rewrittenText}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => applyRewrite(s, i)}
                            disabled={appliedRewrites.has(i)}
                          >
                            {appliedRewrites.has(i) ? 'Applied' : 'Apply Rewrite'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${color ?? ''}`}>{value}</span>
    </div>
  );
}

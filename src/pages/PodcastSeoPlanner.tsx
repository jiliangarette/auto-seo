import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText } from 'lucide-react';
import { toast } from 'sonner';

interface Episode {
  title: string;
  keyword: string;
  description: string;
  searchVolume: string;
}

interface PodcastResult {
  topic: string;
  summary: string;
  episodes: Episode[];
  showNotesTemplate: string;
  distributionStrategy: { platform: string; action: string; tip: string }[];
  discoveryTips: string[];
}

export default function PodcastSeoPlanner() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<PodcastResult | null>(null);

  const plan = async () => {
    if (!topic.trim() || !niche.trim()) { toast.error('Enter topic and niche'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a podcast SEO expert. Return JSON only.' },
          { role: 'user', content: `Plan podcast SEO:\nTopic: ${topic}\nNiche: ${niche}\n\nReturn JSON:\n{\n  "topic": "${topic}",\n  "summary": "podcast SEO strategy overview",\n  "episodes": [\n    { "title": "SEO-optimized episode title", "keyword": "target keyword", "description": "episode description", "searchVolume": "keyword volume" }\n  ],\n  "showNotesTemplate": "SEO-optimized show notes template with placeholders",\n  "distributionStrategy": [\n    { "platform": "platform name", "action": "what to do", "tip": "SEO tip for this platform" }\n  ],\n  "discoveryTips": ["tip 1", "tip 2"]\n}\n\nGenerate 6 episodes, 5 distribution platforms, and 4 discovery tips.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Podcast plan generated');
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
            <BookText className="size-6" />
            Podcast SEO Planner
          </h1>
          <p className="text-muted-foreground">Plan SEO-optimized podcast episodes and distribution</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Podcast topic (e.g., Digital Marketing Tips)" />
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche (e.g., B2B SaaS)" />
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BookText className="size-4" />}
              Plan Podcast SEO
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Podcast: {result.topic}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Episode Ideas ({result.episodes.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.episodes.map((e, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <p className="text-sm font-medium">{e.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px]">
                        <span className="text-primary">Keyword: {e.keyword}</span>
                        <span className="text-muted-foreground">{e.searchVolume}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{e.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Show Notes Template</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/20 p-3 rounded-md">{result.showNotesTemplate}</pre>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Distribution Strategy</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.distributionStrategy.map((d, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold">{d.platform}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{d.action}</p>
                      <p className="text-[10px] text-primary/80 mt-1">{d.tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Discovery Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.discoveryTips.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

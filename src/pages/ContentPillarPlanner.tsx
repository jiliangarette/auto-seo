import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, Link2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface ClusterTopic {
  title: string;
  keyword: string;
  type: 'how-to' | 'listicle' | 'guide' | 'comparison' | 'case-study';
  priority: 'high' | 'medium' | 'low';
}

interface InternalLink {
  from: string;
  to: string;
  anchorText: string;
}

interface PillarResult {
  pillarTitle: string;
  pillarKeyword: string;
  pillarOutline: string[];
  clusterTopics: ClusterTopic[];
  internalLinks: InternalLink[];
  timeline: { week: number; task: string }[];
  summary: string;
}

const prioColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

const typeColors: Record<string, string> = {
  'how-to': 'text-green-400 bg-green-950/30',
  listicle: 'text-purple-400 bg-purple-950/30',
  guide: 'text-blue-400 bg-blue-950/30',
  comparison: 'text-orange-400 bg-orange-950/30',
  'case-study': 'text-pink-400 bg-pink-950/30',
};

export default function ContentPillarPlanner() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PillarResult | null>(null);

  const plan = async () => {
    if (!topic.trim()) { toast.error('Enter a core topic'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a content strategy expert. Return JSON only.' },
          { role: 'user', content: `Create a content pillar strategy for:\nCore Topic: ${topic}\nNiche: ${niche || 'General'}\n\nReturn JSON:\n{\n  "pillarTitle": "Pillar page title",\n  "pillarKeyword": "main keyword",\n  "pillarOutline": ["Section 1", "Section 2", ...],\n  "clusterTopics": [\n    { "title": "Cluster article title", "keyword": "target keyword", "type": "how-to"|"listicle"|"guide"|"comparison"|"case-study", "priority": "high"|"medium"|"low" }\n  ],\n  "internalLinks": [\n    { "from": "article title", "to": "article title", "anchorText": "link text" }\n  ],\n  "timeline": [\n    { "week": 1, "task": "Write pillar page" }\n  ],\n  "summary": "strategy overview"\n}\n\nGenerate 6-8 pillar outline sections, 8-10 cluster topics, 6-8 internal links, and a 6-week timeline.` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Pillar strategy generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="size-6" />
            Content Pillar Planner
          </h1>
          <p className="text-muted-foreground">Build pillar pages with cluster topics and internal linking maps</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Core topic (e.g., 'Email Marketing')" />
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche or industry (optional)" />
            <Button onClick={plan} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
              Generate Pillar Strategy
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-lg font-bold">{result.pillarTitle}</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Target keyword: {result.pillarKeyword}</p>
                <p className="text-xs text-muted-foreground mt-2">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pillar Page Outline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.pillarOutline.map((section, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] text-muted-foreground w-5">{i + 1}.</span>
                      <span>{section}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cluster Topics ({result.clusterTopics.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.clusterTopics.map((ct, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ct.title}</p>
                        <p className="text-[10px] text-muted-foreground">{ct.keyword}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeColors[ct.type] ?? 'text-muted-foreground bg-muted/30'}`}>{ct.type}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${prioColors[ct.priority]}`}>{ct.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><Link2 className="size-3.5" /> Internal Linking Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.internalLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs rounded-md border border-border/50 p-2">
                      <span className="font-medium truncate flex-1">{link.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium truncate flex-1">{link.to}</span>
                      <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{link.anchorText}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><CalendarDays className="size-3.5" /> Production Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">Week {item.week}</span>
                      <span className="text-muted-foreground">{item.task}</span>
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

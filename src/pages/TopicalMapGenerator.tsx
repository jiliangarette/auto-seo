import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Loader2, Copy, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface TopicNode {
  topic: string;
  keyword: string;
  searchVolume: string;
  children: TopicNode[];
}

interface TopicalMapResult {
  seedTopic: string;
  rootNode: TopicNode;
  totalTopics: number;
  summary: string;
}

function TopicTree({ node, depth = 0 }: { node: TopicNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-border/30 pl-3' : ''}>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="w-full flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/20 transition-colors text-left"
      >
        {hasChildren && (
          <ChevronRight className={`size-3 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
        )}
        {!hasChildren && <span className="w-3" />}
        <span className={`text-sm ${depth === 0 ? 'font-bold' : depth === 1 ? 'font-medium' : ''}`}>{node.topic}</span>
        <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground ml-auto shrink-0">{node.keyword}</span>
        <span className="text-[9px] text-muted-foreground shrink-0">{node.searchVolume}</span>
      </button>
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child, idx) => (
            <TopicTree key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopicalMapGenerator() {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TopicalMapResult | null>(null);

  const generate = async () => {
    if (!seed.trim()) { toast.error('Enter a seed topic'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a topical authority expert. Return JSON only.' },
          { role: 'user', content: `Generate a topical map for: "${seed}"\n\nReturn JSON:\n{\n  "seedTopic": "${seed}",\n  "rootNode": {\n    "topic": "Main Topic",\n    "keyword": "primary keyword",\n    "searchVolume": "10K-50K",\n    "children": [\n      {\n        "topic": "Subtopic 1",\n        "keyword": "subtopic keyword",\n        "searchVolume": "1K-5K",\n        "children": [\n          { "topic": "Sub-subtopic", "keyword": "long-tail keyword", "searchVolume": "100-500", "children": [] }\n        ]\n      }\n    ]\n  },\n  "totalTopics": number,\n  "summary": "topical map overview"\n}\n\nGenerate a 3-level deep hierarchy with 4-5 main subtopics, each having 2-3 sub-subtopics. Total 20-25 topics.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Topical map generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.rootNode, null, 2));
    toast.success('Topical map JSON copied');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="size-6" />
            Topical Map Generator
          </h1>
          <p className="text-muted-foreground">Generate hierarchical topic clusters for topical authority</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Seed topic (e.g., 'Content Marketing')" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Generate Topical Map
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalTopics}</p>
                  <p className="text-[10px] text-muted-foreground">Total Topics</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{result.summary}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Topic Hierarchy</CardTitle>
              </CardHeader>
              <CardContent>
                <TopicTree node={result.rootNode} />
              </CardContent>
            </Card>

            <Button variant="outline" onClick={exportJson} className="gap-1.5">
              <Copy className="size-3.5" /> Export as JSON
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

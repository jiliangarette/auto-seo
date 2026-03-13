import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tags } from 'lucide-react';
import { toast } from 'sonner';

interface Entity {
  name: string;
  type: string;
  knowledgeGraphMatch: boolean;
  salience: number;
  mentions: number;
  optimization: string;
}

interface Relationship {
  from: string;
  to: string;
  relation: string;
}

interface EntityResult {
  summary: string;
  entities: Entity[];
  relationships: Relationship[];
  recommendations: string[];
  entityScore: number;
}

export default function EntitySeoOptimizer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EntityResult | null>(null);

  const analyze = async () => {
    if (!content.trim()) { toast.error('Paste content for entity analysis'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an entity SEO expert specializing in Knowledge Graph optimization. Return JSON only.' },
          { role: 'user', content: `Extract and analyze entities for SEO:\n\n${content.slice(0, 4000)}\n\nReturn JSON:\n{\n  "summary": "entity analysis overview",\n  "entities": [\n    { "name": "entity name", "type": "Person|Organization|Place|Product|Concept|Event", "knowledgeGraphMatch": boolean, "salience": number(0-1), "mentions": number, "optimization": "how to better optimize for this entity" }\n  ],\n  "relationships": [\n    { "from": "entity1", "to": "entity2", "relation": "relationship type" }\n  ],\n  "recommendations": ["recommendation 1", "recommendation 2"],\n  "entityScore": number(0-100)\n}\n\nExtract 8-12 entities and 5-8 relationships.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Entity analysis complete');
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
            <Tags className="size-6" />
            Entity SEO Optimizer
          </h1>
          <p className="text-muted-foreground">Extract entities, map to Knowledge Graph, and optimize relationships</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content for entity extraction and optimization..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
              Analyze Entities
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">Entity Score</h2>
                    <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                  </div>
                  <p className={`text-3xl font-bold ${result.entityScore >= 70 ? 'text-green-400' : result.entityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.entityScore}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Entities ({result.entities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.entities
                    .sort((a, b) => b.salience - a.salience)
                    .map((e, idx) => (
                      <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold">{e.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{e.type}</span>
                          {e.knowledgeGraphMatch && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-950/30 text-green-400">KG Match</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">Salience: {(e.salience * 100).toFixed(0)}% · {e.mentions}x</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{e.optimization}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Entity Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.relationships.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs rounded-md border border-border/50 p-2">
                      <span className="font-medium text-primary">{r.from}</span>
                      <span className="text-muted-foreground px-2 py-0.5 rounded bg-muted/20">{r.relation}</span>
                      <span className="font-medium text-primary">{r.to}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold mt-0.5">{idx + 1}.</span>
                      <span className="text-muted-foreground">{rec}</span>
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

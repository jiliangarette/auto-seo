import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Loader2,
  Copy,
  List,
  AlignLeft,
  Table,
} from 'lucide-react';
import { toast } from 'sonner';

interface SnippetBlock {
  format: 'paragraph' | 'list' | 'table';
  content: string;
  wordCount: number;
  confidence: number;
}

interface SnippetResult {
  keyword: string;
  currentSnippetHolder: string;
  snippetType: string;
  yourChance: number;
  optimizedBlocks: SnippetBlock[];
  tips: string[];
}

const formatIcons = {
  paragraph: AlignLeft,
  list: List,
  table: Table,
};

export default function FeaturedSnippetOptimizer() {
  const [keyword, setKeyword] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnippetResult | null>(null);

  const optimize = async () => {
    if (!keyword.trim()) {
      toast.error('Enter a target keyword');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a featured snippet optimization expert. Return JSON only.' },
          { role: 'user', content: `Optimize content for featured snippet position:

Target keyword: "${keyword}"
Current content: ${content || 'Not provided — generate from scratch'}

Analyze what type of snippet Google would show for this keyword.
Generate optimized content blocks in different formats.

Return JSON:
{
  "keyword": "${keyword}",
  "currentSnippetHolder": "example competitor domain",
  "snippetType": "paragraph|list|table",
  "yourChance": number(0-100),
  "optimizedBlocks": [
    { "format": "paragraph", "content": "optimized paragraph snippet (40-60 words)", "wordCount": number, "confidence": number(0-100) },
    { "format": "list", "content": "1. item\\n2. item\\n3. item\\n...", "wordCount": number, "confidence": number(0-100) },
    { "format": "table", "content": "Header1 | Header2\\n--- | ---\\nRow1 | Data1\\n...", "wordCount": number, "confidence": number(0-100) }
  ],
  "tips": ["optimization tip 1", "tip 2", ...]
}` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Snippet optimization complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const copyBlock = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Content copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="size-6" />
            Featured Snippet Optimizer
          </h1>
          <p className="text-muted-foreground">Win position zero with AI-optimized snippet content</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Target Keyword & Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Target Keyword</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., how to improve page speed" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Current Content (optional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your current content for this keyword..."
              />
            </div>
            <Button onClick={optimize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
              Optimize for Snippet
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${result.yourChance >= 60 ? 'text-green-400' : result.yourChance >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.yourChance}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Win Probability</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm font-bold text-primary">{result.snippetType}</p>
                  <p className="text-[10px] text-muted-foreground">Expected Format</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-xs font-mono text-muted-foreground truncate">{result.currentSnippetHolder}</p>
                  <p className="text-[10px] text-muted-foreground">Current Holder</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {result.optimizedBlocks.map((block, idx) => {
                const FormatIcon = formatIcons[block.format] ?? AlignLeft;
                return (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FormatIcon className="size-4 text-primary" />
                          <CardTitle className="text-sm capitalize">{block.format} Format</CardTitle>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                            block.confidence >= 70 ? 'text-green-400 bg-green-950/30' :
                            block.confidence >= 40 ? 'text-yellow-400 bg-yellow-950/30' :
                            'text-red-400 bg-red-950/30'
                          }`}>
                            {block.confidence}% confidence
                          </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => copyBlock(block.content)}>
                          <Copy className="size-3.5" /> Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md bg-muted/20 p-3">
                        <pre className="text-sm whitespace-pre-wrap font-sans">{block.content}</pre>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{block.wordCount} words</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Optimization Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <Trophy className="size-3 text-yellow-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface SummaryResult {
  executive: string;
  keyPoints: string[];
  tldr: string;
  social: { twitter: string; linkedin: string; facebook: string };
  wordCount: { original: number; summary: number };
}

export default function ContentSummarizer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);

  const summarize = async () => {
    if (!content.trim()) { toast.error('Paste content to summarize'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a content summarization expert. Return JSON only.' },
          { role: 'user', content: `Summarize this content:\n\n${content.slice(0, 4000)}\n\nReturn JSON:\n{\n  "executive": "2-3 sentence executive summary",\n  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],\n  "tldr": "one sentence TL;DR",\n  "social": {\n    "twitter": "280 char max tweet version",\n    "linkedin": "short linkedin post version",\n    "facebook": "casual facebook post version"\n  },\n  "wordCount": { "original": number, "summary": number }\n}` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content summarized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Summarization failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            Content Summarizer
          </h1>
          <p className="text-muted-foreground">Generate executive summaries, key points, and social snippets</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your long-form content here..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
            />
            <Button onClick={summarize} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Summarize
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Executive Summary</CardTitle>
                  <span className="text-[10px] text-muted-foreground">{result.wordCount.original} → {result.wordCount.summary} words</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.executive}</p>
                <Button variant="ghost" size="sm" onClick={() => copy(result.executive, 'Summary')} className="mt-2 gap-1 h-6 text-xs">
                  <Copy className="size-3" /> Copy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">TL;DR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{result.tldr}</p>
                <Button variant="ghost" size="sm" onClick={() => copy(result.tldr, 'TL;DR')} className="mt-2 gap-1 h-6 text-xs">
                  <Copy className="size-3" /> Copy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold text-xs mt-0.5">{idx + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" onClick={() => copy(result.keyPoints.join('\n'), 'Key points')} className="mt-2 gap-1 h-6 text-xs">
                  <Copy className="size-3" /> Copy All
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Social Media Snippets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(result.social).map(([platform, text]) => (
                  <div key={platform} className="rounded-md border border-border/50 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold capitalize">{platform}</span>
                      <Button variant="ghost" size="sm" onClick={() => copy(text, platform)} className="gap-1 h-5 text-[10px]">
                        <Copy className="size-2.5" /> Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface RepurposeResult {
  content: string;
  summary: string;
  socialPosts: { platform: string; post: string; hashtags: string[]; bestTime: string }[];
  emailSnippets: { subject: string; preview: string; body: string }[];
  infographicOutline: { section: string; dataPoint: string; visual: string }[];
  calendar: { day: string; platform: string; format: string; content: string }[];
}

export default function ContentRepurposingEngine() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<RepurposeResult | null>(null);

  const repurpose = async () => {
    if (!content.trim()) { toast.error('Enter content to repurpose'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content repurposing expert. Return JSON only.' },
          { role: 'user', content: `Repurpose this content for multiple formats:\n${content}\n\nReturn JSON:\n{\n  "content": "original content title/topic",\n  "summary": "repurposing strategy overview",\n  "socialPosts": [\n    { "platform": "platform name", "post": "adapted post text", "hashtags": ["tag1"], "bestTime": "optimal posting time" }\n  ],\n  "emailSnippets": [\n    { "subject": "email subject", "preview": "preview text", "body": "email body excerpt" }\n  ],\n  "infographicOutline": [\n    { "section": "section title", "dataPoint": "key data", "visual": "visual suggestion" }\n  ],\n  "calendar": [\n    { "day": "Day 1", "platform": "platform", "format": "content format", "content": "what to post" }\n  ]\n}\n\nGenerate 5 social posts, 3 email snippets, 4 infographic sections, and 7 calendar entries.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content repurposed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Repurposing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="size-6" />
            Content Repurposing Engine
          </h1>
          <p className="text-muted-foreground">Transform content into multiple formats for maximum reach</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content topic or URL (e.g., 10 Tips for Better SEO)" />
            <Button onClick={repurpose} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Repurpose Content
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">{result.content}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Social Posts ({result.socialPosts.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.socialPosts.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{s.platform}</span>
                        <span className="text-[10px] text-muted-foreground">{s.bestTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.post}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.hashtags.map((h, i) => (
                          <span key={i} className="text-[10px] text-primary">#{h}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Email Snippets</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.emailSnippets.map((e, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold">{e.subject}</p>
                      <p className="text-[10px] text-primary mt-0.5">{e.preview}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{e.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Infographic Outline</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.infographicOutline.map((i, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold">{i.section}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{i.dataPoint}</p>
                      <p className="text-[10px] text-primary/80 mt-0.5">{i.visual}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Repurposing Calendar</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.calendar.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                      <div>
                        <span className="text-xs font-medium">{c.day}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.content}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-primary">{c.platform}</span>
                        <span className="text-muted-foreground">{c.format}</span>
                      </div>
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

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  name: string;
  type: string;
  seoScore: number;
  structure: string[];
  preview: string;
  bestFor: string;
}

interface TemplateResult {
  keyword: string;
  niche: string;
  summary: string;
  templates: Template[];
  customizations: { section: string; suggestion: string }[];
}

export default function SeoContentTemplates() {
  const [keyword, setKeyword] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TemplateResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const generate = async () => {
    if (!keyword.trim() || !niche.trim()) { toast.error('Enter keyword and niche'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO content template expert. Return JSON only.' },
          { role: 'user', content: `Generate SEO content templates:\nKeyword: ${keyword}\nNiche: ${niche}\n\nReturn JSON:\n{\n  "keyword": "${keyword}",\n  "niche": "${niche}",\n  "summary": "template library overview",\n  "templates": [\n    {\n      "name": "template name",\n      "type": "how-to|listicle|comparison|guide|review|case-study",\n      "seoScore": number(0-100),\n      "structure": ["H1: ...", "Intro paragraph", "H2: ...", "Content section", "H2: ...", "FAQ section", "Conclusion + CTA"],\n      "preview": "first 2-3 sentences of generated content",\n      "bestFor": "when to use this template"\n    }\n  ],\n  "customizations": [\n    { "section": "section name", "suggestion": "how to customize" }\n  ]\n}\n\nGenerate 5 templates and 4 customization tips.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Templates generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
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
            SEO Content Templates
          </h1>
          <p className="text-muted-foreground">Browse and customize SEO-optimized content templates</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword (e.g., best email marketing tools)" />
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche (e.g., digital marketing)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BookText className="size-4" />}
              Generate Templates
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Templates for "{result.keyword}"</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {result.templates.map((t, idx) => (
                <Card key={idx} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === idx ? null : idx)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.bestFor}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{t.type}</span>
                        <span className={`text-sm font-bold ${t.seoScore >= 80 ? 'text-green-400' : t.seoScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{t.seoScore}</span>
                      </div>
                    </div>
                  </CardHeader>
                  {expanded === idx && (
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground mb-1">STRUCTURE</p>
                          <div className="space-y-0.5">
                            {t.structure.map((s, i) => (
                              <p key={i} className="text-xs text-muted-foreground">{s}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground mb-1">PREVIEW</p>
                          <p className="text-xs text-muted-foreground italic">{t.preview}</p>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Customization Tips</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.customizations.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-medium">{c.section}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{c.suggestion}</p>
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

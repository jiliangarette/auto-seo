import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateContentBrief } from '@/lib/brief-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, ArrowRight, Copy, Globe } from 'lucide-react';
import { toast } from 'sonner';

type Brief = Awaited<ReturnType<typeof generateContentBrief>>;

export default function ContentBrief() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !audience.trim()) return;
    setLoading(true);
    try {
      const data = await generateContentBrief(keyword.trim(), audience.trim());
      setBrief(data);
      toast.success('Brief generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const briefToText = () => {
    if (!brief) return '';
    let text = `# ${brief.title}\n\nKeyword: ${brief.keyword}\nAudience: ${brief.audience}\nWord count: ${brief.wordCountTarget}\nTone: ${brief.tone}\n\n## Outline\n`;
    brief.outline.forEach((s) => {
      text += `\n### ${s.heading}\n`;
      s.points.forEach((p) => (text += `- ${p}\n`));
    });
    text += `\n## Questions to Answer\n`;
    brief.questionsToAnswer.forEach((q) => (text += `- ${q}\n`));
    text += `\n## Competitor Angles\n`;
    brief.competitorAngles.forEach((a) => (text += `- ${a}\n`));
    text += `\n## CTA: ${brief.callToAction}\n`;
    return text;
  };

  const goToDraft = () => {
    if (!brief) return;
    const topic = encodeURIComponent(brief.title);
    const kws = encodeURIComponent(brief.keyword);
    navigate(`/generator?topic=${topic}&keywords=${kws}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="size-6" />
            Content Brief Generator
          </h1>
          <p className="text-muted-foreground">AI-generated content briefs with outline, competitor angles, and questions</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6">
            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Target keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} required className="pl-10 bg-background/60 border-border/30 h-11" />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Target audience (e.g., small business owners, developers)" value={audience} onChange={(e) => setAudience(e.target.value)} required className="pl-10 bg-background/60 border-border/30 h-11" />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
                Generate Brief
              </Button>
            </form>
          </CardContent>
        </Card>

        {brief && (
          <>
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{brief.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(briefToText()); toast.success('Copied'); }}>
                      <Copy className="size-4" /> Copy
                    </Button>
                    <Button size="sm" onClick={goToDraft}>
                      <ArrowRight className="size-4" /> Draft Content
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  <div className="rounded bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold">{brief.wordCountTarget}</p>
                    <p className="text-xs text-muted-foreground">Word target</p>
                  </div>
                  <div className="rounded bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold">{brief.outline.length}</p>
                    <p className="text-xs text-muted-foreground">Sections</p>
                  </div>
                  <div className="rounded bg-muted/50 p-3 text-center">
                    <p className="text-sm font-bold">{brief.tone}</p>
                    <p className="text-xs text-muted-foreground">Tone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader><CardTitle className="text-sm">Outline</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {brief.outline.map((section, i) => (
                  <div key={i} className="rounded border border-border/50 p-3">
                    <h4 className="font-medium text-sm">{section.heading}</h4>
                    <ul className="mt-1 space-y-0.5">
                      {section.points.map((p, j) => (
                        <li key={j} className="text-xs text-muted-foreground">• {p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card className="border-border/30 bg-card/40">
                <CardHeader><CardTitle className="text-sm">Questions to Answer</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {brief.questionsToAnswer.map((q, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {q}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardHeader><CardTitle className="text-sm">Competitor Angles</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {brief.competitorAngles.map((a, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {a}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardContent className="pt-4">
                <p className="text-sm"><strong>CTA:</strong> {brief.callToAction}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

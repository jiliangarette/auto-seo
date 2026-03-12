import { useState } from 'react';
import { generateSEOContent, type GeneratedContent, type GenerateMode } from '@/lib/content-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Copy, Check, Globe, Swords, FileText, Loader2 } from 'lucide-react';

const modes = [
  { id: 'topic' as GenerateMode, label: 'From Topic', desc: 'Write about any topic with your keywords', icon: FileText, gradient: 'from-violet-500/20 to-fuchsia-500/20', border: 'border-violet-500/20', active: 'ring-violet-500/40' },
  { id: 'url-audit' as GenerateMode, label: 'From Website', desc: 'AI analyzes your site and finds the best content gaps', icon: Globe, gradient: 'from-emerald-500/20 to-sky-500/20', border: 'border-emerald-500/20', active: 'ring-emerald-500/40' },
  { id: 'competitor' as GenerateMode, label: 'Beat Competitor', desc: 'Outrank a competitor by writing better content', icon: Swords, gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/20', active: 'ring-orange-500/40' },
];

export default function Generator() {
  const [mode, setMode] = useState<GenerateMode>('topic');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (mode === 'topic' && !topic.trim()) { toast.error('Enter a topic'); return; }
    if (mode === 'url-audit' && !siteUrl.trim()) { toast.error('Enter your website URL'); return; }
    if (mode === 'competitor' && !competitorUrl.trim()) { toast.error('Enter competitor URL'); return; }

    setLoading(true);
    try {
      const content = await generateSEOContent({
        mode,
        topic: topic.trim() || undefined,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
        tone,
        length,
        siteUrl: siteUrl.trim() || undefined,
        competitorUrl: competitorUrl.trim() || undefined,
      });
      setResult(content);
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `# ${result.title}\n\n${result.metaDescription}\n\n${result.content}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = (score: number) => score >= 80 ? 'from-emerald-500' : score >= 50 ? 'from-amber-500' : 'from-red-500';

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
            <Sparkles className="size-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Content Generator</h1>
            <p className="text-xs text-muted-foreground">AI-powered SEO content — from topics, websites, or competitors</p>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid gap-3 md:grid-cols-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative text-left rounded-xl border p-4 transition-all ${active ? `${m.border} bg-gradient-to-br ${m.gradient} ring-2 ${m.active}` : 'border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/60'}`}
              >
                <Icon className={`size-5 mb-2 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium ${active ? '' : 'text-muted-foreground'}`}>{m.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{m.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-5 space-y-4">
            {mode === 'topic' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Best practices for technical SEO in 2026" className="bg-background/50 border-border/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keywords <span className="font-normal">(comma-separated)</span></label>
                  <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., technical SEO, site speed, core web vitals" className="bg-background/50 border-border/40" />
                </div>
              </>
            )}

            {mode === 'url-audit' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="e.g., mybusiness.com" className="pl-9 bg-background/50 border-border/40" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">AI will fetch your site, analyze content gaps, and automatically pick the best keywords</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Focus Topic <span className="font-normal">(optional)</span></label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Leave blank for AI to choose the best topic" className="bg-background/50 border-border/40" />
                </div>
              </>
            )}

            {mode === 'competitor' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Competitor URL</label>
                  <div className="relative">
                    <Swords className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} placeholder="e.g., competitor.com/their-blog-post" className="pl-9 bg-background/50 border-border/40" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">AI will analyze their content and write something better to outrank them</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Angle <span className="font-normal">(optional)</span></label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Leave blank to auto-detect their topic" className="bg-background/50 border-border/40" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="friendly">Conversational</option>
                  <option value="technical">Technical</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Length</label>
                <select value={length} onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')} className="w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm">
                  <option value="short">Short (~300 words)</option>
                  <option value="medium">Medium (~600 words)</option>
                  <option value="long">Long (~1200 words)</option>
                </select>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white font-medium">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? (mode === 'url-audit' ? 'Analyzing site & generating...' : mode === 'competitor' ? 'Analyzing competitor & generating...' : 'Generating content...') : 'Generate Content'}
            </Button>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="size-12 rounded-full border-2 border-t-violet-400 border-r-fuchsia-400 border-b-transparent border-l-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">{mode === 'url-audit' ? 'Fetching your website and finding content opportunities...' : mode === 'competitor' ? 'Analyzing competitor content...' : 'Crafting your SEO content...'}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Stats bar */}
            <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="flex items-center gap-2">
                <div className={`size-8 rounded-lg bg-gradient-to-br ${scoreBg(result.seoScore)} to-transparent flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{result.seoScore}</span>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">SEO Score</p>
                  <p className={`text-xs font-medium ${scoreColor(result.seoScore)}`}>{result.seoScore >= 80 ? 'Excellent' : result.seoScore >= 50 ? 'Good' : 'Needs Work'}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div>
                <p className="text-[10px] text-muted-foreground">Words</p>
                <p className="text-xs font-medium">{result.wordCount ?? '—'}</p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div>
                <p className="text-[10px] text-muted-foreground">Keywords</p>
                <p className="text-xs font-medium">{result.keywordsUsed.length}</p>
              </div>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={handleCopy} className="border-border/40 text-xs h-8">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copied' : 'Copy All'}
                </Button>
              </div>
            </div>

            {/* Title & Meta */}
            <Card className="border-border/40 bg-card/50">
              <CardContent className="pt-5 pb-5 space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Title Tag</p>
                  <p className="text-base font-semibold leading-snug">{result.title}</p>
                  <p className={`text-[10px] mt-1 ${(result.title?.length ?? 0) > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{result.title?.length ?? 0} characters</p>
                </div>
                <div className="h-px bg-border/30" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Meta Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.metaDescription}</p>
                  <p className={`text-[10px] mt-1 ${(result.metaDescription?.length ?? 0) > 160 ? 'text-amber-400' : 'text-emerald-400'}`}>{result.metaDescription?.length ?? 0} characters</p>
                </div>
                <div className="h-px bg-border/30" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Keywords Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywordsUsed.map((kw) => (
                      <span key={kw} className="rounded-full bg-violet-500/10 text-violet-400 px-2.5 py-0.5 text-[11px] font-medium">{kw}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outline */}
            {result.outline && result.outline.length > 0 && (
              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-5 pb-5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Article Outline</p>
                  <div className="space-y-1">
                    {result.outline.map((heading, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-medium shrink-0">{i + 1}</span>
                        <span>{heading}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content */}
            <Card className="border-border/40 bg-card/50">
              <CardContent className="pt-5 pb-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Generated Content</p>
                <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border/30 bg-background/30 p-5 whitespace-pre-wrap text-sm leading-relaxed">
                  {result.content}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

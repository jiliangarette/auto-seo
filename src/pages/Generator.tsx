import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { generateSEOContent, type GeneratedContent, type GenerateMode } from '@/lib/content-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Sparkles, Copy, Check, Globe, Swords, FileText, Loader2,
  Eye, Code2, RotateCcw, Download, Lightbulb, Wand2,
} from 'lucide-react';

const modes = [
  {
    id: 'topic' as GenerateMode,
    label: 'From Topic',
    desc: 'Write about any topic with your keywords',
    icon: FileText,
    gradient: 'from-violet-500 to-fuchsia-500',
    bg: 'from-violet-500/15 to-fuchsia-500/15',
    border: 'border-violet-500/30',
    ring: 'ring-violet-500/40',
  },
  {
    id: 'url-audit' as GenerateMode,
    label: 'From Website',
    desc: 'AI analyzes your site and auto-picks keywords',
    icon: Globe,
    gradient: 'from-emerald-500 to-cyan-500',
    bg: 'from-emerald-500/15 to-cyan-500/15',
    border: 'border-emerald-500/30',
    ring: 'ring-emerald-500/40',
  },
  {
    id: 'competitor' as GenerateMode,
    label: 'Beat Competitor',
    desc: 'Outrank a competitor with better content',
    icon: Swords,
    gradient: 'from-orange-500 to-rose-500',
    bg: 'from-orange-500/15 to-rose-500/15',
    border: 'border-orange-500/30',
    ring: 'ring-orange-500/40',
  },
];

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'friendly', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
  { value: 'persuasive', label: 'Persuasive' },
];

const exampleTopics = [
  '10 ways to improve your website loading speed',
  'How to choose the right keywords for your business',
  'Why your small business needs a blog in 2026',
  'The complete guide to local SEO for restaurants',
  'Email marketing tips that actually convert',
  'How to write product descriptions that sell',
  'Social media strategies for e-commerce stores',
  'Understanding Google Analytics for beginners',
];

function ScoreRing({ score }: { score: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const p = (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-white/5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - p} className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">SEO</span>
      </div>
    </div>
  );
}

export default function Generator() {
  const [mode, setMode] = useState<GenerateMode>('url-audit');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [siteUrl, setSiteUrl] = useSiteUrlInput();
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % exampleTopics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'markdown'>('preview');

  const handleGenerate = async () => {
    if (mode === 'topic' && !topic.trim()) { toast.error('Enter a topic'); return; }
    if (mode === 'url-audit' && !siteUrl.trim()) { toast.error('Enter your website URL'); return; }
    if (mode === 'competitor' && !competitorUrl.trim()) { toast.error('Enter competitor URL'); return; }

    setLoading(true);
    setResult(null);
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

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyFullArticle = () => {
    if (!result) return;
    const md = `# ${result.title}\n\n> ${result.metaDescription}\n\n${result.content}`;
    copyToClipboard(md, 'article');
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const md = `# ${result.title}\n\n> ${result.metaDescription}\n\n${result.content}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded as .md');
  };

  const activeMode = modes.find(m => m.id === mode)!;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${activeMode.bg} border ${activeMode.border}`}>
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
                className={`group relative text-left rounded-2xl border p-4 transition-all duration-200 overflow-hidden ${
                  active
                    ? `${m.border} bg-gradient-to-br ${m.bg} ring-2 ${m.ring} shadow-lg`
                    : 'border-border/30 bg-card/30 hover:bg-card/60 hover:border-border/50'
                }`}
              >
                {active && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${m.bg} opacity-50`} />
                )}
                <div className="relative">
                  <div className={`inline-flex items-center justify-center size-9 rounded-xl mb-3 ${
                    active ? `bg-gradient-to-br ${m.gradient} shadow-md` : 'bg-muted/20'
                  }`}>
                    <Icon className={`size-4 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <p className={`text-sm font-semibold ${active ? '' : 'text-muted-foreground'}`}>{m.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
          <CardContent className="pt-5 pb-5 space-y-4">
            {mode === 'topic' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Topic</label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={exampleTopics[placeholderIdx]} className="bg-background/60 border-border/30 h-11" />
                </div>

                {/* Quick topic suggestions */}
                {!topic && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lightbulb className="size-3" />
                      Try one of these:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {exampleTopics.slice(0, 4).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTopic(t)}
                          className="text-[11px] px-3 py-1.5 rounded-full border border-border/30 bg-background/40 text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Keywords <span className="font-normal opacity-60">(optional — AI will pick if left blank)</span></label>
                  <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Leave blank and AI will choose the best keywords" className="bg-background/60 border-border/30 h-11" />
                </div>
              </>
            )}

            {mode === 'url-audit' && (
              <>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2">
                  <Wand2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                    <span className="font-semibold text-emerald-400">One-click mode:</span> Just paste your URL below and hit Generate. AI will visit your site, find what topics you should write about, pick the best keywords, and write the article for you.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Your Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="e.g., mybusiness.com" className="pl-10 bg-background/60 border-border/30 h-11" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Focus Topic <span className="font-normal opacity-60">(optional — AI picks if blank)</span></label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Leave blank — AI will choose the best topic for you" className="bg-background/60 border-border/30 h-11" />
                </div>
              </>
            )}

            {mode === 'competitor' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Competitor URL</label>
                  <div className="relative">
                    <Swords className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} placeholder="e.g., competitor.com/their-blog-post" className="pl-10 bg-background/60 border-border/30 h-11" />
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">AI will analyze their content and write something better to outrank them</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Your Angle <span className="font-normal opacity-60">(optional)</span></label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Leave blank to auto-detect their topic" className="bg-background/60 border-border/30 h-11" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-border/30 bg-background/60 px-3 py-2.5 text-sm">
                  {tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Length</label>
                <select value={length} onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')} className="w-full rounded-xl border border-border/30 bg-background/60 px-3 py-2.5 text-sm">
                  <option value="short">Short (~300 words)</option>
                  <option value="medium">Medium (~600 words)</option>
                  <option value="long">Long (~1200 words)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full h-12 bg-gradient-to-r ${activeMode.gradient} hover:opacity-90 border-0 text-white font-medium text-sm rounded-xl shadow-lg transition-all duration-200`}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading
                ? mode === 'url-audit' ? 'Analyzing site & generating...'
                : mode === 'competitor' ? 'Analyzing competitor & generating...'
                : 'Generating content...'
                : 'Generate Content'
              }
            </Button>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="relative">
              <div className={`size-16 rounded-full bg-gradient-to-br ${activeMode.gradient} opacity-20 animate-ping absolute inset-0`} />
              <div className={`size-16 rounded-full border-2 border-t-violet-400 border-r-fuchsia-400 border-b-transparent border-l-transparent animate-spin flex items-center justify-center`}>
                <Sparkles className="size-6 text-violet-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {mode === 'url-audit' ? 'Fetching your website and finding content gaps...'
                  : mode === 'competitor' ? 'Analyzing competitor content...'
                  : 'Crafting your SEO content...'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">This may take 15-30 seconds</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-4 shadow-lg shadow-black/5">
              <ScoreRing score={result.seoScore} />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Words</p>
                  <p className="text-lg font-bold">{result.wordCount ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Keywords</p>
                  <p className="text-lg font-bold">{result.keywordsUsed.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sections</p>
                  <p className="text-lg font-bold">{result.outline?.length ?? '—'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button variant="outline" size="sm" onClick={copyFullArticle} className="border-border/30 text-xs h-8 gap-1.5">
                  {copied === 'article' ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied === 'article' ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadMarkdown} className="border-border/30 text-xs h-8 gap-1.5">
                  <Download className="size-3" />
                  .md
                </Button>
              </div>
            </div>

            {/* Title & Meta */}
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title Tag</p>
                    <button onClick={() => copyToClipboard(result.title, 'title')} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied === 'title' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{result.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${(result.title?.length ?? 0) <= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, ((result.title?.length ?? 0) / 70) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${(result.title?.length ?? 0) <= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.title?.length ?? 0}/60
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Meta Description</p>
                    <button onClick={() => copyToClipboard(result.metaDescription, 'meta')} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied === 'meta' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.metaDescription}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${(result.metaDescription?.length ?? 0) <= 160 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, ((result.metaDescription?.length ?? 0) / 180) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${(result.metaDescription?.length ?? 0) <= 160 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.metaDescription?.length ?? 0}/160
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5">
              {result.keywordsUsed.map((kw) => (
                <span key={kw} className={`rounded-full bg-gradient-to-r ${activeMode.bg} border ${activeMode.border} px-3 py-1 text-[11px] font-medium`}>{kw}</span>
              ))}
            </div>

            {/* Content - the main article */}
            <Card className="border-border/30 bg-card/40 shadow-xl shadow-black/5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/20 px-5 py-3">
                <p className="text-xs font-medium text-muted-foreground">Generated Article</p>
                <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${viewMode === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Eye className="size-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('markdown')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${viewMode === 'markdown' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Code2 className="size-3" />
                    Markdown
                  </button>
                </div>
              </div>
              <CardContent className="pt-6 pb-6 px-6 md:px-8">
                {viewMode === 'preview' ? (
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-headings:font-semibold prose-headings:tracking-tight
                    prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border/20 prose-h2:pb-2
                    prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                    prose-p:leading-relaxed prose-p:text-foreground/80
                    prose-li:text-foreground/80
                    prose-strong:text-foreground
                    prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-violet-500/40 prose-blockquote:bg-violet-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                    prose-code:bg-muted/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px]
                    prose-pre:bg-muted/20 prose-pre:border prose-pre:border-border/20 prose-pre:rounded-xl
                  ">
                    <ReactMarkdown>{result.content}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-sm leading-relaxed text-foreground/70 whitespace-pre-wrap font-mono bg-muted/10 rounded-xl p-5 border border-border/20 overflow-x-auto">
                    {result.content}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Regenerate */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loading}
                className="border-border/30 gap-2 h-10 px-6 rounded-xl"
              >
                <RotateCcw className="size-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

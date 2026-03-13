import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSiteContext } from '@/contexts/SiteContext';
import { runOneClick, type OneClickResult, type OneClickStage } from '@/lib/one-click-engine';
import {
  Rocket, Globe, Shield, Search, CalendarDays, Sparkles,
  CheckCircle2, Loader2, ArrowRight, AlertCircle, Copy, Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const STAGES: { key: OneClickStage; label: string; icon: typeof Shield }[] = [
  { key: 'fetching', label: 'Fetching Website', icon: Globe },
  { key: 'auditing', label: 'SEO Audit', icon: Shield },
  { key: 'keywords', label: 'Finding Keywords', icon: Search },
  { key: 'calendar', label: '30-Day Calendar', icon: CalendarDays },
  { key: 'writing', label: 'Writing Article', icon: Sparkles },
];

const STAGE_ORDER = STAGES.map(s => s.key);

type ResultTab = 'audit' | 'keywords' | 'calendar' | 'article';

export default function OneClickMode() {
  const navigate = useNavigate();
  const { siteUrl, setSiteUrl } = useSiteContext();
  const [url, setUrl] = useState(siteUrl || '');
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<OneClickStage | null>(null);
  const [stageMessage, setStageMessage] = useState('');
  const [result, setResult] = useState<OneClickResult | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('audit');
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    if (!url.trim() || running) return;
    setSiteUrl(url.trim());
    setRunning(true);
    setResult(null);
    setCurrentStage('fetching');

    const output = await runOneClick(url.trim(), (stage, message) => {
      setCurrentStage(stage);
      setStageMessage(message);
    });

    setResult(output);
    setRunning(false);
    if (output.audit) setActiveTab('audit');
  };

  const stageIndex = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { key: ResultTab; label: string; available: boolean }[] = [
    { key: 'audit', label: 'Audit Summary', available: !!result?.audit },
    { key: 'keywords', label: `Keywords (${result?.keywords.length ?? 0})`, available: (result?.keywords.length ?? 0) > 0 },
    { key: 'calendar', label: '30-Day Calendar', available: (result?.calendar.length ?? 0) > 0 },
    { key: 'article', label: 'Generated Article', available: !!result?.article },
  ];

  const scoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const difficultyColor = (d: string) => d === 'low' ? 'text-emerald-400 bg-emerald-500/10' : d === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';
  const priorityColor = (p: string) => p === 'high' ? 'text-rose-400 bg-rose-500/10' : p === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-sky-400 bg-sky-500/10';
  const typeColor = (t: string) => {
    const map: Record<string, string> = { blog: 'bg-violet-500/10 text-violet-400', guide: 'bg-emerald-500/10 text-emerald-400', listicle: 'bg-amber-500/10 text-amber-400', comparison: 'bg-blue-500/10 text-blue-400', 'case-study': 'bg-pink-500/10 text-pink-400' };
    return map[t] ?? 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
            <Rocket className="size-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">One-Click SEO</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Paste your URL. We audit it, find keywords, plan a 30-day calendar, and write your first article — all automatically.
          </p>
        </div>

        {/* URL Input */}
        <Card className="border-border/30 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5 shadow-xl shadow-black/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                  placeholder="e.g., mybusiness.com"
                  className="pl-10 bg-background/60 border-border/30 h-12 text-base"
                  disabled={running}
                />
              </div>
              <Button
                onClick={handleRun}
                disabled={running || !url.trim()}
                className="h-12 px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white text-base font-semibold rounded-xl"
              >
                {running ? <Loader2 className="size-5 animate-spin" /> : <Rocket className="size-5" />}
                {running ? 'Running...' : 'Go'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Stepper */}
        {(running || result) && (
          <div className="flex items-center justify-between px-2">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.key;
              const isDone = stageIndex > i || currentStage === 'done';
              const hasError = currentStage === 'error' && stageIndex === i;

              return (
                <div key={stage.key} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 ${isActive ? 'text-violet-400' : isDone ? 'text-emerald-400' : hasError ? 'text-red-400' : 'text-muted-foreground/40'}`}>
                    <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive ? 'border-violet-500 bg-violet-500/10' : isDone ? 'border-emerald-500 bg-emerald-500/10' : hasError ? 'border-red-500 bg-red-500/10' : 'border-border/30 bg-muted/20'
                    }`}>
                      {isDone ? <CheckCircle2 className="size-4" /> : isActive ? <Loader2 className="size-4 animate-spin" /> : hasError ? <AlertCircle className="size-4" /> : <Icon className="size-4" />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{stage.label}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${isDone ? 'bg-emerald-500/30' : 'bg-border/20'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {running && stageMessage && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">{stageMessage}</p>
        )}

        {/* Errors */}
        {result && result.errors.length > 0 && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="size-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Some steps had issues</span>
              </div>
              <ul className="space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-400/70">{err}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !running && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border/30 pb-px overflow-x-auto">
              {tabs.filter(t => t.available).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Audit Tab */}
            {activeTab === 'audit' && result.audit && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Card className="border-border/30 bg-card/40">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
                      <p className={`text-3xl font-bold ${scoreColor(result.audit.summary.score)}`}>{result.audit.summary.score}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical</p>
                      <p className="text-3xl font-bold text-red-400">{result.audit.summary.critical}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Warnings</p>
                      <p className="text-3xl font-bold text-amber-400">{result.audit.summary.warning}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-sky-500/20 bg-sky-500/5">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Info</p>
                      <p className="text-3xl font-bold text-sky-400">{result.audit.summary.info}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-2">
                  {result.audit.issues.slice(0, 8).map((issue, i) => (
                    <div key={i} className={`rounded-lg border p-3 ${
                      issue.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' :
                      issue.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                      'border-sky-500/20 bg-sky-500/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                          issue.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                          issue.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-sky-500/10 text-sky-400'
                        }`}>{issue.severity}</span>
                        <span className="text-sm font-medium">{issue.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{issue.recommendation}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="border-border/30" onClick={() => navigate(`/audit?url=${encodeURIComponent(url)}`)}>
                  View Full Audit <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}

            {/* Keywords Tab */}
            {activeTab === 'keywords' && result.keywords.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.keywords.map((kw, i) => (
                    <Card key={i} className="border-border/30 bg-card/40">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{kw.keyword}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{kw.opportunity}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</span>
                            <span className="text-[9px] text-muted-foreground">{kw.searchIntent}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="border-border/30" onClick={() => navigate('/keyword-research')}>
                  Deep Keyword Research <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && result.calendar.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  {result.calendar.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/40 p-3">
                      <div className="size-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">D{entry.day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.title}</p>
                        <p className="text-[10px] text-muted-foreground">Keyword: {entry.keyword}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${typeColor(entry.type)}`}>{entry.type}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${priorityColor(entry.priority)}`}>{entry.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="border-border/30" onClick={() => navigate('/calendar')}>
                  Full Content Calendar <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}

            {/* Article Tab */}
            {activeTab === 'article' && result.article && (
              <div className="space-y-4">
                <Card className="border-border/30 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{result.article.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{result.article.metaDescription}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px]">
                      <span className={`font-medium ${scoreColor(result.article.seoScore)}`}>SEO Score: {result.article.seoScore}/100</span>
                      <span className="text-muted-foreground">{result.article.wordCount} words</span>
                      <span className="text-muted-foreground">{result.article.keywordsUsed.length} keywords</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border/30 h-7 text-xs"
                        onClick={() => handleCopy(result.article!.content)}
                      >
                        {copied ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                        {copied ? 'Copied!' : 'Copy Article'}
                      </Button>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-sm [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-foreground">
                      <ReactMarkdown>{result.article.content}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
                <Button variant="outline" size="sm" className="border-border/30" onClick={() => navigate('/generator')}>
                  Generate More Content <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { auditSite, type SiteAuditResult } from '@/lib/site-auditor';
import { useSaveAudit } from '@/hooks/useAudits';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Shield, AlertTriangle, AlertCircle, Info, Save, Globe,
  FileText, Image, Clock, Code2, Search, Loader2, Check, X,
  ExternalLink, Hash, Link2, Eye,
} from 'lucide-react';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { BorderBeam } from '@/components/ui/border-beam';

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20', badge: 'bg-red-500/15 text-red-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500/15 text-amber-400' },
  info: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/5', border: 'border-sky-500/20', badge: 'bg-sky-500/15 text-sky-400' },
} as const;

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
      {ok ? <Check className="size-3" /> : <X className="size-3" />}
      {label}
    </div>
  );
}

const scanSteps = [
  'Connecting to server...',
  'Checking SSL certificate...',
  'Downloading HTML...',
  'Parsing meta tags...',
  'Scanning headings & structure...',
  'Checking images & alt text...',
  'Counting links...',
  'Looking for structured data...',
  'Checking sitemap.xml...',
  'Running AI analysis...',
];

export default function SiteAudit() {
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('project') ?? '';
  const { data: projects } = useProjects();
  const saveAudit = useSaveAudit();

  const urlParam = searchParams.get('url') ?? '';
  const [url, setUrl] = useSiteUrlInput();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlParam && !url) setUrl(urlParam);
  }, [urlParam]); // eslint-disable-line react-hooks/exhaustive-deps
  const [result, setResult] = useState<SiteAuditResult | null>(null);
  const [selectedProject, setSelectedProject] = useState(preselectedProject);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [scanStep, setScanStep] = useState(0);
  const [showRawData, setShowRawData] = useState(false);

  const handleAudit = async () => {
    if (!url.trim()) { toast.error('Enter a URL to audit'); return; }
    setLoading(true);
    setScanStep(0);

    // Animate through scan steps
    const interval = setInterval(() => {
      setScanStep(prev => {
        if (prev < scanSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const audit = await auditSite(url.trim());
      setResult(audit);
      toast.success(`Audit complete — score: ${audit.summary.score}/100`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed — check the URL and try again');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedProject) { toast.error('Select a project to save to'); return; }
    try {
      await saveAudit.mutateAsync({
        projectId: selectedProject, url,
        issuesCount: result.issues.length,
        criticalCount: result.summary.critical,
        warningCount: result.summary.warning,
        infoCount: result.summary.info,
        report: { issues: result.issues, siteData: result.siteData } as unknown as Record<string, unknown>,
      });
      toast.success('Audit saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const filtered = result?.issues.filter((i) => filter === 'all' || i.severity === filter) ?? [];
  const d = result?.siteData;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/20">
            <Shield className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Site Audit</h1>
            <p className="text-xs text-muted-foreground">Live technical SEO analysis — fetches and scans your actual website</p>
          </div>
        </div>

        {/* URL Input */}
        <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Enter URL to audit (e.g., example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                  className="pl-9 bg-background/60 border-border/30 h-11"
                />
              </div>
              <Button onClick={handleAudit} disabled={loading} className="h-11 px-6 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 border-0 text-white rounded-xl">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {loading ? 'Scanning...' : 'Run Audit'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading with live scan steps */}
        {loading && (
          <>
            <Card className="border-border/30 bg-card/40">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center gap-5">
                  <div className="relative">
                    <div className="size-16 rounded-full border-2 border-emerald-500/20 animate-ping absolute inset-0" />
                    <div className="size-16 rounded-full border-2 border-t-emerald-400 border-r-sky-400 border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                      <Shield className="size-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    {scanSteps.map((step, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${i < scanStep ? 'text-emerald-400' : i === scanStep ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                        {i < scanStep ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : i === scanStep ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <div className="size-3.5 rounded-full border border-muted-foreground/20" />
                        )}
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skeleton placeholders while loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {result && d && (
          <>
            {/* Score + Quick Stats */}
            <div className="grid gap-4 md:grid-cols-[auto_1fr]">
              <div className="relative overflow-hidden rounded-xl">
                <Card className="border-border/30 bg-card/40">
                  <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 px-8">
                    <ScoreRing score={result.summary.score} />
                    <p className="text-xs text-muted-foreground mt-2">SEO Score</p>
                  </CardContent>
                </Card>
                <BorderBeam />
              </div>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Card className="border-red-500/15 bg-red-500/5">
                  <CardContent className="flex items-center gap-3 pt-4 pb-4 px-4">
                    <AlertCircle className="size-5 text-red-400 shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-red-400">{result.summary.critical}</p>
                      <p className="text-[10px] text-muted-foreground">Critical</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/15 bg-amber-500/5">
                  <CardContent className="flex items-center gap-3 pt-4 pb-4 px-4">
                    <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-amber-400">{result.summary.warning}</p>
                      <p className="text-[10px] text-muted-foreground">Warnings</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-sky-500/15 bg-sky-500/5">
                  <CardContent className="flex items-center gap-3 pt-4 pb-4 px-4">
                    <Info className="size-5 text-sky-400 shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-sky-400">{result.summary.info}</p>
                      <p className="text-[10px] text-muted-foreground">Info</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/30 bg-card/40">
                  <CardContent className="flex items-center gap-3 pt-4 pb-4 px-4">
                    <Clock className="size-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xl font-bold">{d.loadTimeMs}<span className="text-xs font-normal text-muted-foreground">ms</span></p>
                      <p className="text-[10px] text-muted-foreground">Load Time</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SERP Preview — how site appears in Google */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="size-4 text-muted-foreground" />
                  Google Search Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/20 bg-white dark:bg-[#202124] p-5 max-w-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Globe className="size-3 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#4d5156] dark:text-[#bdc1c6]">{d.finalUrl}</p>
                    </div>
                  </div>
                  <p className="text-lg text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug">
                    {d.title || '(No title tag found)'}
                  </p>
                  <p className="text-[13px] text-[#4d5156] dark:text-[#bdc1c6] mt-1 leading-relaxed">
                    {d.metaDescription || '(No meta description found — Google will auto-generate one from your page content)'}
                  </p>
                </div>
                <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span>Title: <span className={d.title.length > 0 && d.title.length <= 60 ? 'text-emerald-400' : 'text-amber-400'}>{d.title.length} chars</span></span>
                  <span>Description: <span className={d.metaDescription.length > 0 && d.metaDescription.length <= 160 ? 'text-emerald-400' : 'text-amber-400'}>{d.metaDescription.length} chars</span></span>
                </div>
              </CardContent>
            </Card>

            {/* What We Scanned — PROOF section */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Search className="size-4 text-emerald-400" />
                    What We Found on Your Site
                    <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Real Data</span>
                  </CardTitle>
                  <a href={d.finalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="size-3" />
                    Visit Site
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <StatusBadge ok={d.isHttps} label="HTTPS" />
                  <StatusBadge ok={!!d.title} label="Title Tag" />
                  <StatusBadge ok={!!d.metaDescription} label="Meta Description" />
                  <StatusBadge ok={d.hasViewport} label="Viewport" />
                  <StatusBadge ok={d.hasCanonical} label="Canonical" />
                  <StatusBadge ok={d.hasOgTags} label="Open Graph" />
                  <StatusBadge ok={d.hasTwitterCards} label="Twitter Cards" />
                  <StatusBadge ok={d.hasStructuredData} label="Schema" />
                  <StatusBadge ok={d.hasSitemap} label="Sitemap" />
                  <StatusBadge ok={d.hasCharset} label="Charset" />
                </div>

                {/* Extracted evidence */}
                <div className="space-y-3">
                  {/* Title tag evidence */}
                  <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Hash className="size-3 text-blue-400" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title Tag Found</span>
                    </div>
                    <code className="text-xs text-blue-400 bg-blue-500/5 px-2 py-1 rounded block">
                      &lt;title&gt;{d.title || '(empty)'}&lt;/title&gt;
                    </code>
                  </div>

                  {/* Meta description evidence */}
                  <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="size-3 text-violet-400" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Meta Description Found</span>
                    </div>
                    <code className="text-xs text-violet-400 bg-violet-500/5 px-2 py-1 rounded block break-all">
                      &lt;meta name=&quot;description&quot; content=&quot;{d.metaDescription || '(not found)'}&quot;&gt;
                    </code>
                  </div>

                  {/* Headings evidence */}
                  {d.h1Tags.length > 0 && (
                    <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Hash className="size-3 text-emerald-400" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">H1 Tags Found ({d.h1Tags.length})</span>
                      </div>
                      <div className="space-y-1">
                        {d.h1Tags.map((h, i) => (
                          <code key={i} className="text-xs text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded block">
                            &lt;h1&gt;{h}&lt;/h1&gt;
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Canonical evidence */}
                  {d.hasCanonical && (
                    <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link2 className="size-3 text-amber-400" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Canonical URL</span>
                      </div>
                      <code className="text-xs text-amber-400 bg-amber-500/5 px-2 py-1 rounded block break-all">
                        &lt;link rel=&quot;canonical&quot; href=&quot;{d.canonicalUrl}&quot;&gt;
                      </code>
                    </div>
                  )}

                  {/* Schema types */}
                  {d.structuredDataTypes.length > 0 && (
                    <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Code2 className="size-3 text-orange-400" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Structured Data (JSON-LD)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {d.structuredDataTypes.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Data grid */}
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Content</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Word count</span><span className="font-medium">{d.wordCount.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">H1 tags</span><span className="font-medium">{d.h1Tags.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">H2 tags</span><span className="font-medium">{d.h2Tags.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">H3 tags</span><span className="font-medium">{d.h3Tags.length}</span></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Media & Links</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Images</span><span className="font-medium">{d.imageCount}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Missing alt</span><span className={`font-medium ${d.imagesWithoutAlt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{d.imagesWithoutAlt}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Internal links</span><span className="font-medium">{d.internalLinks}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">External links</span><span className="font-medium">{d.externalLinks}</span></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/20 p-3 bg-background/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Technical</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">HTML size</span><span className="font-medium">{(d.htmlSize / 1024).toFixed(1)} KB</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">CSS files</span><span className="font-medium">{d.cssLinks}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">JS scripts</span><span className="font-medium">{d.jsScripts}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Inline styles</span><span className={`font-medium ${d.inlineStyles > 10 ? 'text-amber-400' : ''}`}>{d.inlineStyles}</span></div>
                    </div>
                  </div>
                </div>

                {/* Toggle raw data */}
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Code2 className="size-3" />
                  {showRawData ? 'Hide' : 'Show'} raw scan data
                </button>
                {showRawData && (
                  <pre className="text-[10px] text-muted-foreground bg-muted/10 rounded-lg p-4 border border-border/20 overflow-x-auto max-h-[400px] overflow-y-auto font-mono">
                    {JSON.stringify(d, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Issues */}
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Issues ({filtered.length})</CardTitle>
                  <div className="flex gap-1">
                    {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                      >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((issue, i) => {
                    const cfg = severityConfig[issue.severity];
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className={`rounded-lg border p-3 ${cfg.border} ${cfg.bg} transition-colors h-full flex flex-col`}>
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className={`mt-0.5 size-4 shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm">{issue.title}</h4>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>
                                {issue.category}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
                            <div className="flex items-start gap-1.5 pt-0.5">
                              <span className="text-[10px] font-medium text-emerald-400 shrink-0 mt-0.5">FIX</span>
                              <p className="text-xs text-foreground/70">{issue.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <Card className="border-border/30 bg-card/40">
              <CardContent className="flex items-center gap-3 pt-5 pb-5">
                <select
                  className="flex-1 rounded-xl border border-border/30 bg-background/60 px-3 py-2.5 text-sm"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Select project to save audit...</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Button onClick={handleSave} disabled={!selectedProject || saveAudit.isPending} variant="outline" className="border-border/30 rounded-xl">
                  <Save className="size-4" />
                  {saveAudit.isPending ? 'Saving...' : 'Save Audit'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { useBackgroundRun } from '@/hooks/useBackgroundRun';
import { analyzeSEO, type SEOAnalysisResult } from '@/lib/seo-analyzer';
import { useSaveAnalysis } from '@/hooks/useAnalyses';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Save, ClipboardPaste, Globe } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import InlineLoader from '@/components/InlineLoader';

export default function Analyzer() {
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('project') ?? '';

  const { data: projects } = useProjects();
  const saveAnalysis = useSaveAnalysis();

  const [url, setUrl] = useSiteUrlInput();
  const [htmlContent, setHtmlContent] = useState('');
  const [mode, setMode] = useState<'url' | 'paste'>('url');
  const bg = useBackgroundRun<SEOAnalysisResult>('Analyzing SEO');
  const loading = bg.running;
  const result = bg.result;
  const [selectedProject, setSelectedProject] = useState(preselectedProject);

  bg.onDone((analysis) => toast.success(`Analysis complete — Score: ${analysis.score}/100`));
  bg.onError((err) => toast.error(err));

  const handleAnalyze = () => {
    const content = mode === 'paste' ? htmlContent : '';

    if (mode === 'url' && !url.trim()) {
      toast.error('Enter a URL to analyze');
      return;
    }
    if (mode === 'paste' && !htmlContent.trim()) {
      toast.error('Paste HTML content to analyze');
      return;
    }

    const inputUrl = url;
    const inputMode = mode;
    bg.run(async () => {
      return await analyzeSEO(
        inputMode === 'paste' ? content : `URL to analyze: ${inputUrl}. Note: I cannot fetch the URL directly. Please analyze based on the URL structure and common SEO practices for this domain.`,
        inputMode === 'url' ? inputUrl : 'pasted-content',
      );
    });
  };

  const handleSave = async () => {
    if (!result || !selectedProject) {
      toast.error('Select a project to save to');
      return;
    }

    try {
      await saveAnalysis.mutateAsync({
        projectId: selectedProject,
        url: url || 'pasted-content',
        score: result.score,
        suggestions: result.suggestions as unknown as Record<string, unknown>,
        rawResponse: result as unknown as Record<string, unknown>,
      });
      toast.success('Analysis saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Analyzer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analyze content for SEO optimization</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader>
            <CardTitle className="text-sm">Input</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={mode === 'url' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMode('url')}
              >
                <Search className="size-4" />
                URL
              </Button>
              <Button
                variant={mode === 'paste' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMode('paste')}
              >
                <ClipboardPaste className="size-4" />
                Paste HTML
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'url' ? (
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., mybusiness.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="pl-10 bg-background/60 border-border/30 h-11"
                />
              </div>
            ) : (
              <textarea
                className="w-full rounded-lg border border-border/30 bg-background/60 px-3 py-2 text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Paste HTML content here..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
              />
            )}
            <Button onClick={handleAnalyze} disabled={loading} className="w-full h-11 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 border-0 text-white rounded-xl">
              {loading ? <InlineLoader size={16} className="text-white mr-2" /> : <Search className="size-4 mr-2" />}
              {loading ? 'Analyzing...' : 'Analyze SEO'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-border/30 bg-card/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Results</CardTitle>
                    <CardDescription className="text-xs">SEO Analysis Score</CardDescription>
                  </div>
                  <NumberTicker value={result.score} className={`text-4xl font-bold ${scoreColor(result.score)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(result.suggestions).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-3 rounded-lg border border-border/20 bg-muted/10 p-3">
                      <span className={`text-lg font-bold ${scoreColor(val.score)}`}>
                        {val.score}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{val.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6">
                <select
                  className="flex-1 rounded-lg border border-border/30 bg-background/60 px-3 py-2 text-sm h-10"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Select project to save to...</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Button onClick={handleSave} disabled={!selectedProject || saveAnalysis.isPending} className="h-10">
                  <Save className="size-4" />
                  {saveAnalysis.isPending ? 'Saving...' : 'Save Analysis'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

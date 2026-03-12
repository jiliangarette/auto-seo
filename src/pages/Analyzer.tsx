import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzeSEO, type SEOAnalysisResult } from '@/lib/seo-analyzer';
import { useSaveAnalysis } from '@/hooks/useAnalyses';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Save, ClipboardPaste } from 'lucide-react';

export default function Analyzer() {
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('project') ?? '';

  const { data: projects } = useProjects();
  const saveAnalysis = useSaveAnalysis();

  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [mode, setMode] = useState<'url' | 'paste'>('url');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOAnalysisResult | null>(null);
  const [selectedProject, setSelectedProject] = useState(preselectedProject);

  const handleAnalyze = async () => {
    const content = mode === 'paste' ? htmlContent : '';

    if (mode === 'url' && !url.trim()) {
      toast.error('Enter a URL to analyze');
      return;
    }
    if (mode === 'paste' && !htmlContent.trim()) {
      toast.error('Paste HTML content to analyze');
      return;
    }

    setLoading(true);
    try {
      const analysis = await analyzeSEO(
        mode === 'paste' ? content : `URL to analyze: ${url}. Note: I cannot fetch the URL directly. Please analyze based on the URL structure and common SEO practices for this domain.`,
        mode === 'url' ? url : 'pasted-content',
      );
      setResult(analysis);
      toast.success(`Analysis complete — Score: ${analysis.score}/100`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Analyzer</h1>
          <p className="text-muted-foreground">Analyze content for SEO optimization</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
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
              <Input
                placeholder="https://example.com/page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            ) : (
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Paste HTML content here..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
              />
            )}
            <Button onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading ? 'Analyzing...' : 'Analyze SEO'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Results</CardTitle>
                    <CardDescription>SEO Analysis Score</CardDescription>
                  </div>
                  <span className={`text-4xl font-bold ${scoreColor(result.score)}`}>
                    {result.score}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(result.suggestions).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-4 border-b border-border/50 pb-3 last:border-0">
                    <span className={`text-lg font-bold ${scoreColor(val.score)}`}>
                      {val.score}
                    </span>
                    <div>
                      <h4 className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-muted-foreground">{val.feedback}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <select
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <Button onClick={handleSave} disabled={!selectedProject || saveAnalysis.isPending}>
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

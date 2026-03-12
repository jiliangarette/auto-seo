import { useState } from 'react';
import { useCompetitors, useAddCompetitor, useDeleteCompetitor, useSaveCompetitorAnalysis } from '@/hooks/useCompetitors';
import { analyzeCompetitor } from '@/lib/competitor-analyzer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function CompetitorSection({ projectId, projectUrl }: { projectId: string; projectUrl: string | null }) {
  const { data: competitors, isLoading } = useCompetitors(projectId);
  const addCompetitor = useAddCompetitor();
  const deleteCompetitor = useDeleteCompetitor();
  const saveAnalysis = useSaveCompetitorAnalysis();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { strengths: string[]; weaknesses: string[]; opportunities: string[]; score: number }>>({});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      await addCompetitor.mutateAsync({ projectId, name: name.trim(), url: url.trim() });
      toast.success('Competitor added');
      setName('');
      setUrl('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add competitor');
    }
  };

  const handleAnalyze = async (competitor: { id: string; url: string; name: string }) => {
    if (!projectUrl) {
      toast.error('Set a project URL first to compare against');
      return;
    }

    setAnalyzing(competitor.id);
    try {
      const result = await analyzeCompetitor(projectUrl, competitor.url, competitor.name);

      await saveAnalysis.mutateAsync({
        competitorId: competitor.id,
        projectId,
        comparison: result.comparison as unknown as Record<string, unknown>,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        opportunities: result.opportunities,
        score: result.score,
      });

      setResults((prev) => ({
        ...prev,
        [competitor.id]: {
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          opportunities: result.opportunities,
          score: result.score,
        },
      }));

      toast.success(`Analysis complete — Score: ${result.score}/100`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Competitors</CardTitle>
            <CardDescription>Track and analyze competitors</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Competitor name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              placeholder="https://competitor.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Button type="submit" size="sm" disabled={addCompetitor.isPending}>
              Add
            </Button>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !competitors?.length ? (
          <p className="text-sm text-muted-foreground">No competitors tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {competitors.map((comp) => (
              <div key={comp.id} className="space-y-2">
                <div className="flex items-center justify-between rounded-md border border-border/50 p-3">
                  <div className="flex-1">
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-sm text-muted-foreground">{comp.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {results[comp.id] && (
                      <span className={`text-lg font-bold ${scoreColor(results[comp.id].score)}`}>
                        {results[comp.id].score}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyze(comp)}
                      disabled={analyzing === comp.id}
                    >
                      <Search className="size-4" />
                      {analyzing === comp.id ? 'Analyzing...' : 'Analyze'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteCompetitor.mutate({ id: comp.id, projectId })}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                {results[comp.id] && (
                  <div className="ml-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-green-900/30 bg-green-950/20 p-3">
                      <h4 className="mb-1 text-xs font-semibold text-green-400">YOUR STRENGTHS</h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {results[comp.id].strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-red-900/30 bg-red-950/20 p-3">
                      <h4 className="mb-1 text-xs font-semibold text-red-400">WEAKNESSES</h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {results[comp.id].weaknesses.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-blue-900/30 bg-blue-950/20 p-3">
                      <h4 className="mb-1 text-xs font-semibold text-blue-400">OPPORTUNITIES</h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {results[comp.id].opportunities.map((o, i) => (
                          <li key={i}>• {o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

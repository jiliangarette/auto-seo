import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auditSite, type SiteAuditResult } from '@/lib/site-auditor';
import { useSaveAudit } from '@/hooks/useAudits';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, AlertTriangle, AlertCircle, Info, Save } from 'lucide-react';

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-900/30' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-950/20', border: 'border-yellow-900/30' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/20', border: 'border-blue-900/30' },
} as const;

export default function SiteAudit() {
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('project') ?? '';

  const { data: projects } = useProjects();
  const saveAudit = useSaveAudit();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiteAuditResult | null>(null);
  const [selectedProject, setSelectedProject] = useState(preselectedProject);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const handleAudit = async () => {
    if (!url.trim()) {
      toast.error('Enter a URL to audit');
      return;
    }

    setLoading(true);
    try {
      const audit = await auditSite(url.trim());
      setResult(audit);
      toast.success(`Audit complete — ${audit.summary.critical} critical, ${audit.summary.warning} warnings`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed');
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
      await saveAudit.mutateAsync({
        projectId: selectedProject,
        url,
        issuesCount: result.issues.length,
        criticalCount: result.summary.critical,
        warningCount: result.summary.warning,
        infoCount: result.summary.info,
        report: { issues: result.issues } as unknown as Record<string, unknown>,
      });
      toast.success('Audit saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const filtered = result?.issues.filter((i) => filter === 'all' || i.severity === filter) ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="size-6" />
            Site Audit
          </h1>
          <p className="text-muted-foreground">Comprehensive technical SEO audit</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAudit} disabled={loading}>
                {loading ? 'Auditing...' : 'Run Audit'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-red-900/30">
                <CardContent className="flex items-center gap-3 pt-6">
                  <AlertCircle className="size-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-red-400">{result.summary.critical}</p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-900/30">
                <CardContent className="flex items-center gap-3 pt-6">
                  <AlertTriangle className="size-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{result.summary.warning}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-900/30">
                <CardContent className="flex items-center gap-3 pt-6">
                  <Info className="size-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{result.summary.info}</p>
                    <p className="text-xs text-muted-foreground">Info</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Issues ({filtered.length})</CardTitle>
                  <div className="flex gap-1">
                    {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
                      <Button
                        key={f}
                        variant={filter === f ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter(f)}
                      >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filtered.map((issue, i) => {
                  const cfg = severityConfig[issue.severity];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`rounded-md border p-3 ${cfg.border} ${cfg.bg}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 size-4 shrink-0 ${cfg.color}`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{issue.title}</h4>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {issue.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                          <p className="text-xs text-foreground/80">Fix: {issue.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                <Button onClick={handleSave} disabled={!selectedProject || saveAudit.isPending}>
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

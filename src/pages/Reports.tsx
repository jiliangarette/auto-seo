import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useKeywords } from '@/hooks/useKeywords';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useReports, useSaveReport, useToggleReportPublic, useDeleteReport } from '@/hooks/useReports';
import { useAuth } from '@/contexts/AuthContext';
import { generateProjectReport, exportKeywordsCsv, exportAnalysesCsv } from '@/lib/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Share2, Trash2, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState('');

  const { data: keywords } = useKeywords(selectedProject);
  const { data: analyses } = useAnalyses(selectedProject);
  const { data: reports } = useReports(selectedProject);
  const saveReport = useSaveReport();
  const togglePublic = useToggleReportPublic();
  const deleteReport = useDeleteReport();

  const project = projects?.find((p) => p.id === selectedProject);

  const handleGenerate = async () => {
    if (!project || !user) return;
    const html = generateProjectReport({
      project,
      keywords: keywords ?? [],
      analyses: analyses ?? [],
    });

    try {
      await saveReport.mutateAsync({
        projectId: project.id,
        userId: user.id,
        title: `SEO Report — ${project.name}`,
        htmlContent: html,
      });
      toast.success('Report generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
    }
  };

  const handleExportKeywords = () => {
    if (!keywords?.length) return toast.error('No keywords to export');
    downloadBlob(exportKeywordsCsv(keywords), 'keywords.csv', 'text/csv');
    toast.success('Keywords exported');
  };

  const handleExportAnalyses = () => {
    if (!analyses?.length) return toast.error('No analyses to export');
    downloadBlob(exportAnalysesCsv(analyses), 'analyses.csv', 'text/csv');
    toast.success('Analyses exported');
  };

  const handleViewReport = (html: string) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleCopyShareLink = (token: string) => {
    const url = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="size-6" />
              Reports & Export
            </h1>
            <p className="text-muted-foreground">Generate reports and export data</p>
          </div>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Select project...</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleGenerate} disabled={saveReport.isPending}>
                  <FileText className="size-4" />
                  Generate SEO Report
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportKeywords}>
                  <Download className="size-4" />
                  Export Keywords CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportAnalyses}>
                  <Download className="size-4" />
                  Export Analyses CSV
                </Button>
              </CardContent>
            </Card>

            {reports && reports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Saved Reports ({reports.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between rounded-md border border-border/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleString()}
                          {report.is_public && (
                            <span className="ml-2 text-green-500">Public</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report.html_content)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            togglePublic.mutate({
                              id: report.id,
                              projectId: selectedProject,
                              isPublic: !report.is_public,
                            })
                          }
                          title={report.is_public ? 'Make private' : 'Make public'}
                        >
                          {report.is_public ? (
                            <Globe className="size-3 text-green-500" />
                          ) : (
                            <Lock className="size-3" />
                          )}
                        </Button>
                        {report.is_public && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleCopyShareLink(report.share_token)}
                            title="Copy share link"
                          >
                            <Share2 className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            deleteReport.mutate({ id: report.id, projectId: selectedProject })
                          }
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

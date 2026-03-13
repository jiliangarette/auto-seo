import { useState, useRef } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useKeywords, useAddKeyword } from '@/hooks/useKeywords';
import { useContentItems, useCreateContentItem } from '@/hooks/useContentItems';
import { useBacklinks, useAddBacklink } from '@/hooks/useBacklinks';
import { parseCsv, downloadCsv, downloadZip } from '@/lib/csv-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Download, FileUp, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkOperations() {
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState('');
  const { data: keywords } = useKeywords(selectedProject);
  const { data: contentItems } = useContentItems(selectedProject);
  const { data: backlinks } = useBacklinks(selectedProject);
  const addKeyword = useAddKeyword();
  const createContentItem = useCreateContentItem();
  const addBacklink = useAddBacklink();

  const [importing, setImporting] = useState(false);
  const keywordFileRef = useRef<HTMLInputElement>(null);
  const contentFileRef = useRef<HTMLInputElement>(null);
  const backlinkFileRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (
    file: File,
    type: 'keywords' | 'content' | 'backlinks'
  ) => {
    if (!selectedProject) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      let count = 0;

      if (type === 'keywords') {
        for (const row of rows) {
          const kw = row.keyword || row.Keyword || row.name || '';
          if (!kw) continue;
          await addKeyword.mutateAsync({
            projectId: selectedProject,
            keyword: kw,
            position: row.position ? parseInt(row.position) : undefined,
            searchVolume: row.search_volume || row.volume ? parseInt(row.search_volume || row.volume) : undefined,
          });
          count++;
        }
      } else if (type === 'content') {
        for (const row of rows) {
          const title = row.title || row.Title || '';
          if (!title) continue;
          await createContentItem.mutateAsync({
            projectId: selectedProject,
            title,
            topic: row.topic || row.Topic || undefined,
            keywords: row.keywords || row.Keywords || undefined,
            scheduledDate: row.scheduled_date || row.date || undefined,
          });
          count++;
        }
      } else if (type === 'backlinks') {
        for (const row of rows) {
          const sourceUrl = row.source_url || row.source || '';
          const targetUrl = row.target_url || row.target || '';
          if (!sourceUrl || !targetUrl) continue;
          await addBacklink.mutateAsync({
            projectId: selectedProject,
            sourceUrl,
            targetUrl,
            anchorText: row.anchor_text || row.anchor || undefined,
          });
          count++;
        }
      }

      toast.success(`Imported ${count} ${type}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const exportKeywordsCsv = () => {
    if (!keywords?.length) return toast.error('No keywords to export');
    const header = 'keyword,position,search_volume,created_at';
    const rows = keywords.map((k) => `"${k.keyword}",${k.position ?? ''},${k.search_volume ?? ''},${k.created_at}`);
    downloadCsv([header, ...rows].join('\n'), 'keywords.csv');
    toast.success('Keywords exported');
  };

  const exportContentCsv = () => {
    if (!contentItems?.length) return toast.error('No content items');
    const header = 'title,topic,keywords,status,scheduled_date';
    const rows = contentItems.map((c) => `"${c.title}","${c.topic ?? ''}","${c.keywords ?? ''}",${c.status},${c.scheduled_date ?? ''}`);
    downloadCsv([header, ...rows].join('\n'), 'content-items.csv');
    toast.success('Content items exported');
  };

  const exportBacklinksCsv = () => {
    if (!backlinks?.length) return toast.error('No backlinks');
    const header = 'source_url,target_url,anchor_text,status';
    const rows = backlinks.map((b) => `"${b.source_url}","${b.target_url}","${b.anchor_text ?? ''}",${b.status}`);
    downloadCsv([header, ...rows].join('\n'), 'backlinks.csv');
    toast.success('Backlinks exported');
  };

  const exportAll = () => {
    const files: { name: string; content: string }[] = [];

    if (keywords?.length) {
      const header = 'keyword,position,search_volume,created_at';
      const rows = keywords.map((k) => `"${k.keyword}",${k.position ?? ''},${k.search_volume ?? ''},${k.created_at}`);
      files.push({ name: 'keywords.csv', content: [header, ...rows].join('\n') });
    }
    if (contentItems?.length) {
      const header = 'title,topic,keywords,status,scheduled_date';
      const rows = contentItems.map((c) => `"${c.title}","${c.topic ?? ''}","${c.keywords ?? ''}",${c.status},${c.scheduled_date ?? ''}`);
      files.push({ name: 'content-items.csv', content: [header, ...rows].join('\n') });
    }
    if (backlinks?.length) {
      const header = 'source_url,target_url,anchor_text,status';
      const rows = backlinks.map((b) => `"${b.source_url}","${b.target_url}","${b.anchor_text ?? ''}",${b.status}`);
      files.push({ name: 'backlinks.csv', content: [header, ...rows].join('\n') });
    }

    if (!files.length) return toast.error('No data to export');
    downloadZip(files);
    toast.success(`Exported ${files.length} files`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="size-6" />
              Bulk Operations
            </h1>
            <p className="text-muted-foreground">Import and export data in bulk</p>
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
            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="size-4" />
                  Import from CSV
                </CardTitle>
                <CardDescription>Upload CSV files with headers matching field names</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <input ref={keywordFileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0], 'keywords')} />
                    <Button variant="outline" size="sm" className="w-full" onClick={() => keywordFileRef.current?.click()} disabled={importing}>
                      {importing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                      Keywords CSV
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground">Headers: keyword, position, search_volume</p>
                  </div>
                  <div>
                    <input ref={contentFileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0], 'content')} />
                    <Button variant="outline" size="sm" className="w-full" onClick={() => contentFileRef.current?.click()} disabled={importing}>
                      {importing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                      Content CSV
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground">Headers: title, topic, keywords, date</p>
                  </div>
                  <div>
                    <input ref={backlinkFileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0], 'backlinks')} />
                    <Button variant="outline" size="sm" className="w-full" onClick={() => backlinkFileRef.current?.click()} disabled={importing}>
                      {importing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                      Backlinks CSV
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground">Headers: source_url, target_url, anchor_text</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="size-4" />
                  Export
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportKeywordsCsv}>
                  Keywords ({keywords?.length ?? 0})
                </Button>
                <Button variant="outline" size="sm" onClick={exportContentCsv}>
                  Content ({contentItems?.length ?? 0})
                </Button>
                <Button variant="outline" size="sm" onClick={exportBacklinksCsv}>
                  Backlinks ({backlinks?.length ?? 0})
                </Button>
                <Button size="sm" onClick={exportAll}>
                  <Package className="size-4" />
                  Export All
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

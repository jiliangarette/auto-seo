import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCode2, Plus, Trash2, Copy, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SitemapEntry {
  id: string;
  url: string;
  priority: string;
  changefreq: string;
  lastmod: string;
}

let nextId = 1;

const changeFreqOptions = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export default function XmlSitemapGenerator() {
  const [entries, setEntries] = useState<SitemapEntry[]>([
    { id: String(nextId++), url: 'https://example.com/', priority: '1.0', changefreq: 'daily', lastmod: '2026-03-13' },
  ]);
  const [newUrl, setNewUrl] = useState('');
  const [newPriority, setNewPriority] = useState('0.8');
  const [newFreq, setNewFreq] = useState('weekly');

  const addEntry = () => {
    if (!newUrl.trim()) { toast.error('Enter a URL'); return; }
    if (entries.length >= 50000) { toast.error('Sitemap limit: 50,000 URLs'); return; }
    setEntries([...entries, {
      id: String(nextId++),
      url: newUrl,
      priority: newPriority,
      changefreq: newFreq,
      lastmod: new Date().toISOString().split('T')[0],
    }]);
    setNewUrl('');
    toast.success('URL added');
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const generateXml = () => {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const entry of entries) {
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(entry.url)}</loc>`);
      if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      lines.push(`    <priority>${entry.priority}</priority>`);
      lines.push('  </url>');
    }
    lines.push('</urlset>');
    return lines.join('\n');
  };

  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const copyXml = () => {
    navigator.clipboard.writeText(generateXml());
    toast.success('Sitemap XML copied');
  };

  const downloadXml = () => {
    const blob = new Blob([generateXml()], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sitemap downloaded');
  };

  const issues: string[] = [];
  const urls = entries.map((e) => e.url);
  if (entries.length === 0) issues.push('No URLs added');
  if (new Set(urls).size !== urls.length) issues.push('Duplicate URLs detected');
  entries.forEach((e) => {
    if (!e.url.startsWith('http')) issues.push(`Invalid URL: ${e.url}`);
  });
  if (entries.length > 50000) issues.push('Exceeds 50,000 URL limit');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCode2 className="size-6" />
            XML Sitemap Generator
          </h1>
          <p className="text-muted-foreground">Generate valid XML sitemaps with priorities and change frequencies</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-[10px] text-muted-foreground">URLs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${issues.length === 0 ? 'text-green-400' : 'text-yellow-400'}`}>{issues.length}</p>
              <p className="text-[10px] text-muted-foreground">Issues</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{(50000 - entries.length).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Remaining Capacity</p>
            </CardContent>
          </Card>
        </div>

        {issues.length > 0 && (
          <Card className="border-yellow-500/30">
            <CardContent className="pt-4">
              <div className="space-y-1">
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-yellow-400">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/page" className="flex-1 min-w-[200px]" />
              <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                {['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={newFreq} onChange={(e) => setNewFreq(e.target.value)}>
                {changeFreqOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <Button onClick={addEntry}><Plus className="size-4" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">URL Entries ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                  <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{entry.url}</span>
                  <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{entry.changefreq}</span>
                  <span className="text-[9px] bg-primary/10 px-1.5 py-0.5 rounded text-primary">{entry.priority}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)}>
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No URLs added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Generated XML</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-[11px] bg-muted/20 rounded-md p-3 overflow-x-auto max-h-64 overflow-y-auto font-mono">
                  {generateXml()}
                </pre>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyXml} className="gap-1.5">
                <Copy className="size-3.5" /> Copy XML
              </Button>
              <Button variant="outline" onClick={downloadXml} className="gap-1.5">
                <Download className="size-3.5" /> Download sitemap.xml
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { suggestInternalLinks } from '@/lib/internal-linker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Copy, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function InternalLinks() {
  const [article, setArticle] = useState('');
  const [pages, setPages] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof suggestInternalLinks>> | null>(null);

  const addPage = () => setPages([...pages, '']);
  const removePage = (i: number) => setPages(pages.filter((_, idx) => idx !== i));
  const updatePage = (i: number, val: string) => {
    const next = [...pages];
    next[i] = val;
    setPages(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPages = pages.filter((p) => p.trim());
    if (!article.trim() || !validPages.length) {
      toast.error('Provide article content and at least one existing page');
      return;
    }

    setLoading(true);
    try {
      const data = await suggestInternalLinks(article.trim(), validPages);
      setResult(data);
      toast.success(`Found ${data.suggestions.length} link suggestions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  const copyUpdatedContent = () => {
    if (!result?.updatedContent) return;
    navigator.clipboard.writeText(result.updatedContent);
    toast.success('Updated content copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="size-6" />
            Internal Linking Suggestions
          </h1>
          <p className="text-muted-foreground">Get AI suggestions for internal links in your content</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Article Content</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] resize-y"
                  placeholder="Paste your article content here..."
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">Existing Pages</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addPage}>
                    <Plus className="size-3" /> Add Page
                  </Button>
                </div>
                <div className="space-y-2">
                  {pages.map((page, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`Page ${i + 1} (e.g., /blog/seo-tips or "SEO Tips Guide")`}
                        value={page}
                        onChange={(e) => updatePage(i, e.target.value)}
                        className="flex-1"
                      />
                      {pages.length > 1 && (
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => removePage(i)}>
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                Suggest Links
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            {result.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Suggestions ({result.suggestions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {s.anchorText}
                        </span>
                        <span className="text-xs text-muted-foreground">&rarr;</span>
                        <span className="text-xs font-medium">{s.targetPage}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.context}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{s.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.updatedContent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Updated Content with Links</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyUpdatedContent}>
                      <Copy className="size-4" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-gray-300 whitespace-pre-wrap">
                    {result.updatedContent}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

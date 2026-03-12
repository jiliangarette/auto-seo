import { useState } from 'react';
import { generateMetaTags } from '@/lib/meta-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tags, Copy, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MetaTagGenerator() {
  const [pageTitle, setPageTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [pageType, setPageType] = useState('website');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateMetaTags>> | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim()) return;

    setLoading(true);
    try {
      const tags = await generateMetaTags({
        pageTitle: pageTitle.trim(),
        description: description.trim(),
        keywords: keywords.trim(),
        pageType,
      });
      setResult(tags);
      toast.success('Meta tags generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const copySnippet = () => {
    if (!result?.htmlSnippet) return;
    navigator.clipboard.writeText(result.htmlSnippet);
    toast.success('HTML copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="size-6" />
            Meta Tag Generator
          </h1>
          <p className="text-muted-foreground">Generate optimized meta tags for your pages</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleGenerate} className="space-y-3">
              <Input
                placeholder="Page title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                required
              />
              <Input
                placeholder="Page description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Keywords (comma-separated)"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="flex-1"
                />
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pageType}
                  onChange={(e) => setPageType(e.target.value)}
                >
                  <option value="website">Website</option>
                  <option value="article">Article</option>
                  <option value="product">Product</option>
                  <option value="blog">Blog Post</option>
                  <option value="landing">Landing Page</option>
                </select>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
                Generate Meta Tags
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Google Search Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Search className="size-4" />
                  Google Search Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 bg-white p-4 dark:bg-zinc-950">
                  <p className="text-sm text-green-700 dark:text-green-500">
                    example.com &rsaquo; page
                  </p>
                  <p className="text-lg text-blue-700 hover:underline dark:text-blue-400">
                    {result.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.metaDescription}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Generated Tags */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Generated Tags</CardTitle>
                  <Button variant="outline" size="sm" onClick={copySnippet}>
                    <Copy className="size-4" />
                    Copy HTML
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between rounded bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium">{result.title}</span>
                  </div>
                  <div className="flex justify-between rounded bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium max-w-md text-right">{result.metaDescription}</span>
                  </div>
                  <div className="flex justify-between rounded bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">OG Type</span>
                    <span className="font-medium">{result.ogType}</span>
                  </div>
                  <div className="flex justify-between rounded bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Twitter Card</span>
                    <span className="font-medium">{result.twitterCard}</span>
                  </div>
                  <div className="flex justify-between rounded bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Keywords</span>
                    <span className="font-medium max-w-md text-right">{result.keywords}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">HTML Snippet</p>
                  <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-green-400">
                    <code>{result.htmlSnippet}</code>
                  </pre>
                </div>

                {result.canonicalHint && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Canonical tip:</strong> {result.canonicalHint}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

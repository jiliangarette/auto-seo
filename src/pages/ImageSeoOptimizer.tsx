import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageAnalysis {
  url: string;
  altTextScore: number;
  currentAlt: string;
  suggestedAlt: string;
  fileSize: string;
  formatRecommendation: string;
  issues: string[];
  tips: string[];
}

interface AnalysisResult {
  images: ImageAnalysis[];
  sitemapXml: string;
}

export default function ImageSeoOptimizer() {
  const [urls, setUrls] = useState<string[]>(['']);
  const [alts, setAlts] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const addUrl = () => {
    setUrls([...urls, '']);
    setAlts([...alts, '']);
  };

  const removeUrl = (idx: number) => {
    setUrls(urls.filter((_, i) => i !== idx));
    setAlts(alts.filter((_, i) => i !== idx));
  };

  const updateUrl = (idx: number, val: string) => {
    const next = [...urls];
    next[idx] = val;
    setUrls(next);
  };

  const updateAlt = (idx: number, val: string) => {
    const next = [...alts];
    next[idx] = val;
    setAlts(next);
  };

  const analyze = async () => {
    const validUrls = urls.filter((u) => u.trim());
    if (validUrls.length === 0) {
      toast.error('Add at least one image URL');
      return;
    }
    setLoading(true);
    try {
      const imageData = validUrls.map((url, i) => ({
        url,
        currentAlt: alts[i]?.trim() || '',
      }));

      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an image SEO optimization expert. Return JSON only.' },
          { role: 'user', content: `Analyze these images for SEO optimization:

${JSON.stringify(imageData, null, 2)}

For each image, provide:
1. Alt text quality score (0-100)
2. Suggested better alt text
3. Estimated file size recommendation
4. Format recommendation (WebP, AVIF, etc.)
5. SEO issues found
6. Optimization tips

Also generate an image sitemap XML for all images.

Return JSON:
{
  "images": [
    {
      "url": "image url",
      "altTextScore": number(0-100),
      "currentAlt": "current alt or empty",
      "suggestedAlt": "optimized alt text",
      "fileSize": "size recommendation",
      "formatRecommendation": "format suggestion",
      "issues": ["issue1", "issue2"],
      "tips": ["tip1", "tip2"]
    }
  ],
  "sitemapXml": "<?xml ...> complete image sitemap XML"
}` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const copySitemap = () => {
    if (!result?.sitemapXml) return;
    navigator.clipboard.writeText(result.sitemapXml);
    toast.success('Sitemap XML copied');
  };

  const exportSitemap = () => {
    if (!result?.sitemapXml) return;
    const blob = new Blob([result.sitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sitemap downloaded');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ImageIcon className="size-6" />
            Image SEO Optimizer
          </h1>
          <p className="text-muted-foreground">Optimize image alt text, formats, and generate image sitemaps</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Image URLs & Alt Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateUrl(idx, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="font-mono text-xs flex-1"
                />
                <Input
                  value={alts[idx]}
                  onChange={(e) => updateAlt(idx, e.target.value)}
                  placeholder="Current alt text (optional)"
                  className="text-xs w-48"
                />
                {urls.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeUrl(idx)}>
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={addUrl}>
                <Plus className="size-3.5" /> Add Image
              </Button>
              <Button onClick={analyze} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                Analyze Images
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="space-y-3">
              {result.images.map((img, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-muted-foreground truncate">{img.url}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            {img.altTextScore >= 70 ? (
                              <CheckCircle2 className="size-3.5 text-green-400" />
                            ) : (
                              <AlertTriangle className="size-3.5 text-yellow-400" />
                            )}
                            <span className={`text-sm font-bold ${img.altTextScore >= 70 ? 'text-green-400' : img.altTextScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {img.altTextScore}/100
                            </span>
                            <span className="text-[10px] text-muted-foreground">alt score</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{img.fileSize}</span>
                          <span className="text-[10px] bg-blue-950/30 text-blue-400 px-1.5 py-0.5 rounded">{img.formatRecommendation}</span>
                        </div>
                      </div>
                    </div>

                    {img.currentAlt && (
                      <div className="rounded-md bg-muted/20 p-2 mb-1.5">
                        <p className="text-[10px] text-muted-foreground">Current alt:</p>
                        <p className="text-xs">{img.currentAlt}</p>
                      </div>
                    )}

                    <div className="rounded-md bg-green-950/10 border border-green-500/20 p-2 mb-2">
                      <p className="text-[10px] text-green-400">Suggested alt:</p>
                      <p className="text-xs">{img.suggestedAlt}</p>
                    </div>

                    {img.issues.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {img.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs">
                            <AlertTriangle className="size-3 text-yellow-400 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {img.tips.length > 0 && (
                      <div className="space-y-1">
                        {img.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs">
                            <CheckCircle2 className="size-3 text-blue-400 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {result.sitemapXml && (
              <Card className="border-border/30 bg-card/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Image Sitemap XML</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={copySitemap}>
                        <Copy className="size-3.5" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportSitemap}>
                        <Download className="size-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-md bg-muted/30 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {result.sitemapXml}
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

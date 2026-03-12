import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Copy, Check, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const PLACEHOLDER_IMG = 'https://placehold.co/1200x630/1a1a2e/e2e8f0?text=OG+Image';

export default function SocialPreview() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [siteName, setSiteName] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [copied, setCopied] = useState(false);

  const imgSrc = image || PLACEHOLDER_IMG;
  const displayTitle = title || 'Page Title';
  const displayDesc = description || 'Page description will appear here...';
  const displayUrl = url || 'example.com';
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url || 'example.com';
    }
  })();

  const ogTags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    image && `<meta property="og:image" content="${image}" />`,
    siteName && `<meta property="og:site_name" content="${siteName}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    image && `<meta name="twitter:image" content="${image}" />`,
    twitterHandle && `<meta name="twitter:site" content="${twitterHandle}" />`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(ogTags);
    setCopied(true);
    toast.success('Meta tags copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="size-6" />
            Social Media Preview
          </h1>
          <p className="text-muted-foreground">Preview how your page looks when shared on social platforms</p>
        </div>

        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Page Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Page URL</label>
              <Input placeholder="https://example.com/page" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Title</label>
              <Input placeholder="Your page title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">{title.length}/70 characters</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                placeholder="Page description for social sharing"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">{description.length}/200 characters</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Image URL</label>
              <Input placeholder="https://example.com/og-image.jpg" value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Site Name</label>
                <Input placeholder="My Website" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Twitter Handle</label>
                <Input placeholder="@handle" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previews */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Facebook */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Facebook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
                <div className="aspect-[1.91/1] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {image ? (
                    <img src={imgSrc} alt="OG" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="size-12 text-zinc-600" />
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-[10px] uppercase text-zinc-500">{domain}</p>
                  <p className="text-sm font-semibold text-zinc-100 line-clamp-2">{displayTitle}</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">{displayDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Twitter/X */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Twitter / X</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
                <div className="aspect-[2/1] bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                  {image ? (
                    <img src={imgSrc} alt="OG" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="size-12 text-zinc-600" />
                  )}
                  <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                    {domain}
                  </div>
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="text-sm font-medium text-zinc-100 line-clamp-1">{displayTitle}</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">{displayDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">LinkedIn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
                <div className="aspect-[1.91/1] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {image ? (
                    <img src={imgSrc} alt="OG" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="size-12 text-zinc-600" />
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-semibold text-zinc-100 line-clamp-2">{displayTitle}</p>
                  <p className="text-[10px] text-zinc-500">{displayUrl}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Character warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Rec label="Title length" value={title.length} min={30} max={70} />
              <Rec label="Description length" value={description.length} min={50} max={200} />
              <Rec label="Image" value={image ? 1 : 0} min={1} max={1} custom={image ? 'Provided' : 'Missing — add an OG image (1200x630px recommended)'} />
              <Rec label="URL" value={url ? 1 : 0} min={1} max={1} custom={url ? 'Provided' : 'Missing'} />
            </CardContent>
          </Card>
        </div>

        {/* Generated tags */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Generated Meta Tags</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!title}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-green-400">
              <code>{ogTags || '<!-- Fill in page details above -->'}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Rec({ label, value, min, max, custom }: { label: string; value: number; min: number; max: number; custom?: string }) {
  const ok = value >= min && value <= max;
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${ok ? 'bg-green-400' : 'bg-yellow-400'}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={ok ? 'text-green-400' : 'text-yellow-400'}>
        {custom ?? `${value} chars (${min}–${max} recommended)`}
      </span>
    </div>
  );
}

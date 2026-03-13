import { useState } from 'react';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Monitor, Smartphone, AlertTriangle } from 'lucide-react';

export default function SerpPreview() {
  const [url, setUrl] = useSiteUrlInput();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keyword, setKeyword] = useState('');
  const [snippetType, setSnippetType] = useState<'standard' | 'faq' | 'howto' | 'review'>('standard');
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');

  // FAQ fields
  const [faqItems, setFaqItems] = useState([{ q: '', a: '' }]);
  // Review fields
  const [rating, setRating] = useState('4.5');
  const [reviewCount, setReviewCount] = useState('128');

  const titleLen = title.length;
  const descLen = description.length;
  const titleOk = titleLen > 0 && titleLen <= 60;
  const descOk = descLen > 0 && descLen <= 160;

  const highlightKeyword = (text: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  };

  const displayUrl = (() => {
    try {
      const u = new URL(url);
      return `${u.hostname} › ${u.pathname.split('/').filter(Boolean).join(' › ')}`;
    } catch {
      return url;
    }
  })();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="size-6" />
            SERP Preview
          </h1>
          <p className="text-muted-foreground">Preview how your page appears in Google search results</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input placeholder="Page URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            <div>
              <Input placeholder="Title tag (max 60 chars)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="mt-1 flex gap-2 text-xs">
                <span className={titleOk ? 'text-green-500' : titleLen > 60 ? 'text-red-500' : 'text-muted-foreground'}>
                  {titleLen}/60 chars
                </span>
                {titleLen > 60 && <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="size-3" />Too long — will be truncated</span>}
              </div>
            </div>
            <div>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                placeholder="Meta description (max 160 chars)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="mt-1 flex gap-2 text-xs">
                <span className={descOk ? 'text-green-500' : descLen > 160 ? 'text-red-500' : 'text-muted-foreground'}>
                  {descLen}/160 chars
                </span>
                {descLen > 160 && <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="size-3" />Too long</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Target keyword (highlights in preview)" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1" />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={snippetType}
                onChange={(e) => setSnippetType(e.target.value as typeof snippetType)}
              >
                <option value="standard">Standard</option>
                <option value="faq">FAQ</option>
                <option value="howto">How-to</option>
                <option value="review">Review</option>
              </select>
            </div>

            {snippetType === 'faq' && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">FAQ Items</p>
                {faqItems.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Question" value={item.q} onChange={(e) => { const n = [...faqItems]; n[i].q = e.target.value; setFaqItems(n); }} className="flex-1" />
                    <Input placeholder="Answer" value={item.a} onChange={(e) => { const n = [...faqItems]; n[i].a = e.target.value; setFaqItems(n); }} className="flex-1" />
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => setFaqItems([...faqItems, { q: '', a: '' }])}>+ Add FAQ</Button>
              </div>
            )}

            {snippetType === 'review' && (
              <div className="flex gap-2">
                <Input placeholder="Rating (e.g., 4.5)" value={rating} onChange={(e) => setRating(e.target.value)} className="w-32" />
                <Input placeholder="Review count" value={reviewCount} onChange={(e) => setReviewCount(e.target.value)} className="w-32" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button variant={view === 'desktop' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('desktop')}>
            <Monitor className="size-4" /> Desktop
          </Button>
          <Button variant={view === 'mobile' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('mobile')}>
            <Smartphone className="size-4" /> Mobile
          </Button>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Google Search Preview — {view}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg bg-white p-6 dark:bg-zinc-950 ${view === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
              {/* Standard result */}
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-500">{displayUrl}</p>
                <p
                  className={`${view === 'mobile' ? 'text-base' : 'text-xl'} text-blue-700 hover:underline dark:text-blue-400 cursor-pointer`}
                  dangerouslySetInnerHTML={{ __html: highlightKeyword(title || 'Page Title') }}
                />
                <p
                  className="text-sm text-gray-600 dark:text-gray-400"
                  dangerouslySetInnerHTML={{ __html: highlightKeyword(description || 'Meta description will appear here...') }}
                />

                {/* Review stars */}
                {snippetType === 'review' && (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-yellow-500">{'★'.repeat(Math.floor(parseFloat(rating) || 0))}</span>
                    <span className="text-sm text-gray-500">
                      {rating} — {reviewCount} reviews
                    </span>
                  </div>
                )}

                {/* FAQ dropdown */}
                {snippetType === 'faq' && faqItems.filter((f) => f.q).length > 0 && (
                  <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-1">People also ask</p>
                    {faqItems.filter((f) => f.q).map((f, i) => (
                      <div key={i} className="border-b border-gray-100 py-2 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.q}</p>
                        {f.a && <p className="text-xs text-gray-500 mt-1">{f.a}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* How-to steps */}
                {snippetType === 'howto' && (
                  <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <p className="text-xs text-gray-500">Step-by-step guide • {title || 'How to...'}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Repeat2,
  Loader2,
  Copy,
  Check,
  Twitter,
  Mail,
  Video,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

interface RepurposedContent {
  socialPosts: { platform: string; content: string }[];
  newsletter: { subject: string; body: string };
  videoScript: { title: string; sections: { heading: string; script: string }[] };
}

export default function ContentRepurposer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepurposedContent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'social' | 'email' | 'video'>('social');

  const repurpose = async () => {
    if (!content.trim()) {
      toast.error('Paste your blog post content');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content repurposing expert. Transform blog posts into other formats. Return JSON only.' },
          { role: 'user', content: `Repurpose this blog post into multiple formats:

${content.slice(0, 3000)}

Return JSON:
{
  "socialPosts": [
    { "platform": "Twitter/X", "content": "tweet (under 280 chars)" },
    { "platform": "LinkedIn", "content": "linkedin post" },
    { "platform": "Instagram", "content": "instagram caption with hashtags" },
    { "platform": "Facebook", "content": "facebook post" }
  ],
  "newsletter": {
    "subject": "email subject line",
    "body": "email newsletter version (3-4 paragraphs, conversational tone)"
  },
  "videoScript": {
    "title": "video title",
    "sections": [
      { "heading": "section name", "script": "what to say" }
    ]
  }
}` },
        ],
        temperature: 0.6,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Content repurposed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Repurposing failed');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const platformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('x')) return <Twitter className="size-4 text-blue-400" />;
    if (platform.toLowerCase().includes('linkedin')) return <MessageSquare className="size-4 text-blue-600" />;
    return <MessageSquare className="size-4 text-purple-400" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Repeat2 className="size-6" />
            Content Repurposer
          </h1>
          <p className="text-muted-foreground">Transform blog posts into social media, newsletters, and video scripts</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <label className="mb-1 block text-xs text-muted-foreground">Paste Your Blog Post</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px] resize-y leading-relaxed"
              placeholder="Paste your full blog post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{content.split(/\s+/).filter(Boolean).length} words</span>
              <Button onClick={repurpose} disabled={loading || !content.trim()}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Repeat2 className="size-4" />}
                Repurpose Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="flex gap-1 border-b border-border">
              {([
                { key: 'social', label: 'Social Media', icon: Twitter },
                { key: 'email', label: 'Newsletter', icon: Mail },
                { key: 'video', label: 'Video Script', icon: Video },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Social Media Posts */}
            {activeTab === 'social' && (
              <div className="space-y-3">
                {result.socialPosts.map((post, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {platformIcon(post.platform)}
                          {post.platform}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => copyText(post.content, `social-${i}`)}>
                          {copiedId === `social-${i}` ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border/50 p-3 text-sm whitespace-pre-wrap">
                        {post.content}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{post.content.length} characters</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Newsletter */}
            {activeTab === 'email' && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="size-4" />
                      Email Newsletter
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyText(`Subject: ${result.newsletter.subject}\n\n${result.newsletter.body}`, 'newsletter')}>
                      {copiedId === 'newsletter' ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                      {copiedId === 'newsletter' ? 'Copied' : 'Copy All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                    <div className="rounded-md border border-border/50 p-2 text-sm font-medium">{result.newsletter.subject}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Body</p>
                    <div className="rounded-md border border-border/50 p-3 text-sm whitespace-pre-wrap leading-relaxed">
                      {result.newsletter.body}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Script */}
            {activeTab === 'video' && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Video className="size-4" />
                      {result.videoScript.title}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const text = result.videoScript.sections.map((s) => `## ${s.heading}\n${s.script}`).join('\n\n');
                      copyText(text, 'video');
                    }}>
                      {copiedId === 'video' ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                      {copiedId === 'video' ? 'Copied' : 'Copy Script'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.videoScript.sections.map((section, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-3">
                      <p className="text-xs font-bold text-primary mb-1">
                        {i + 1}. {section.heading}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{section.script}</p>
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

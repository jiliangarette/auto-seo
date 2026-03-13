import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVariant {
  subject: string;
  body: string;
  tone: string;
}

interface FollowUp {
  day: number;
  subject: string;
  body: string;
}

interface OutreachResult {
  targetSite: string;
  variants: EmailVariant[];
  subjectTests: { subject: string; predictedOpenRate: number }[];
  followUps: FollowUp[];
  summary: string;
}

export default function BacklinkOutreachEmails() {
  const [targetSite, setTargetSite] = useState('');
  const [yourSite, setYourSite] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);

  const generate = async () => {
    if (!targetSite.trim()) { toast.error('Enter target site'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a link building outreach expert. Return JSON only.' },
          { role: 'user', content: `Generate outreach emails for backlink request:\nTarget site: ${targetSite}\nYour site: ${yourSite || 'mysite.com'}\nContext: ${context || 'General link building'}\n\nReturn JSON:\n{\n  "targetSite": "${targetSite}",\n  "variants": [\n    { "subject": "email subject", "body": "email body with \\n for line breaks", "tone": "friendly"|"professional"|"casual" }\n  ],\n  "subjectTests": [\n    { "subject": "subject line variant", "predictedOpenRate": number(0-100) }\n  ],\n  "followUps": [\n    { "day": number, "subject": "follow-up subject", "body": "follow-up body" }\n  ],\n  "summary": "outreach strategy overview"\n}\n\nGenerate 3 email variants with different tones, 5 subject line A/B tests, and 2 follow-up emails.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Outreach emails generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="size-6" />
            Backlink Outreach Emails
          </h1>
          <p className="text-muted-foreground">AI-generated personalized outreach with A/B subject lines and follow-ups</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input value={targetSite} onChange={(e) => setTargetSite(e.target.value)} placeholder="Target site (e.g., blog.example.com)" />
            <Input value={yourSite} onChange={(e) => setYourSite(e.target.value)} placeholder="Your site URL (optional)" />
            <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (e.g., guest post, broken link, resource page)" />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              Generate Outreach Emails
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {result.variants.map((variant, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Variant {idx + 1} — {variant.tone}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyText(`Subject: ${variant.subject}\n\n${variant.body}`)}>
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium text-primary mb-2">Subject: {variant.subject}</p>
                  <div className="text-xs text-muted-foreground whitespace-pre-line bg-muted/10 rounded-md p-3 border border-border/30">
                    {variant.body}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Subject Line A/B Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.subjectTests.map((test, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium">{test.subject}</span>
                        <span className="text-muted-foreground">{test.predictedOpenRate}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30">
                        <div className={`h-full rounded-full ${test.predictedOpenRate >= 40 ? 'bg-green-500' : test.predictedOpenRate >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${test.predictedOpenRate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Follow-Up Sequence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.followUps.map((fu, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Day {fu.day}</span>
                        <Button variant="ghost" size="sm" onClick={() => copyText(`Subject: ${fu.subject}\n\n${fu.body}`)}>
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs font-medium mb-1">Subject: {fu.subject}</p>
                      <p className="text-[11px] text-muted-foreground whitespace-pre-line">{fu.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

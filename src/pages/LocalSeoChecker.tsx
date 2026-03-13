import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface NapIssue {
  source: string;
  field: string;
  found: string;
  expected: string;
  severity: 'match' | 'mismatch' | 'missing';
}

interface CitationOpportunity {
  platform: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  url: string;
}

interface LocalSeoResult {
  napScore: number;
  napIssues: NapIssue[];
  gbpTips: string[];
  citations: CitationOpportunity[];
  summary: string;
}

const sevColors = {
  match: 'text-green-400 bg-green-950/30',
  mismatch: 'text-red-400 bg-red-950/30',
  missing: 'text-yellow-400 bg-yellow-950/30',
};

const prioColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

export default function LocalSeoChecker() {
  const [business, setBusiness] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [result, setResult] = useState<LocalSeoResult | null>(null);

  const check = async () => {
    if (!business.trim()) { toast.error('Enter business name'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a local SEO expert. Return JSON only.' },
          { role: 'user', content: `Analyze local SEO for:
Business: ${business}
Address: ${address || 'Not provided'}
Phone: ${phone || 'Not provided'}

Return JSON:
{
  "napScore": number(0-100),
  "napIssues": [
    { "source": "Google Maps", "field": "address", "found": "found value", "expected": "expected value", "severity": "match"|"mismatch"|"missing" }
  ],
  "gbpTips": ["Google Business Profile tip 1", "tip 2"],
  "citations": [
    { "platform": "Yelp", "type": "directory", "priority": "high"|"medium"|"low", "url": "yelp.com" }
  ],
  "summary": "local SEO overview"
}

Generate 6-8 NAP checks, 5-7 GBP tips, and 8-10 citation opportunities.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Local SEO check complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="size-6" />
            Local SEO Checker
          </h1>
          <p className="text-muted-foreground">NAP consistency, GBP optimization, and citation opportunities</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name" />
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address (optional)" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" />
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              Check Local SEO
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-3xl font-bold ${result.napScore >= 80 ? 'text-green-400' : result.napScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.napScore}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">NAP Score</p>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">NAP Consistency Check</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.napIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {issue.severity === 'match' ? (
                          <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="size-3.5 text-yellow-400 shrink-0" />
                        )}
                        <span className="text-sm">{issue.source}</span>
                        <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{issue.field}</span>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sevColors[issue.severity]}`}>
                        {issue.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Google Business Profile Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.gbpTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="size-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Citation Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.citations.map((cit, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="size-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{cit.platform}</span>
                        <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{cit.type}</span>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${prioColors[cit.priority]}`}>
                        {cit.priority}
                      </span>
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

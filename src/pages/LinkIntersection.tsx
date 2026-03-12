import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Waypoints,
  Loader2,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkProspect {
  domain: string;
  estimatedDa: number;
  relevance: 'high' | 'medium' | 'low';
  linksToCompetitors: number;
  contactType: string;
  outreachAngle: string;
}

interface IntersectionResult {
  totalProspects: number;
  highDaCount: number;
  prospects: LinkProspect[];
  summary: string;
}

const relColors = {
  high: 'text-green-400 bg-green-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

export default function LinkIntersection() {
  const [competitors, setCompetitors] = useState('');
  const [yourDomain, setYourDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntersectionResult | null>(null);

  const analyze = async () => {
    if (!competitors.trim()) {
      toast.error('Enter competitor domains');
      return;
    }
    setLoading(true);
    try {
      const compList = competitors.split('\n').map((c) => c.trim()).filter(Boolean);
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a link building and backlink intersection expert. Return JSON only.' },
          { role: 'user', content: `Find link intersection opportunities:

Your domain: ${yourDomain || 'Not specified'}
Competitor domains: ${compList.join(', ')}

Find sites that link to multiple competitors but not to the target domain.

Return JSON:
{
  "totalProspects": number,
  "highDaCount": number,
  "prospects": [
    {
      "domain": "prospect-domain.com",
      "estimatedDa": number(1-100),
      "relevance": "high"|"medium"|"low",
      "linksToCompetitors": number(1-${compList.length}),
      "contactType": "blog"|"resource page"|"directory"|"news"|"forum",
      "outreachAngle": "brief outreach suggestion"
    }
  ],
  "summary": "analysis overview"
}

Generate 12-18 realistic link prospects sorted by DA.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Intersection analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportList = () => {
    if (!result) return;
    const rows = result.prospects.map((p) =>
      `"${p.domain}",${p.estimatedDa},${p.relevance},${p.linksToCompetitors},${p.contactType},"${p.outreachAngle}"`
    );
    const csv = `Domain,Est DA,Relevance,Links to Competitors,Type,Outreach Angle\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'link-prospects.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Prospect list exported');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Waypoints className="size-6" />
            Link Intersection Tool
          </h1>
          <p className="text-muted-foreground">Find sites linking to competitors but not you</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Your Domain (optional)</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                value={yourDomain}
                onChange={(e) => setYourDomain(e.target.value)}
                placeholder="yourdomain.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Competitor Domains (one per line)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[100px] resize-y"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder={"competitor1.com\ncompetitor2.com\ncompetitor3.com"}
              />
            </div>
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Waypoints className="size-4" />}
              Find Link Opportunities
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{result.totalProspects}</p>
                  <p className="text-[10px] text-muted-foreground">Prospects Found</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.highDaCount}</p>
                  <p className="text-[10px] text-muted-foreground">High DA (50+)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Button variant="outline" size="sm" onClick={exportList}>
                    <Download className="size-3.5" /> Export List
                  </Button>
                </CardContent>
              </Card>
            </div>

            {result.summary && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs">{result.summary}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Link Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {result.prospects.map((prospect, idx) => (
                    <div key={idx} className={`flex items-center justify-between rounded-md border border-border/50 p-2.5 ${idx % 2 === 0 ? 'bg-muted/10' : ''} hover:bg-muted/30 transition-colors`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{prospect.domain}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${relColors[prospect.relevance]}`}>
                            {prospect.relevance}
                          </span>
                          <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">
                            {prospect.contactType}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{prospect.outreachAngle}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <p className={`text-xs font-bold ${prospect.estimatedDa >= 50 ? 'text-green-400' : prospect.estimatedDa >= 30 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                            DA {prospect.estimatedDa}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{prospect.linksToCompetitors} comp</p>
                        </div>
                      </div>
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

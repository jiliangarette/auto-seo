import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  Link2,
  BarChart3,
  Send,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Prospect {
  id: string;
  domain: string;
  contactEmail: string;
  pageUrl: string;
  status: 'new' | 'emailed' | 'replied' | 'linked' | 'declined';
  addedAt: string;
  notes: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function LinkOutreach() {
  const [activeTab, setActiveTab] = useState<'prospects' | 'templates' | 'analytics'>('prospects');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New prospect form
  const [newDomain, setNewDomain] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');

  // Template generation
  const [niche, setNiche] = useState('');
  const [yourSiteUrl, setYourSiteUrl] = useState('');

  const addProspect = () => {
    if (!newDomain.trim()) {
      toast.error('Enter a domain');
      return;
    }
    const prospect: Prospect = {
      id: crypto.randomUUID(),
      domain: newDomain.trim(),
      contactEmail: newEmail.trim(),
      pageUrl: newPageUrl.trim(),
      status: 'new',
      addedAt: new Date().toISOString(),
      notes: '',
    };
    setProspects((prev) => [...prev, prospect]);
    setNewDomain('');
    setNewEmail('');
    setNewPageUrl('');
    toast.success('Prospect added');
  };

  const updateStatus = (id: string, status: Prospect['status']) => {
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  };

  const removeProspect = (id: string) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
  };

  const generateTemplates = async () => {
    if (!niche.trim()) {
      toast.error('Enter your niche');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'Generate outreach email templates for link building. Return JSON only.' },
          { role: 'user', content: `Generate 4 outreach email templates for link building in the "${niche}" niche${yourSiteUrl ? ` for ${yourSiteUrl}` : ''}.

Include templates for:
1. Guest post pitch
2. Broken link replacement
3. Resource page inclusion
4. Content collaboration

Return JSON array: [{ "name": "template name", "subject": "email subject", "body": "email body with [PLACEHOLDERS]" }]` },
        ],
      });
      const raw = response.choices[0].message.content ?? '[]';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setTemplates(parsed.map((t: Omit<EmailTemplate, 'id'>) => ({ ...t, id: crypto.randomUUID() })));
      setActiveTab('templates');
      toast.success('Templates generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
    setCopiedId(template.id);
    toast.success('Template copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColors: Record<string, string> = {
    new: 'bg-gray-800 text-gray-400',
    emailed: 'bg-blue-950/30 text-blue-400',
    replied: 'bg-yellow-950/30 text-yellow-400',
    linked: 'bg-green-950/30 text-green-400',
    declined: 'bg-red-950/30 text-red-400',
  };

  const statusOptions: Prospect['status'][] = ['new', 'emailed', 'replied', 'linked', 'declined'];

  const stats = {
    total: prospects.length,
    emailed: prospects.filter((p) => p.status === 'emailed').length,
    replied: prospects.filter((p) => p.status === 'replied').length,
    linked: prospects.filter((p) => p.status === 'linked').length,
    responseRate: prospects.filter((p) => p.status !== 'new').length > 0
      ? Math.round(prospects.filter((p) => p.status === 'replied' || p.status === 'linked').length / prospects.filter((p) => p.status !== 'new').length * 100)
      : 0,
    conversionRate: prospects.filter((p) => p.status !== 'new').length > 0
      ? Math.round(prospects.filter((p) => p.status === 'linked').length / prospects.filter((p) => p.status !== 'new').length * 100)
      : 0,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="size-6" />
            Link Building Outreach
          </h1>
          <p className="text-muted-foreground">Find prospects, generate emails, and track outreach campaigns</p>
        </div>

        <div className="flex gap-1 border-b border-border">
          {([
            { key: 'prospects', label: `Prospects (${prospects.length})` },
            { key: 'templates', label: `Templates (${templates.length})` },
            { key: 'analytics', label: 'Analytics' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Prospects */}
        {activeTab === 'prospects' && (
          <div className="space-y-4">
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="size-4" />
                  Add Prospect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input placeholder="Domain" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="font-mono text-xs" />
                  <Input placeholder="Contact email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" className="text-xs" />
                  <Input placeholder="Target page URL" value={newPageUrl} onChange={(e) => setNewPageUrl(e.target.value)} className="font-mono text-xs" />
                </div>
                <Button size="sm" onClick={addProspect} className="mt-2">
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </CardContent>
            </Card>

            {prospects.length === 0 ? (
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-6 text-center">
                  <Link2 className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No prospects yet. Add domains to start outreach.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {prospects.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-md border border-border/50 p-3 ${i % 2 === 0 ? 'bg-muted/10' : ''} hover:bg-muted/30 transition-colors`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-medium">{p.domain}</p>
                        {p.pageUrl && (
                          <a href={p.pageUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      {p.contactEmail && <p className="text-[10px] text-muted-foreground">{p.contactEmail}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        className="rounded-md border border-input bg-background px-2 py-1 text-[10px] h-7"
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value as Prospect['status'])}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => removeProspect(p.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="size-4" />
                  Generate Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Your niche (e.g., digital marketing)" value={niche} onChange={(e) => setNiche(e.target.value)} />
                  <Input placeholder="Your site URL (optional)" value={yourSiteUrl} onChange={(e) => setYourSiteUrl(e.target.value)} />
                </div>
                <Button size="sm" onClick={generateTemplates} disabled={loading}>
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Generate Templates
                </Button>
              </CardContent>
            </Card>

            {templates.length > 0 && (
              <div className="space-y-3">
                {templates.map((t) => (
                  <Card key={t.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => copyTemplate(t)}>
                          {copiedId === t.id ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                          {copiedId === t.id ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border/50 p-3 space-y-2">
                        <p className="text-xs">
                          <span className="text-muted-foreground">Subject: </span>
                          <span className="font-medium">{t.subject}</span>
                        </p>
                        <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed">{t.body}</pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total Prospects</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.emailed}</p>
                  <p className="text-[10px] text-muted-foreground">Emails Sent</p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.linked}</p>
                  <p className="text-[10px] text-muted-foreground">Links Acquired</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="size-4" />
                  Response Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Response Rate</span>
                    <span className="text-xs font-medium">{stats.responseRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-yellow-500" style={{ width: `${stats.responseRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Conversion Rate (linked)</span>
                    <span className="text-xs font-medium">{stats.conversionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${stats.conversionRate}%` }} />
                  </div>
                </div>

                {/* Pipeline */}
                <div className="mt-4">
                  <p className="text-xs font-medium mb-2">Pipeline</p>
                  <div className="flex gap-1">
                    {statusOptions.map((status) => {
                      const count = prospects.filter((p) => p.status === status).length;
                      const pct = prospects.length > 0 ? (count / prospects.length) * 100 : 0;
                      return (
                        <div key={status} className="text-center" style={{ width: `${Math.max(pct, 15)}%` }}>
                          <div className={`h-8 rounded ${statusColors[status].split(' ')[0]} flex items-center justify-center`}>
                            <span className="text-[10px] font-bold">{count}</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{status}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

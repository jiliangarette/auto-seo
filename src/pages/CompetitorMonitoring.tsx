import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Radar,
  Loader2,
  Plus,
  Trash2,
  Bell,
  TrendingUp,
  TrendingDown,
  FileText,
  Globe,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface MonitoredCompetitor {
  id: string;
  domain: string;
  addedAt: string;
  lastScanned: string | null;
  contentCount: number;
  alertsEnabled: boolean;
}

interface ContentChange {
  id: string;
  domain: string;
  type: 'new_page' | 'ranking_change' | 'content_update';
  title: string;
  detail: string;
  detected: string;
  severity: 'info' | 'warning' | 'critical';
}

interface WeeklyScan {
  domain: string;
  newPages: number;
  rankingChanges: number;
  contentFrequency: string;
  topKeywords: string[];
}

export default function CompetitorMonitoring() {
  const [competitors, setCompetitors] = useState<MonitoredCompetitor[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [alerts, setAlerts] = useState<ContentChange[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState<WeeklyScan[]>([]);
  const [activeTab, setActiveTab] = useState<'monitor' | 'alerts' | 'scans'>('monitor');

  const addCompetitor = () => {
    if (!newDomain.trim()) return;
    const domain = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (competitors.some((c) => c.domain === domain)) {
      toast.error('Already monitoring this domain');
      return;
    }
    const comp: MonitoredCompetitor = {
      id: crypto.randomUUID(),
      domain,
      addedAt: new Date().toISOString(),
      lastScanned: null,
      contentCount: 0,
      alertsEnabled: true,
    };
    setCompetitors((prev) => [...prev, comp]);
    setNewDomain('');
    toast.success(`Now monitoring ${domain}`);
  };

  const removeCompetitor = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    toast.success('Competitor removed');
  };

  const toggleAlerts = (id: string) => {
    setCompetitors((prev) => prev.map((c) => c.id === id ? { ...c, alertsEnabled: !c.alertsEnabled } : c));
  };

  const runScan = async () => {
    if (competitors.length === 0) {
      toast.error('Add competitors to monitor first');
      return;
    }
    setScanning(true);
    try {
      const domains = competitors.map((c) => c.domain).join(', ');
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a competitor monitoring tool. Return JSON only.' },
          { role: 'user', content: `Simulate a weekly competitor content scan for these domains: ${domains}

Return JSON:
{
  "scans": [{ "domain": "domain.com", "newPages": number, "rankingChanges": number, "contentFrequency": "X posts/week", "topKeywords": ["kw1", "kw2", "kw3"] }],
  "alerts": [{ "domain": "domain.com", "type": "new_page"|"ranking_change"|"content_update", "title": "alert title", "detail": "description", "severity": "info"|"warning"|"critical" }]
}

Generate 2-3 alerts per domain and realistic scan data.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned);

      setScans(result.scans || []);
      const newAlerts: ContentChange[] = (result.alerts || []).map((a: Omit<ContentChange, 'id' | 'detected'>) => ({
        ...a,
        id: crypto.randomUUID(),
        detected: new Date().toISOString(),
      }));
      setAlerts((prev) => [...newAlerts, ...prev]);

      setCompetitors((prev) => prev.map((c) => ({
        ...c,
        lastScanned: new Date().toISOString(),
        contentCount: c.contentCount + (result.scans?.find((s: WeeklyScan) => s.domain === c.domain)?.newPages || 0),
      })));

      toast.success('Scan complete');
      setActiveTab('alerts');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const severityConfig = {
    info: { color: 'text-blue-400', bg: 'bg-blue-950/30', icon: Globe },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-950/30', icon: AlertCircle },
    critical: { color: 'text-red-400', bg: 'bg-red-950/30', icon: AlertCircle },
  };

  const typeLabel = {
    new_page: 'New Page',
    ranking_change: 'Ranking Change',
    content_update: 'Content Update',
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Radar className="size-6" />
              Competitor Monitoring
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track competitor content changes and ranking movements</p>
          </div>
          <Button onClick={runScan} disabled={scanning || competitors.length === 0}>
            {scanning ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
            Run Scan
          </Button>
        </div>

        <div className="flex gap-1 border-b border-border">
          {([
            { key: 'monitor', label: `Competitors (${competitors.length})` },
            { key: 'alerts', label: `Alerts (${alerts.length})` },
            { key: 'scans', label: 'Weekly Scans' },
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

        {/* Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="space-y-4">
            <Card className="border-border/30 bg-card/40">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="competitor-domain.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="flex-1 font-mono text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                  />
                  <Button onClick={addCompetitor}>
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {competitors.length === 0 ? (
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-6 text-center">
                  <Radar className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No competitors being monitored. Add domains above.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {competitors.map((c) => (
                  <Card key={c.id} className="border-border/30 bg-card/40">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-mono font-medium">{c.domain}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-2.5" />
                              {c.lastScanned ? `Scanned ${timeAgo(c.lastScanned)}` : 'Never scanned'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="size-2.5" />
                              {c.contentCount} pages detected
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 ${c.alertsEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={() => toggleAlerts(c.id)}
                          >
                            <Bell className="size-3.5" />
                            {c.alertsEnabled ? 'On' : 'Off'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400"
                            onClick={() => removeCompetitor(c.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-6 text-center">
                  <Bell className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No alerts yet. Run a scan to detect changes.</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;
                return (
                  <Card key={alert.id} className="border-border/30 bg-card/40">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-1.5 ${config.bg}`}>
                          <Icon className={`size-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{alert.title}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${config.bg} ${config.color}`}>
                              {typeLabel[alert.type]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="font-mono">{alert.domain}</span>
                            <span>•</span>
                            <span>{timeAgo(alert.detected)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Weekly Scans Tab */}
        {activeTab === 'scans' && (
          <div className="space-y-3">
            {scans.length === 0 ? (
              <Card className="border-border/30 bg-card/40">
                <CardContent className="pt-6 text-center">
                  <Radar className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No scan data yet. Run a scan first.</p>
                </CardContent>
              </Card>
            ) : (
              scans.map((scan) => (
                <Card key={scan.domain} className="border-border/30 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono">{scan.domain}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-3">
                      <div className="rounded-md border border-border/50 p-2 text-center">
                        <p className="text-lg font-bold flex items-center justify-center gap-1">
                          <FileText className="size-4 text-blue-400" /> {scan.newPages}
                        </p>
                        <p className="text-[10px] text-muted-foreground">New Pages</p>
                      </div>
                      <div className="rounded-md border border-border/50 p-2 text-center">
                        <p className="text-lg font-bold flex items-center justify-center gap-1">
                          {scan.rankingChanges > 0 ? <TrendingUp className="size-4 text-green-400" /> : <TrendingDown className="size-4 text-red-400" />}
                          {scan.rankingChanges}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Ranking Changes</p>
                      </div>
                      <div className="rounded-md border border-border/50 p-2 text-center">
                        <p className="text-lg font-bold">{scan.contentFrequency}</p>
                        <p className="text-[10px] text-muted-foreground">Content Frequency</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Top Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {scan.topKeywords.map((kw) => (
                          <span key={kw} className="rounded bg-muted/30 px-2 py-0.5 text-[10px]">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

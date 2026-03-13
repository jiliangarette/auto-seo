import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Key,
  Loader2,
  Activity,
  Shield,
  Webhook,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  projectId: string;
  projectName: string;
  key: string;
  created: string;
  lastUsed: string | null;
  calls: number;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

interface EndpointDef {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  sampleBody?: string;
}

const endpoints: EndpointDef[] = [
  { method: 'GET', path: '/api/v1/projects', description: 'List all projects' },
  { method: 'GET', path: '/api/v1/projects/:id/keywords', description: 'Get keywords for a project' },
  { method: 'POST', path: '/api/v1/analyze', description: 'Run content analysis', sampleBody: '{\n  "content": "Your content here...",\n  "keyword": "target keyword"\n}' },
  { method: 'POST', path: '/api/v1/generate', description: 'Generate SEO content', sampleBody: '{\n  "topic": "Topic here",\n  "keywords": ["kw1", "kw2"],\n  "tone": "professional"\n}' },
  { method: 'GET', path: '/api/v1/projects/:id/backlinks', description: 'Get backlinks for a project' },
  { method: 'POST', path: '/api/v1/audit', description: 'Run site audit', sampleBody: '{\n  "url": "https://example.com"\n}' },
  { method: 'GET', path: '/api/v1/projects/:id/report', description: 'Generate project report' },
  { method: 'DELETE', path: '/api/v1/projects/:id/keywords/:keywordId', description: 'Delete a keyword' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green-950/30 text-green-400',
  POST: 'bg-blue-950/30 text-blue-400',
  PUT: 'bg-yellow-950/30 text-yellow-400',
  DELETE: 'bg-red-950/30 text-red-400',
};

const allEvents = ['analysis.complete', 'audit.complete', 'keyword.added', 'report.generated', 'content.published'];

export default function ApiPlayground() {
  const { data: projects } = useProjects();
  const [activeTab, setActiveTab] = useState<'tester' | 'keys' | 'rate' | 'webhooks'>('tester');

  // Tester state
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [requestBody, setRequestBody] = useState(endpoints[0].sampleBody ?? '');
  const [response, setResponse] = useState('');
  const [testing, setTesting] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  // Rate limits
  const rateLimit = { limit: 1000, used: apiKeys.reduce((sum, k) => sum + k.calls, 0), period: 'month' };

  const selectEndpoint = (idx: number) => {
    setSelectedEndpoint(idx);
    setRequestBody(endpoints[idx].sampleBody ?? '');
    setResponse('');
  };

  const testEndpoint = async () => {
    setTesting(true);
    setResponse('');
    await new Promise((r) => setTimeout(r, 800));
    const ep = endpoints[selectedEndpoint];
    const mockResponse = {
      status: 200,
      data: ep.method === 'GET'
        ? { items: [{ id: '1', name: 'Sample item' }], total: 1 }
        : { success: true, message: `${ep.description} completed`, id: crypto.randomUUID().slice(0, 8) },
      meta: { requestId: crypto.randomUUID().slice(0, 12), latency: `${Math.floor(Math.random() * 200 + 50)}ms` },
    };
    setResponse(JSON.stringify(mockResponse, null, 2));
    setTesting(false);
    toast.success('Request completed');
  };

  const generateKey = () => {
    if (!projects?.length) {
      toast.error('Create a project first');
      return;
    }
    const project = projects[Math.floor(Math.random() * projects.length)];
    const key: ApiKey = {
      id: crypto.randomUUID(),
      projectId: project.id,
      projectName: project.name,
      key: `ask_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`,
      created: new Date().toISOString(),
      lastUsed: null,
      calls: 0,
    };
    setApiKeys((prev) => [...prev, key]);
    toast.success('API key generated');
  };

  const deleteKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success('API key revoked');
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('Key copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const addWebhook = () => {
    if (!newWebhookUrl.trim()) return;
    const wh: WebhookConfig = {
      id: crypto.randomUUID(),
      url: newWebhookUrl.trim(),
      events: ['analysis.complete'],
      active: true,
    };
    setWebhooks((prev) => [...prev, wh]);
    setNewWebhookUrl('');
    toast.success('Webhook added');
  };

  const toggleWebhookEvent = (whId: string, event: string) => {
    setWebhooks((prev) => prev.map((wh) => {
      if (wh.id !== whId) return wh;
      const events = wh.events.includes(event)
        ? wh.events.filter((e) => e !== event)
        : [...wh.events, event];
      return { ...wh, events };
    }));
  };

  const removeWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.success('Webhook removed');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="size-6" />
            API Playground
          </h1>
          <p className="text-muted-foreground">Test endpoints, manage API keys, and configure webhooks</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            { key: 'tester', label: 'Endpoint Tester', icon: Play },
            { key: 'keys', label: 'API Keys', icon: Key },
            { key: 'rate', label: 'Rate Limits', icon: Activity },
            { key: 'webhooks', label: 'Webhooks', icon: Webhook },
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

        {/* Endpoint Tester */}
        {activeTab === 'tester' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {endpoints.map((ep, i) => (
                  <button
                    key={i}
                    onClick={() => selectEndpoint(i)}
                    className={`w-full text-left rounded-md p-2 text-xs transition-colors ${
                      selectedEndpoint === i ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono truncate">{ep.path}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">{ep.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColors[endpoints[selectedEndpoint].method]}`}>
                      {endpoints[selectedEndpoint].method}
                    </span>
                    <span className="font-mono text-xs">{endpoints[selectedEndpoint].path}</span>
                  </CardTitle>
                  <Button size="sm" onClick={testEndpoint} disabled={testing}>
                    {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    Send
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {endpoints[selectedEndpoint].sampleBody && (
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground font-medium">Request Body</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs min-h-[120px] resize-y"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground font-medium">Response</label>
                  <pre className={`rounded-md border p-3 text-xs font-mono min-h-[120px] overflow-auto ${
                    response ? 'border-green-900/30 bg-green-950/10 text-green-400' : 'border-border bg-muted/20 text-muted-foreground'
                  }`}>
                    {response || 'Click "Send" to test this endpoint...'}
                  </pre>
                </div>
                <div className="rounded-md bg-muted/20 p-2 text-[10px] text-muted-foreground">
                  <p className="font-medium mb-1">cURL</p>
                  <code className="font-mono break-all">
                    curl -X {endpoints[selectedEndpoint].method} https://api.auto-seo.dev{endpoints[selectedEndpoint].path} -H &quot;Authorization: Bearer YOUR_API_KEY&quot;
                    {endpoints[selectedEndpoint].sampleBody ? ' -H "Content-Type: application/json" -d \'...\'' : ''}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* API Keys */}
        {activeTab === 'keys' && (
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="size-4" />
                  API Keys
                </CardTitle>
                <Button size="sm" onClick={generateKey}>
                  <Plus className="size-3.5" />
                  Generate Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API keys yet. Generate one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between rounded-md border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="size-3.5 text-green-400" />
                          <span className="text-xs font-medium">{k.projectName}</span>
                        </div>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{k.key}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Created {new Date(k.created).toLocaleDateString()} • {k.calls} calls
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyKey(k.key)}>
                          {copiedKey === k.key ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => deleteKey(k.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rate Limits */}
        {activeTab === 'rate' && (
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="size-4" />
                Rate Limiting Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border border-border/50 p-4 text-center">
                  <p className="text-2xl font-bold">{rateLimit.limit}</p>
                  <p className="text-xs text-muted-foreground">Monthly Limit</p>
                </div>
                <div className="rounded-md border border-border/50 p-4 text-center">
                  <p className={`text-2xl font-bold ${rateLimit.used > rateLimit.limit * 0.8 ? 'text-red-400' : 'text-green-400'}`}>
                    {rateLimit.used}
                  </p>
                  <p className="text-xs text-muted-foreground">Used This Month</p>
                </div>
                <div className="rounded-md border border-border/50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{rateLimit.limit - rateLimit.used}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Usage</span>
                  <span className="text-xs font-medium">{Math.round((rateLimit.used / rateLimit.limit) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rateLimit.used / rateLimit.limit > 0.8 ? 'bg-red-500' : rateLimit.used / rateLimit.limit > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((rateLimit.used / rateLimit.limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-md bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Rate Limit Headers</p>
                <code className="font-mono text-[10px] block">
                  X-RateLimit-Limit: {rateLimit.limit}<br />
                  X-RateLimit-Remaining: {rateLimit.limit - rateLimit.used}<br />
                  X-RateLimit-Reset: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()}
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks */}
        {activeTab === 'webhooks' && (
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Webhook className="size-4" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://your-server.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="flex-1 font-mono text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && addWebhook()}
                />
                <Button size="sm" onClick={addWebhook}>
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>

              {webhooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No webhooks configured. Add a URL above.</p>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono truncate flex-1">{wh.url}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${wh.active ? 'bg-green-950/30 text-green-400' : 'bg-red-950/30 text-red-400'}`}>
                            {wh.active ? 'active' : 'inactive'}
                          </span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => removeWebhook(wh.id)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {allEvents.map((event) => (
                          <button
                            key={event}
                            onClick={() => toggleWebhookEvent(wh.id, event)}
                            className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                              wh.events.includes(event)
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            {event}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

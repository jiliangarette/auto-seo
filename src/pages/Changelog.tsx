import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Megaphone,
  Sparkles,
  Bug,
  Wrench,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  Clock,
} from 'lucide-react';

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement';
  isNew: boolean;
}

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'open' | 'planned' | 'in-progress' | 'done';
  voted: boolean;
}

const changelogData: ChangelogEntry[] = [
  {
    id: '1', version: '7.0', date: '2026-03-13', title: 'Phase 7 — Premium Features',
    description: 'Team Collaboration, Custom Report Builder, API Playground, Internationalization, and Changelog.',
    type: 'feature', isNew: true,
  },
  {
    id: '2', version: '6.0', date: '2026-03-12', title: 'Data Intelligence & Automation',
    description: 'Keyword Clustering, Automated Content Scoring, Topic Authority Mapper, Backlink Quality Analyzer, and AI Writing Assistant.',
    type: 'feature', isNew: true,
  },
  {
    id: '3', version: '5.0', date: '2026-03-11', title: 'Enhanced UI & Research',
    description: 'Collapsible sidebar, animated cards, drag-and-drop calendar, competitive research dashboard, and advanced analytics.',
    type: 'improvement', isNew: false,
  },
  {
    id: '4', version: '4.0', date: '2026-03-10', title: 'Growth & Scale',
    description: 'AI Content Brief, Page Speed Insights, Schema Markup, Readability Analyzer, Social Media Preview, Multi-Project Dashboard.',
    type: 'feature', isNew: false,
  },
  {
    id: '5', version: '3.0', date: '2026-03-09', title: 'Polish, UX & Advanced',
    description: 'Dashboard overhaul, keyword difficulty, content optimizer, SERP preview, bulk operations, notifications, search, onboarding.',
    type: 'improvement', isNew: false,
  },
  {
    id: '6', version: '2.0', date: '2026-03-08', title: 'Advanced Features',
    description: 'Competitor analysis, backlink tracker, site audit, content calendar, rank history, reports, meta tags, internal links, settings.',
    type: 'feature', isNew: false,
  },
  {
    id: '7', version: '1.0', date: '2026-03-07', title: 'Core Platform',
    description: 'Authentication, projects, keyword tracker, content analyzer, content generator, and dashboard.',
    type: 'feature', isNew: false,
  },
  {
    id: '8', version: '2.1', date: '2026-03-08', title: 'Build system fixes',
    description: 'Fixed unused import warnings, verbatimModuleSyntax compliance, and TypeScript strict mode errors.',
    type: 'fix', isNew: false,
  },
];

const defaultRequests: FeatureRequest[] = [
  { id: '1', title: 'Google Search Console integration', description: 'Pull real ranking data from GSC API', votes: 42, status: 'planned', voted: false },
  { id: '2', title: 'WordPress plugin', description: 'Sync content directly to WordPress sites', votes: 38, status: 'open', voted: false },
  { id: '3', title: 'AI image alt-text generator', description: 'Auto-generate SEO-friendly alt text for images', votes: 31, status: 'in-progress', voted: false },
  { id: '4', title: 'Slack notifications', description: 'Push audit and ranking alerts to Slack channels', votes: 25, status: 'open', voted: false },
  { id: '5', title: 'Custom dashboards', description: 'Build personalized dashboard layouts', votes: 19, status: 'open', voted: false },
  { id: '6', title: 'Competitor email alerts', description: 'Get notified when competitors publish new content', votes: 15, status: 'planned', voted: false },
];

const typeConfig = {
  feature: { icon: Sparkles, color: 'text-green-400', bg: 'bg-green-950/30' },
  fix: { icon: Bug, color: 'text-red-400', bg: 'bg-red-950/30' },
  improvement: { icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-950/30' },
};

const statusColors: Record<string, string> = {
  open: 'bg-gray-800 text-gray-400',
  planned: 'bg-blue-950/30 text-blue-400',
  'in-progress': 'bg-yellow-950/30 text-yellow-400',
  done: 'bg-green-950/30 text-green-400',
};

export default function Changelog() {
  const [activeTab, setActiveTab] = useState<'changelog' | 'requests' | 'releases'>('changelog');
  const [requests, setRequests] = useState<FeatureRequest[]>(defaultRequests);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDesc, setNewRequestDesc] = useState('');
  const [seenVersions, setSeenVersions] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('auto-seo-seen-versions');
    return stored ? new Set(JSON.parse(stored)) : new Set<string>();
  });

  const newCount = changelogData.filter((e) => e.isNew && !seenVersions.has(e.version)).length;

  const markAllSeen = () => {
    const all = new Set(changelogData.map((e) => e.version));
    setSeenVersions(all);
    localStorage.setItem('auto-seo-seen-versions', JSON.stringify([...all]));
  };

  const voteRequest = (id: string) => {
    setRequests((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      return { ...r, votes: r.voted ? r.votes - 1 : r.votes + 1, voted: !r.voted };
    }));
  };

  const addRequest = () => {
    if (!newRequestTitle.trim()) return;
    const req: FeatureRequest = {
      id: crypto.randomUUID(),
      title: newRequestTitle.trim(),
      description: newRequestDesc.trim(),
      votes: 1,
      status: 'open',
      voted: true,
    };
    setRequests((prev) => [req, ...prev]);
    setNewRequestTitle('');
    setNewRequestDesc('');
  };

  const sortedRequests = [...requests].sort((a, b) => b.votes - a.votes);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Megaphone className="size-6" />
              Changelog
              {newCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {newCount} new
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">Release notes, feature requests, and what's new</p>
          </div>
          {newCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllSeen}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="flex gap-1 border-b border-border">
          {([
            { key: 'changelog', label: 'What\'s New' },
            { key: 'requests', label: 'Feature Requests' },
            { key: 'releases', label: 'Release Notes' },
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

        {/* Changelog */}
        {activeTab === 'changelog' && (
          <div className="space-y-3">
            {changelogData.map((entry) => {
              const config = typeConfig[entry.type];
              const Icon = config.icon;
              const isUnseen = entry.isNew && !seenVersions.has(entry.version);
              return (
                <Card key={entry.id} className={isUnseen ? 'border-primary/30' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-1.5 ${config.bg}`}>
                        <Icon className={`size-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">{entry.title}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">v{entry.version}</span>
                          {isUnseen && (
                            <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[9px] font-bold animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="size-2.5" /> {entry.date}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Feature Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  Submit a Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  placeholder="Feature title"
                  value={newRequestTitle}
                  onChange={(e) => setNewRequestTitle(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newRequestDesc}
                  onChange={(e) => setNewRequestDesc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRequest()}
                />
                <Button size="sm" onClick={addRequest} disabled={!newRequestTitle.trim()}>
                  Submit Request
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {sortedRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 rounded-md border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                  <button
                    onClick={() => voteRequest(req.id)}
                    className={`flex flex-col items-center rounded-md border px-2 py-1 text-xs transition-colors ${
                      req.voted ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <ChevronUp className="size-3.5" />
                    <span className="font-bold">{req.votes}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{req.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                    </div>
                    {req.description && <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>}
                  </div>
                  <ThumbsUp className={`size-4 ${req.voted ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Release Notes */}
        {activeTab === 'releases' && (
          <div className="space-y-4">
            {['7.0', '6.0', '5.0', '4.0', '3.0', '2.0', '1.0'].map((version) => {
              const entries = changelogData.filter((e) => e.version === version);
              if (entries.length === 0) return null;
              const main = entries[0];
              return (
                <Card key={version}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Version {version} — {main.title}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground">{main.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{main.description}</p>
                    {version === '7.0' && (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li className="flex items-center gap-1.5"><Sparkles className="size-3 text-green-400" /> Team Collaboration with invite + roles</li>
                        <li className="flex items-center gap-1.5"><Sparkles className="size-3 text-green-400" /> Custom Report Builder with PDF export</li>
                        <li className="flex items-center gap-1.5"><Sparkles className="size-3 text-green-400" /> API Playground with keys & webhooks</li>
                        <li className="flex items-center gap-1.5"><Sparkles className="size-3 text-green-400" /> Internationalization (i18n) tools</li>
                        <li className="flex items-center gap-1.5"><Sparkles className="size-3 text-green-400" /> Changelog & Feature Announcements</li>
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

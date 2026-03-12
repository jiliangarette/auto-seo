import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Search, Sparkles, Shield, FileText, Link2,
  Tags, Gauge, Code2, Eye, Wand2, BarChart3, BookOpen, Share2,
} from 'lucide-react';

const healthScore = 87;
const moduleCount = 100;

const topModules = [
  { label: 'Analyzer', path: '/analyzer', icon: Search, color: 'text-blue-400' },
  { label: 'Generator', path: '/generator', icon: Sparkles, color: 'text-green-400' },
  { label: 'Site Audit', path: '/audit', icon: Shield, color: 'text-red-400' },
  { label: 'Content Brief', path: '/brief', icon: FileText, color: 'text-purple-400' },
  { label: 'Meta Tags', path: '/meta-tags', icon: Tags, color: 'text-orange-400' },
  { label: 'Optimizer', path: '/optimizer', icon: Wand2, color: 'text-yellow-400' },
  { label: 'Page Speed', path: '/speed', icon: Gauge, color: 'text-pink-400' },
  { label: 'Schema', path: '/schema', icon: Code2, color: 'text-cyan-400' },
  { label: 'SERP Preview', path: '/serp-preview', icon: Eye, color: 'text-indigo-400' },
  { label: 'Backlinks', path: '/backlink-quality', icon: Link2, color: 'text-emerald-400' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, color: 'text-sky-400' },
  { label: 'Readability', path: '/readability', icon: BookOpen, color: 'text-rose-400' },
];

const recentActivity = [
  { action: 'Content audit completed', module: 'Site Audit', time: '2m ago' },
  { action: 'Keywords analyzed for "react seo"', module: 'Analyzer', time: '15m ago' },
  { action: 'Meta descriptions generated (12 pages)', module: 'Bulk Meta', time: '32m ago' },
  { action: 'Pillar strategy created for "SaaS Marketing"', module: 'Pillars', time: '1h ago' },
  { action: 'Broken link scan completed', module: 'Broken Links', time: '2h ago' },
  { action: 'SEO checklist generated for product page', module: 'Checklist', time: '3h ago' },
  { action: 'Competitor backlink profile analyzed', module: 'Backlink Spy', time: '4h ago' },
  { action: 'Title tag variants tested', module: 'Title Tester', time: '5h ago' },
];

const categoryScores = [
  { category: 'Technical SEO', score: 92 },
  { category: 'On-Page SEO', score: 85 },
  { category: 'Content Quality', score: 88 },
  { category: 'Link Profile', score: 78 },
  { category: 'Mobile & UX', score: 91 },
  { category: 'Page Speed', score: 84 },
];

export default function SeoDashboardSummary() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="size-6" />
            SEO Dashboard Summary
          </h1>
          <p className="text-muted-foreground">Aggregate platform health across all {moduleCount} modules</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/20">
            <CardContent className="pt-4 text-center">
              <p className={`text-4xl font-bold ${healthScore >= 80 ? 'text-green-400' : healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {healthScore}
              </p>
              <p className="text-[10px] text-muted-foreground">Overall Health Score</p>
              <div className="h-1.5 rounded-full bg-muted/30 mt-2">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${healthScore}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{moduleCount}</p>
              <p className="text-[10px] text-muted-foreground">Active Modules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">415</p>
              <p className="text-[10px] text-muted-foreground">Features Built</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-400">18</p>
              <p className="text-[10px] text-muted-foreground">Phases Complete</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {categoryScores.map((cs, idx) => (
                <div key={idx} className="rounded-md border border-border/50 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{cs.category}</span>
                    <span className={`text-sm font-bold ${cs.score >= 80 ? 'text-green-400' : cs.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{cs.score}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/30">
                    <div className={`h-full rounded-full ${cs.score >= 80 ? 'bg-green-500' : cs.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${cs.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Share2 className="size-3.5" /> Quick Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              {topModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Button
                    key={mod.path}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1.5"
                    onClick={() => navigate(mod.path)}
                  >
                    <Icon className={`size-5 ${mod.color}`} />
                    <span className="text-xs">{mod.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.action}</p>
                    <span className="text-[9px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{activity.module}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

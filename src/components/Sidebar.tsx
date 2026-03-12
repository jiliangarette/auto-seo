import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import GlobalSearch from '@/components/GlobalSearch';
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  Sparkles,
  Shield,
  CalendarDays,
  FileBarChart,
  Eye,
  Wand2,
  Tags,
  Link2,
  Settings,
  BookText,
  Share2,
  LayoutGrid,
  Code2,
  Gauge,
  FileText,
  Swords,
  BarChart3,
  Zap,
  LogOut,
  Bell,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Users,
  Clock,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  desc?: string;
}

interface NavCategory {
  label: string;
  icon: LucideIcon;
  color: string;
  items: NavItem[];
}

const categories: NavCategory[] = [
  {
    label: 'Home',
    icon: LayoutDashboard,
    color: 'text-blue-400',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, desc: 'Overview of your SEO' },
      { label: 'Projects', path: '/projects', icon: FolderKanban, desc: 'Manage your websites' },
      { label: 'Multi-Dashboard', path: '/multi-dashboard', icon: LayoutGrid, desc: 'Compare all projects' },
    ],
  },
  {
    label: 'Analyze',
    icon: Search,
    color: 'text-emerald-400',
    items: [
      { label: 'Site Audit', path: '/audit', icon: Shield, desc: 'Full SEO checkup' },
      { label: 'Analyzer', path: '/analyzer', icon: Search, desc: 'Content analysis' },
      { label: 'Speed Analyzer', path: '/speed-analyzer', icon: Zap, desc: 'Page performance' },
      { label: 'Health Monitor', path: '/health-monitor', icon: Gauge, desc: 'Ongoing health' },
      { label: 'Page Speed', path: '/speed', icon: Gauge, desc: 'Speed insights' },
      { label: 'Web Vitals', path: '/cwv', icon: Gauge, desc: 'Core Web Vitals' },
      { label: 'E-E-A-T', path: '/eeat', icon: Shield, desc: 'Authority check' },
      { label: 'Broken Links', path: '/broken-links', icon: Link2, desc: 'Find 404s' },
      { label: 'Redirects', path: '/redirect-checker', icon: Link2, desc: 'Chain checker' },
      { label: 'Log Analyzer', path: '/log-analyzer', icon: FileText, desc: 'Crawl logs' },
      { label: 'Robots.txt', path: '/robots-txt', icon: Shield, desc: 'Robot rules' },
      { label: 'Canonicals', path: '/canonical-checker', icon: Tags, desc: 'Canonical URLs' },
      { label: 'Sitemap', path: '/sitemap', icon: FolderKanban, desc: 'Sitemap check' },
      { label: 'XML Sitemap', path: '/xml-sitemap', icon: Code2, desc: 'Generate XML' },
      { label: 'Compliance', path: '/compliance', icon: Check, desc: 'SEO rules' },
      { label: 'Penalty Check', path: '/penalty-checker', icon: Shield, desc: 'Detect penalties' },
      { label: 'Audit Schedule', path: '/audit-scheduler', icon: Shield, desc: 'Auto audits' },
      { label: 'Bulk Analyzer', path: '/bulk-page-analyzer', icon: LayoutGrid, desc: 'Many pages' },
    ],
  },
  {
    label: 'Content',
    icon: Sparkles,
    color: 'text-violet-400',
    items: [
      { label: 'Generator', path: '/generator', icon: Sparkles, desc: 'AI content writer' },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays, desc: 'Plan content' },
      { label: 'Calendar AI', path: '/content-calendar-ai', icon: CalendarDays, desc: 'AI planning' },
      { label: 'Optimizer', path: '/optimizer', icon: Wand2, desc: 'Improve content' },
      { label: 'Content Brief', path: '/brief', icon: FileText, desc: 'Create briefs' },
      { label: 'Brief Templates', path: '/brief-templates', icon: FileText, desc: 'Template library' },
      { label: 'Readability', path: '/readability', icon: BookText, desc: 'Read score' },
      { label: 'Grader', path: '/readability-grader', icon: BookText, desc: 'Content grade' },
      { label: 'Writing Assistant', path: '/writing-assistant', icon: Sparkles, desc: 'AI helper' },
      { label: 'Rewriter', path: '/rewriter', icon: Wand2, desc: 'Rewrite text' },
      { label: 'Summarizer', path: '/content-summarizer', icon: FileText, desc: 'Summarize' },
      { label: 'Tone Analyzer', path: '/tone-analyzer', icon: Sparkles, desc: 'Check tone' },
      { label: 'Content Length', path: '/content-length', icon: BarChart3, desc: 'Length analysis' },
      { label: 'Content Gaps', path: '/content-gaps', icon: Search, desc: 'Find gaps' },
      { label: 'Content Pillars', path: '/content-pillars', icon: FileText, desc: 'Topic pillars' },
      { label: 'Content ROI', path: '/content-roi', icon: BarChart3, desc: 'ROI tracking' },
      { label: 'Content Decay', path: '/content-decay', icon: Clock, desc: 'Aging content' },
      { label: 'Decay Detector', path: '/content-decay-detector', icon: Clock, desc: 'Detect decay' },
      { label: 'Freshness', path: '/freshness-planner', icon: CalendarDays, desc: 'Keep fresh' },
      { label: 'Repurposer', path: '/repurpose', icon: Share2, desc: 'Repurpose' },
      { label: 'Repurpose', path: '/content-repurpose', icon: Share2, desc: 'AI repurpose' },
      { label: 'Templates', path: '/content-templates', icon: BookText, desc: 'Content templates' },
      { label: 'Content Funnel', path: '/content-funnel', icon: FileText, desc: 'Funnel builder' },
      { label: 'Content Velocity', path: '/content-velocity', icon: Gauge, desc: 'Output speed' },
      { label: 'Distribution', path: '/distribution', icon: Share2, desc: 'Distribute' },
      { label: 'A/B Testing', path: '/ab-test', icon: BarChart3, desc: 'Test content' },
      { label: 'Sentiment', path: '/sentiment', icon: Sparkles, desc: 'Sentiment analysis' },
      { label: 'Scoring', path: '/content-scoring', icon: Gauge, desc: 'Score content' },
      { label: 'Audit Scorer', path: '/content-audit-scorer', icon: FileBarChart, desc: 'Audit score' },
      { label: 'Performance', path: '/content-performance', icon: BarChart3, desc: 'Track results' },
      { label: 'Readiness', path: '/readiness', icon: Check, desc: 'Publish ready?' },
      { label: 'CTA Optimizer', path: '/cta-optimizer', icon: LayoutDashboard, desc: 'Better CTAs' },
      { label: 'Localization', path: '/localization', icon: Share2, desc: 'Localize content' },
    ],
  },
  {
    label: 'Keywords',
    icon: Tags,
    color: 'text-amber-400',
    items: [
      { label: 'Keyword Research', path: '/keyword-research', icon: Search, desc: 'Find keywords' },
      { label: 'Keyword Gap', path: '/keyword-gap', icon: Search, desc: 'Gap analysis' },
      { label: 'Clustering', path: '/clustering', icon: LayoutGrid, desc: 'Group keywords' },
      { label: 'Cluster Pro', path: '/keyword-clustering-pro', icon: Tags, desc: 'Advanced clustering' },
      { label: 'Density', path: '/keyword-density', icon: BarChart3, desc: 'Density check' },
      { label: 'Intent', path: '/keyword-intent', icon: Search, desc: 'Search intent' },
      { label: 'Intent Classifier', path: '/intent-classifier', icon: Search, desc: 'Classify intent' },
      { label: 'Intent Mapper', path: '/search-intent-mapper', icon: Search, desc: 'Map intents' },
      { label: 'Cannibalization', path: '/cannibalization', icon: Swords, desc: 'Keyword conflicts' },
      { label: 'KW Map', path: '/cannibalization-map', icon: Swords, desc: 'Visual map' },
      { label: 'KW Finder', path: '/keyword-opportunities', icon: Search, desc: 'Opportunities' },
      { label: 'Topical Map', path: '/topical-map', icon: Share2, desc: 'Topic clusters' },
      { label: 'Topic Authority', path: '/topical-authority-score', icon: Shield, desc: 'Authority score' },
    ],
  },
  {
    label: 'Technical',
    icon: Code2,
    color: 'text-cyan-400',
    items: [
      { label: 'Meta Tags', path: '/meta-tags', icon: Tags, desc: 'Generate meta' },
      { label: 'Meta Optimizer', path: '/meta-optimizer', icon: Tags, desc: 'Optimize meta' },
      { label: 'Title Optimizer', path: '/title-optimizer', icon: Wand2, desc: 'Better titles' },
      { label: 'Title Tester', path: '/title-tester', icon: Tags, desc: 'Test titles' },
      { label: 'Bulk Meta', path: '/meta-bulk', icon: Tags, desc: 'Bulk optimize' },
      { label: 'Schema', path: '/schema', icon: Code2, desc: 'JSON-LD' },
      { label: 'Schema Validator', path: '/structured-data', icon: Code2, desc: 'Validate schema' },
      { label: 'FAQ Schema', path: '/faq-schema', icon: Code2, desc: 'FAQ markup' },
      { label: 'Snippets', path: '/rich-snippet-tester', icon: Code2, desc: 'Rich snippets' },
      { label: 'SERP Preview', path: '/serp-preview', icon: Eye, desc: 'Search preview' },
      { label: 'Social Preview', path: '/social', icon: Share2, desc: 'Social cards' },
      { label: 'Internal Links', path: '/internal-links', icon: Link2, desc: 'Link structure' },
      { label: 'Link Audit', path: '/link-audit', icon: Link2, desc: 'Audit links' },
      { label: 'PageRank Flow', path: '/pagerank-flow', icon: Code2, desc: 'Link equity' },
      { label: 'Headings', path: '/heading-analyzer', icon: FileText, desc: 'H1-H6 analysis' },
      { label: 'Image SEO', path: '/image-seo', icon: Eye, desc: 'Image optimization' },
      { label: 'Slug Optimizer', path: '/slug-optimizer', icon: Link2, desc: 'URL slugs' },
      { label: 'Hreflang', path: '/hreflang-generator', icon: LayoutGrid, desc: 'Multi-language' },
      { label: 'i18n', path: '/i18n', icon: LayoutGrid, desc: 'Internationalization' },
      { label: 'Migration', path: '/seo-migration', icon: Code2, desc: 'Site migration' },
      { label: 'Entity SEO', path: '/entity-seo', icon: Tags, desc: 'Entity optimization' },
    ],
  },
  {
    label: 'Competitors',
    icon: Swords,
    color: 'text-orange-400',
    items: [
      { label: 'Competitive', path: '/competitive', icon: Swords, desc: 'Research' },
      { label: 'Keyword Gap', path: '/keyword-gap-old', icon: Swords, desc: 'Keyword gaps' },
      { label: 'Backlink Spy', path: '/backlink-analyzer', icon: Link2, desc: 'Spy backlinks' },
      { label: 'Backlink Gap', path: '/backlink-gap', icon: Link2, desc: 'Link gaps' },
      { label: 'Backlink Spy', path: '/backlink-spy', icon: Eye, desc: 'Link spying' },
      { label: 'Link Intersect', path: '/link-intersection', icon: Link2, desc: 'Common links' },
      { label: 'Link Scorer', path: '/link-scorer', icon: Link2, desc: 'Quality score' },
      { label: 'Anchor Text', path: '/anchor-text', icon: Link2, desc: 'Anchor analysis' },
      { label: 'Anchor Plan', path: '/anchor-text-planner', icon: Link2, desc: 'Plan anchors' },
      { label: 'Monitoring', path: '/competitor-monitoring', icon: Eye, desc: 'Track competitors' },
      { label: 'Content Tracker', path: '/competitor-content', icon: Eye, desc: 'Track content' },
      { label: 'Alerts', path: '/competitor-alerts', icon: Bell, desc: 'Get alerts' },
      { label: 'Playbook', path: '/competitor-playbook', icon: Swords, desc: 'Strategy' },
      { label: 'SERP Tracker', path: '/serp-tracker', icon: BarChart3, desc: 'Track SERPs' },
      { label: 'Intel Hub', path: '/intel-hub', icon: Swords, desc: 'Intelligence' },
      { label: 'Outreach', path: '/outreach', icon: Link2, desc: 'Link outreach' },
      { label: 'Link Outreach', path: '/link-outreach', icon: Link2, desc: 'Build links' },
      { label: 'Outreach Email', path: '/outreach-emails', icon: Share2, desc: 'Email templates' },
    ],
  },
  {
    label: 'Reports',
    icon: FileBarChart,
    color: 'text-purple-400',
    items: [
      { label: 'Reports', path: '/reports', icon: FileBarChart, desc: 'View reports' },
      { label: 'Report Builder', path: '/report-builder', icon: FileBarChart, desc: 'Build reports' },
      { label: 'Audit Report', path: '/audit-report', icon: FileBarChart, desc: 'Audit reports' },
      { label: 'Client Report', path: '/client-report', icon: FileBarChart, desc: 'Client view' },
      { label: 'Analytics', path: '/analytics', icon: BarChart3, desc: 'Analytics' },
      { label: 'SEO Score', path: '/seo-score', icon: Gauge, desc: 'Score dashboard' },
      { label: 'SEO ROI', path: '/seo-roi', icon: BarChart3, desc: 'ROI tracking' },
      { label: 'Revenue Calc', path: '/revenue-calc', icon: Gauge, desc: 'Revenue estimate' },
      { label: 'Budget', path: '/seo-budget', icon: Gauge, desc: 'Budget planning' },
      { label: 'Forecast', path: '/seo-forecast', icon: BarChart3, desc: 'SEO forecasting' },
      { label: 'Forecaster', path: '/seo-forecaster', icon: BarChart3, desc: 'Predict growth' },
      { label: 'SERP Features', path: '/serp-features', icon: Eye, desc: 'Feature tracking' },
      { label: 'SERP Volatility', path: '/serp-volatility', icon: Gauge, desc: 'SERP changes' },
      { label: 'SEO Trends', path: '/seo-trends', icon: BarChart3, desc: 'Trend analysis' },
      { label: 'CTR Optimizer', path: '/ctr-optimizer', icon: Eye, desc: 'Click rates' },
      { label: 'Brand SERP', path: '/brand-serp', icon: Eye, desc: 'Brand search' },
      { label: 'Benchmarking', path: '/benchmarking', icon: Gauge, desc: 'Compare metrics' },
      { label: 'SEO Summary', path: '/seo-summary', icon: LayoutDashboard, desc: 'Quick summary' },
    ],
  },
  {
    label: 'Tools',
    icon: Wand2,
    color: 'text-pink-400',
    items: [
      { label: 'Bulk Ops', path: '/bulk', icon: FolderKanban, desc: 'Bulk operations' },
      { label: 'SEO Tasks', path: '/seo-tasks', icon: FolderKanban, desc: 'Task manager' },
      { label: 'Task Priority', path: '/task-priority', icon: Tags, desc: 'Prioritize tasks' },
      { label: 'Workflows', path: '/workflows', icon: Wand2, desc: 'Automate work' },
      { label: 'SEO Checklist', path: '/seo-checklist', icon: Shield, desc: 'Checklist' },
      { label: 'A/B Test', path: '/seo-ab-test', icon: Swords, desc: 'Split tests' },
      { label: 'Split Tests', path: '/split-tests', icon: Swords, desc: 'Run tests' },
      { label: 'Experiments', path: '/seo-experiment-log', icon: FileText, desc: 'Log experiments' },
      { label: 'SEO Alerts', path: '/seo-alerts', icon: Bell, desc: 'Alert system' },
      { label: 'Knowledge Base', path: '/seo-knowledge-base', icon: BookText, desc: 'SEO guides' },
      { label: 'API Playground', path: '/api-playground', icon: Code2, desc: 'Test APIs' },
      { label: 'API Rates', path: '/api-rates', icon: Gauge, desc: 'API usage' },
      { label: 'SEO Widgets', path: '/seo-widgets', icon: LayoutGrid, desc: 'Dashboard widgets' },
      { label: 'Widgets', path: '/widgets', icon: LayoutGrid, desc: 'Custom widgets' },
      { label: 'Change Log', path: '/change-log', icon: FileBarChart, desc: 'SEO changes' },
      { label: 'Multi-Site', path: '/multi-site', icon: LayoutGrid, desc: 'Manage sites' },
      { label: 'Duplicates', path: '/duplicate-checker', icon: Search, desc: 'Find duplicates' },
      { label: 'Search Console', path: '/search-console', icon: Search, desc: 'GSC data' },
    ],
  },
  {
    label: 'Niche',
    icon: BarChart3,
    color: 'text-teal-400',
    items: [
      { label: 'Local SEO', path: '/local-seo', icon: Search, desc: 'Local search' },
      { label: 'E-commerce SEO', path: '/ecommerce-seo', icon: Tags, desc: 'Shop SEO' },
      { label: 'Video SEO', path: '/video-seo', icon: Eye, desc: 'Video optimization' },
      { label: 'Podcast SEO', path: '/podcast-seo', icon: BookText, desc: 'Podcast SEO' },
      { label: 'News SEO', path: '/news-seo', icon: FileText, desc: 'News optimization' },
      { label: 'Snippets', path: '/featured-snippet', icon: Search, desc: 'Win snippets' },
      { label: 'Team', path: '/team', icon: Users, desc: 'Collaboration' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    color: 'text-muted-foreground',
    items: [
      { label: 'Changelog', path: '/changelog', icon: BarChart3, desc: 'App updates' },
      { label: 'Settings', path: '/settings', icon: Settings, desc: 'Preferences' },
    ],
  },
];

const typeColors: Record<string, string> = {
  analysis: 'bg-blue-950/30 text-blue-400',
  audit: 'bg-red-950/30 text-red-400',
  report: 'bg-purple-950/30 text-purple-400',
  content: 'bg-green-950/30 text-green-400',
  info: 'bg-muted text-muted-foreground',
};

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(() => {
    // Auto-open the category containing the current page
    const active = categories.find(c => c.items.some(i => i.path === location.pathname));
    return new Set(active ? [active.label, 'Home'] : ['Home']);
  });
  const notifRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  const toggleCat = (label: string) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  // Find current page for breadcrumb
  const allItems = categories.flatMap(c => c.items);
  const currentItem = allItems.find(n => n.path === location.pathname);
  const breadcrumbLabel = currentItem?.label ?? 'Page';

  const renderNav = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-border/50">
        <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-violet-500/20">
          A
        </div>
        {(!collapsed || isMobile) && <span className="font-bold text-sm tracking-tight">Auto-SEO</span>}
      </div>

      {/* Categorized nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {categories.map((cat) => {
          const isOpen = openCats.has(cat.label);
          const CatIcon = cat.icon;
          const hasActive = cat.items.some(i => i.path === location.pathname);

          if (collapsed && !isMobile) {
            // Collapsed: show only category icons
            return (
              <div key={cat.label} className="py-1">
                <button
                  onClick={() => toggleCat(cat.label)}
                  className={`w-full flex items-center justify-center rounded-md p-2 transition-colors ${hasActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  title={cat.label}
                >
                  <CatIcon className="size-4" />
                </button>
              </div>
            );
          }

          return (
            <div key={cat.label}>
              <button
                onClick={() => toggleCat(cat.label)}
                className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${hasActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <CatIcon className={`size-3.5 ${cat.color}`} />
                <span className="flex-1 text-left uppercase tracking-wider">{cat.label}</span>
                <ChevronDown className={`size-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="ml-2 mt-0.5 space-y-px border-l border-border/30 pl-2">
                  {cat.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                        className={`group w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                        title={item.desc}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {isActive && <div className="ml-auto w-1 h-3.5 rounded-full bg-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border/50 p-2 space-y-1">
        {(!collapsed || isMobile) && (
          <p className="text-[10px] text-muted-foreground truncate px-2.5 py-1">{user?.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border/50 ${sidebarWidth} transition-all duration-200 shrink-0 sticky top-0 h-screen`}>
        {renderNav()}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-7 z-10 size-6 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background border-r border-border z-50 animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-bold text-sm">Auto-SEO</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="h-[calc(100%-49px)]">
              {renderNav(true)}
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur px-4 py-2 flex items-center gap-3">
          <button className="md:hidden p-1 hover:bg-muted rounded-md" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-1.5 text-sm">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{breadcrumbLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />

            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative rounded-md p-1.5 hover:bg-muted transition-colors"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-background shadow-lg">
                  <div className="flex items-center justify-between border-b border-border p-3">
                    <span className="text-sm font-medium">Notifications</span>
                    <div className="flex gap-1">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <Check className="size-3" /> Read all
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 ml-2">
                          <Trash2 className="size-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`w-full text-left px-3 py-2 border-b border-border/30 hover:bg-muted/50 transition-colors ${
                            !n.read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${typeColors[n.type] ?? typeColors.info}`}>
                              {n.type}
                            </span>
                            <span className="text-xs font-medium truncate flex-1">{n.title}</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{n.detail}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

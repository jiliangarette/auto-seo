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
  LogOut,
  Bell,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Multi-Dashboard', path: '/multi-dashboard', icon: LayoutGrid },
  { label: 'Analyzer', path: '/analyzer', icon: Search },
  { label: 'Generator', path: '/generator', icon: Sparkles },
  { label: 'Audit', path: '/audit', icon: Shield },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Reports', path: '/reports', icon: FileBarChart },
  { label: 'SERP Preview', path: '/serp-preview', icon: Eye },
  { label: 'Optimizer', path: '/optimizer', icon: Wand2 },
  { label: 'Meta Tags', path: '/meta-tags', icon: Tags },
  { label: 'Internal Links', path: '/internal-links', icon: Link2 },
  { label: 'Content Brief', path: '/brief', icon: FileText },
  { label: 'Page Speed', path: '/speed', icon: Gauge },
  { label: 'Schema', path: '/schema', icon: Code2 },
  { label: 'Readability', path: '/readability', icon: BookText },
  { label: 'Social Preview', path: '/social', icon: Share2 },
  { label: 'Competitive', path: '/competitive', icon: Swords },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Clustering', path: '/clustering', icon: LayoutGrid },
  { label: 'Bulk Ops', path: '/bulk', icon: FolderKanban },
  { label: 'Settings', path: '/settings', icon: Settings },
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

  // Close mobile drawer on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Close notification dropdown on outside click
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

  const sidebarWidth = collapsed ? 'w-16' : 'w-56';

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-border">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          AS
        </div>
        {!collapsed && <span className="font-bold text-sm">Auto-SEO</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-1">
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground truncate px-2.5 py-1">{user?.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  // Breadcrumb
  const currentItem = navItems.find((n) => n.path === location.pathname);
  const breadcrumbLabel = currentItem?.label ?? 'Page';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border ${sidebarWidth} transition-all duration-200 shrink-0 sticky top-0 h-screen`}>
        {navContent}
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
              {/* Re-render nav with collapsed=false for mobile */}
              <div className="flex flex-col h-full">
                <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setMobileOpen(false); }}
                        className={`w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="border-t border-border p-2">
                  <p className="text-[10px] text-muted-foreground truncate px-2.5 py-1">{user?.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="size-4 shrink-0" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur px-4 py-2 flex items-center gap-3">
          <button className="md:hidden p-1 hover:bg-muted rounded-md" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{breadcrumbLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />

            {/* Notification Bell */}
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

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

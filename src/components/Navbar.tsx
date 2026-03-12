import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import GlobalSearch from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, Check, Trash2 } from 'lucide-react';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Analyzer', path: '/analyzer' },
  { label: 'Generator', path: '/generator' },
  { label: 'Audit', path: '/audit' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Reports', path: '/reports' },
  { label: 'SERP', path: '/serp-preview' },
  { label: 'Optimizer', path: '/optimizer' },
  { label: 'Meta Tags', path: '/meta-tags' },
  { label: 'Links', path: '/internal-links' },
  { label: 'Settings', path: '/settings' },
];

const typeColors = {
  analysis: 'bg-blue-950/30 text-blue-400',
  audit: 'bg-red-950/30 text-red-400',
  report: 'bg-purple-950/30 text-purple-400',
  content: 'bg-green-950/30 text-green-400',
  info: 'bg-muted text-muted-foreground',
};

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
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

  return (
    <nav className="border-b border-border bg-background px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-foreground">
            Auto-SEO
          </button>
          <div className="flex gap-1 flex-wrap">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={location.pathname === link.path ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
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
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${typeColors[n.type]}`}>
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

          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}

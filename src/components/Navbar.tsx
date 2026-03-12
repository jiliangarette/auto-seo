import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Analyzer', path: '/analyzer' },
  { label: 'Generator', path: '/generator' },
  { label: 'Audit', path: '/audit' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Reports', path: '/reports' },
  { label: 'Meta Tags', path: '/meta-tags' },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="border-b border-border bg-background px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-foreground">
            Auto-SEO
          </button>
          <div className="flex gap-1">
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
        <div className="flex items-center gap-4">
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

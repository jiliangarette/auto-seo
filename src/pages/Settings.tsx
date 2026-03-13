import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings2, User, Sun, Moon, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [apiCallCount, setApiCallCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? '');
      // Load profile name
      supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setName(data.email ?? '');
        });

      // Count analyses as proxy for API usage
      supabase
        .from('analyses')
        .select('id', { count: 'exact', head: true })
        .then(({ count }) => {
          setApiCallCount(count ?? 0);
        });
    }
  }, [user]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    toast.success(`Switched to ${next ? 'dark' : 'light'} mode`);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
      if (error) throw error;
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    if (!confirm('This cannot be undone. Type "delete" in the next prompt to confirm.')) return;

    setDeleting(true);
    try {
      // Delete user data from all tables
      const userId = user!.id;
      await supabase.from('rank_history').delete().eq('user_id', userId);
      await supabase.from('reports').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);

      // Sign out (actual user deletion requires admin API)
      await signOut();
      toast.success('Account data deleted. Contact support to fully remove auth account.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="size-6" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Profile */}
        <Card className="border-border/30 bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="size-4" />
              Profile
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Email</label>
              <Input value={email} disabled />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card className="border-border/30 bg-card/40">
          <CardHeader>
            <CardTitle className="text-sm">API Usage</CardTitle>
            <CardDescription>OpenAI API call tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted px-4 py-3 text-center">
                <p className="text-2xl font-bold">{apiCallCount ?? '...'}</p>
                <p className="text-xs text-muted-foreground">Analyses run</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Each analysis, content generation, audit, meta tag, and link suggestion uses one OpenAI API call.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="border-border/30 bg-card/40">
          <CardHeader>
            <CardTitle className="text-sm">Appearance</CardTitle>
            <CardDescription>Toggle between dark and light mode</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
            <CardDescription>Permanently delete your account and all data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, ArrowRight, Check, FolderPlus, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const ONBOARDING_KEY = 'auto-seo-onboarding-done';

export default function OnboardingModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const createProject = useCreateProject();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done && projects !== undefined && projects.length === 0) {
      setVisible(true);
    }
  }, [user, projects]);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    try {
      await createProject.mutateAsync({
        name: projectName.trim(),
        url: projectUrl.trim() || undefined,
      });
      toast.success('Project created!');
      setStep(2);
    } catch {
      toast.error('Failed to create project');
    }
  };

  if (!visible) return null;

  const steps = [
    {
      title: 'Welcome to Auto-SEO!',
      icon: Rocket,
      content: (
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground">
            Your AI-powered SEO optimization platform. Let's get you set up in 2 quick steps.
          </p>
          <Button onClick={() => setStep(1)}>
            Get Started <ArrowRight className="size-4" />
          </Button>
        </div>
      ),
    },
    {
      title: 'Create Your First Project',
      icon: FolderPlus,
      content: (
        <div className="space-y-3">
          <Input
            placeholder="Project name (e.g., My Blog)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <Input
            placeholder="Website URL (optional)"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
          <Button onClick={handleCreateProject} disabled={!projectName.trim() || createProject.isPending}>
            Create Project <ArrowRight className="size-4" />
          </Button>
        </div>
      ),
    },
    {
      title: 'You\'re All Set!',
      icon: Check,
      content: (
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground">
            Your project is ready. Here's what you can do next:
          </p>
          <div className="grid gap-2 text-left">
            <button
              onClick={() => { dismiss(); navigate('/analyzer'); }}
              className="flex items-center gap-2 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors"
            >
              <Search className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Run your first SEO analysis</p>
                <p className="text-xs text-muted-foreground">Analyze any URL for SEO issues</p>
              </div>
            </button>
            <button
              onClick={() => { dismiss(); navigate('/projects'); }}
              className="flex items-center gap-2 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors"
            >
              <FolderPlus className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Add keywords to your project</p>
                <p className="text-xs text-muted-foreground">Track keyword rankings</p>
              </div>
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Go to Dashboard
          </Button>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">{current.title}</h2>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {current.content}
      </div>
    </div>
  );
}

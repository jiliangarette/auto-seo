import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteContext } from '@/contexts/SiteContext';
import { ChevronDown, Globe, X, FolderKanban } from 'lucide-react';

const DOT_COLORS = [
  'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-pink-500', 'bg-blue-500', 'bg-orange-500',
];

interface ProjectSwitcherProps {
  collapsed?: boolean;
}

export default function ProjectSwitcher({ collapsed = false }: ProjectSwitcherProps) {
  const { projects, selectedProject, selectProject, clearProject } = useSiteContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (collapsed) {
    return (
      <div className="px-2 py-2 border-b border-border/50">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
          title={selectedProject ? selectedProject.name : 'Select a website'}
        >
          <div className={`size-3 rounded-full ${selectedProject ? DOT_COLORS[projects.indexOf(selectedProject) % DOT_COLORS.length] : 'bg-muted-foreground/30'}`} />
        </button>
        {open && (
          <div className="absolute left-16 top-16 z-50 w-56 rounded-lg border border-border bg-background shadow-xl">
            <DropdownContent
              projects={projects}
              selectedProject={selectedProject}
              onSelect={(id) => { selectProject(id); setOpen(false); }}
              onClear={() => { clearProject(); setOpen(false); }}
              onManage={() => { navigate('/projects'); setOpen(false); }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 rounded-lg border border-border/30 bg-muted/30 px-2.5 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <div className={`size-2.5 rounded-full shrink-0 ${selectedProject ? DOT_COLORS[projects.indexOf(selectedProject) % DOT_COLORS.length] : 'bg-muted-foreground/30'}`} />
        <div className="flex-1 min-w-0">
          {selectedProject ? (
            <>
              <p className="text-xs font-medium truncate">{selectedProject.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{selectedProject.url ?? 'No URL set'}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Select a website...</p>
          )}
        </div>
        <ChevronDown className={`size-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-border bg-background shadow-xl overflow-hidden">
          <DropdownContent
            projects={projects}
            selectedProject={selectedProject}
            onSelect={(id) => { selectProject(id); setOpen(false); }}
            onClear={() => { clearProject(); setOpen(false); }}
            onManage={() => { navigate('/projects'); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

function DropdownContent({
  projects,
  selectedProject,
  onSelect,
  onClear,
  onManage,
}: {
  projects: { id: string; name: string; url: string | null }[];
  selectedProject: { id: string } | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onManage: () => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="p-3 text-center">
        <Globe className="size-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-2">No projects yet</p>
        <button onClick={onManage} className="text-xs text-primary hover:underline">
          Create your first project
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-48 overflow-y-auto py-1">
        {projects.map((project, i) => {
          const isActive = selectedProject?.id === project.id;
          return (
            <button
              key={project.id}
              onClick={() => onSelect(project.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}
            >
              <div className={`size-2 rounded-full shrink-0 ${DOT_COLORS[i % DOT_COLORS.length]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{project.name}</p>
                {project.url && <p className="text-[10px] text-muted-foreground truncate">{project.url}</p>}
              </div>
              {isActive && <div className="size-1.5 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </div>
      <div className="border-t border-border/30 px-3 py-2 flex items-center justify-between">
        <button onClick={onManage} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <FolderKanban className="size-3" /> Manage Projects
        </button>
        {selectedProject && (
          <button onClick={onClear} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <X className="size-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

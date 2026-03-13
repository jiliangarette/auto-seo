import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/database';

interface SiteContextValue {
  siteUrl: string;
  setSiteUrl: (url: string) => void;
  selectedProjectId: string | null;
  selectedProject: Project | null;
  selectProject: (projectId: string) => void;
  clearProject: () => void;
  projects: Project[];
}

const SiteContext = createContext<SiteContextValue>({
  siteUrl: '',
  setSiteUrl: () => {},
  selectedProjectId: null,
  selectedProject: null,
  selectProject: () => {},
  clearProject: () => {},
  projects: [],
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data: projects = [] } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    try { return localStorage.getItem('autoseo_selected_project') ?? null; } catch { return null; }
  });

  const [siteUrl, setSiteUrlRaw] = useState(() => {
    try { return localStorage.getItem('autoseo_site_url') ?? ''; } catch { return ''; }
  });

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const setSiteUrl = useCallback((url: string) => {
    setSiteUrlRaw(url);
    try { localStorage.setItem('autoseo_site_url', url); } catch { /* noop */ }
  }, []);

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    try { localStorage.setItem('autoseo_selected_project', projectId); } catch { /* noop */ }
    const project = projects.find(p => p.id === projectId);
    if (project?.url) {
      setSiteUrlRaw(project.url);
      try { localStorage.setItem('autoseo_site_url', project.url); } catch { /* noop */ }
    }
  }, [projects]);

  const clearProject = useCallback(() => {
    setSelectedProjectId(null);
    setSiteUrlRaw('');
    try {
      localStorage.removeItem('autoseo_selected_project');
      localStorage.removeItem('autoseo_site_url');
    } catch { /* noop */ }
  }, []);

  return (
    <SiteContext.Provider value={{
      siteUrl,
      setSiteUrl,
      selectedProjectId,
      selectedProject,
      selectProject,
      clearProject,
      projects,
    }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteUrl() {
  const ctx = useContext(SiteContext);
  return { siteUrl: ctx.siteUrl, setSiteUrl: ctx.setSiteUrl };
}

export function useSiteContext() {
  return useContext(SiteContext);
}

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface SiteContextValue {
  siteUrl: string;
  setSiteUrl: (url: string) => void;
}

const SiteContext = createContext<SiteContextValue>({ siteUrl: '', setSiteUrl: () => {} });

export function SiteProvider({ children }: { children: ReactNode }) {
  const [siteUrl, setSiteUrlRaw] = useState(() => {
    try { return localStorage.getItem('autoseo_site_url') ?? ''; } catch { return ''; }
  });

  const setSiteUrl = useCallback((url: string) => {
    setSiteUrlRaw(url);
    try { localStorage.setItem('autoseo_site_url', url); } catch { /* noop */ }
  }, []);

  return (
    <SiteContext.Provider value={{ siteUrl, setSiteUrl }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteUrl() {
  return useContext(SiteContext);
}

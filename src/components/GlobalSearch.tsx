import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, X } from 'lucide-react';

interface SearchResult {
  type: 'project' | 'keyword' | 'content';
  label: string;
  detail: string;
  path: string;
}

export default function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const projectIds = projects?.map((p) => p.id) ?? [];

  const { data: allKeywords } = useQuery({
    queryKey: ['all-keywords-search', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data } = await supabase
        .from('keywords')
        .select('id, keyword, project_id')
        .in('project_id', projectIds);
      return data ?? [];
    },
    enabled: !!projects?.length,
  });

  const { data: allContent } = useQuery({
    queryKey: ['all-content-search', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data } = await supabase
        .from('content_items')
        .select('id, title, topic, project_id')
        .in('project_id', projectIds);
      return data ?? [];
    },
    enabled: !!projects?.length,
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    projects?.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.url?.toLowerCase().includes(q)) {
        items.push({ type: 'project', label: p.name, detail: p.url ?? '', path: `/projects/${p.id}` });
      }
    });

    allKeywords?.forEach((kw) => {
      if (kw.keyword.toLowerCase().includes(q)) {
        items.push({ type: 'keyword', label: kw.keyword, detail: 'Keyword', path: `/projects/${kw.project_id}` });
      }
    });

    allContent?.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.topic?.toLowerCase().includes(q)) {
        items.push({ type: 'content', label: c.title, detail: c.topic ?? '', path: `/calendar?project=${c.project_id}` });
      }
    });

    return items.slice(0, 10);
  }, [query, projects, allKeywords, allContent]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const typeColors = {
    project: 'bg-blue-950/30 text-blue-400',
    keyword: 'bg-green-950/30 text-green-400',
    content: 'bg-purple-950/30 text-purple-400',
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Search className="size-3" />
        <span>Search...</span>
        <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px]">Ctrl+K</kbd>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, keywords, content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {query && results.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No results</p>
            )}
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { navigate(r.path); setOpen(false); setQuery(''); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${typeColors[r.type]}`}>
                  {r.type}
                </span>
                <span className="text-sm font-medium truncate">{r.label}</span>
                {r.detail && <span className="text-xs text-muted-foreground truncate">{r.detail}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

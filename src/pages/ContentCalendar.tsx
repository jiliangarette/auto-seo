import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContentItems, useCreateContentItem, useDeleteContentItem, useUpdateContentItem } from '@/hooks/useContentItems';
import { useProjects } from '@/hooks/useProjects';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar, Sparkles, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  plan: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  draft: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
} as const;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContentCalendar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedProject = searchParams.get('project') ?? '';

  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState(preselectedProject);
  const { data: items } = useContentItems(selectedProject);
  const createItem = useCreateContentItem();
  const deleteItem = useDeleteContentItem();
  const updateItem = useUpdateContentItem();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [date, setDate] = useState('');

  const [statusFilter, setStatusFilter] = useState<'' | 'plan' | 'draft' | 'published'>('');
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // AI generation state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiUrl, setAiUrl] = useState('');
  const [aiNiche, setAiNiche] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const filteredItems = useMemo(() => {
    if (!statusFilter) return items;
    return items?.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, typeof filteredItems> = {};
    filteredItems?.forEach((item) => {
      if (item.scheduled_date) {
        const key = item.scheduled_date;
        if (!map[key]) map[key] = [];
        map[key]!.push(item);
      }
    });
    return map;
  }, [filteredItems]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProject) return;
    try {
      await createItem.mutateAsync({
        projectId: selectedProject,
        title: title.trim(),
        topic: topic.trim() || undefined,
        keywords: keywords.trim() || undefined,
        scheduledDate: date || undefined,
      });
      toast.success('Content item created');
      setTitle(''); setTopic(''); setKeywords(''); setDate('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleAiGenerate = async () => {
    if (!selectedProject) { toast.error('Select a project first'); return; }
    if (!aiUrl.trim() && !aiNiche.trim()) { toast.error('Enter a website URL or niche'); return; }
    setAiLoading(true);

    try {
      // Fetch site context if URL provided
      let siteContext = '';
      if (aiUrl.trim()) {
        try {
          const url = aiUrl.startsWith('http') ? aiUrl : `https://${aiUrl}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const siteTitle = doc.querySelector('title')?.textContent?.trim() ?? '';
          const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
          const h1s = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim()).filter(Boolean).slice(0, 5);
          const h2s = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim()).filter(Boolean).slice(0, 10);
          siteContext = `Website: ${url}\nTitle: ${siteTitle}\nDescription: ${metaDesc}\nH1s: ${h1s.join(', ')}\nH2s: ${h2s.join(', ')}`;
        } catch {
          siteContext = `Website: ${aiUrl} (could not fetch)`;
        }
      }

      const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO content strategist. Return JSON only.' },
          {
            role: 'user',
            content: `Generate a content calendar for ${monthName}.\n${siteContext ? `Site context:\n${siteContext}` : `Niche: ${aiNiche}`}\n\nReturn JSON:\n{\n  "items": [\n    {\n      "title": "article title",\n      "topic": "content topic",\n      "keywords": "keyword1, keyword2",\n      "day": number(1-${daysInMonth})\n    }\n  ]\n}\n\nGenerate 8-12 content items spread across the month. Focus on high-impact SEO topics relevant to the site/niche. Schedule 2-3 posts per week. Pick the best publishing days (Tue, Wed, Thu are ideal).`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0].message.content ?? '{}';
      const plan = JSON.parse(text) as { items: { title: string; topic: string; keywords: string; day: number }[] };

      let created = 0;
      for (const item of plan.items) {
        const scheduledDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
        await createItem.mutateAsync({
          projectId: selectedProject,
          title: item.title,
          topic: item.topic,
          keywords: item.keywords,
          scheduledDate,
        });
        created++;
      }

      toast.success(`Generated ${created} content items for ${monthName}`);
      setShowAiPanel(false);
      setAiUrl('');
      setAiNiche('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const cycleStatus = (item: { id: string; status: 'plan' | 'draft' | 'published' }) => {
    const order: ('plan' | 'draft' | 'published')[] = ['plan', 'draft', 'published'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    updateItem.mutate({ id: item.id, projectId: selectedProject, status: next });
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const formatDateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const unscheduled = filteredItems?.filter((i) => !i.scheduled_date) ?? [];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
              <Calendar className="size-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Content Calendar</h1>
              <p className="text-xs text-muted-foreground">Plan, schedule, and auto-generate SEO content</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select className="rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="">Select project...</option>
              {projects?.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <select className="rounded-lg border border-border/40 bg-background/50 px-2 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="">All</option>
              <option value="plan">Plan</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} disabled={!selectedProject} className="border-border/40">
              <Plus className="size-4" /> Add
            </Button>
            <Button size="sm" onClick={() => setShowAiPanel(!showAiPanel)} disabled={!selectedProject} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white">
              <Sparkles className="size-4" /> AI Plan
            </Button>
          </div>
        </div>

        {/* AI Generation Panel */}
        {showAiPanel && selectedProject && (
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-medium">Auto-generate a content plan for {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="Your website URL (AI fetches and analyzes it)" className="pl-9 bg-background/50 border-border/40" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border/40" /> or <div className="h-px flex-1 bg-border/40" />
              </div>
              <Input value={aiNiche} onChange={(e) => setAiNiche(e.target.value)} placeholder="Describe your niche (e.g., fitness coaching, B2B SaaS)" className="bg-background/50 border-border/40" />
              <Button onClick={handleAiGenerate} disabled={aiLoading} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white">
                {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {aiLoading ? 'Analyzing & generating...' : 'Generate Content Plan'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Form */}
        {showForm && selectedProject && (
          <Card className="border-border/40 bg-card/50">
            <CardContent className="pt-5 pb-5">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="flex-1 bg-background/50 border-border/40" />
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 bg-background/50 border-border/40" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1 bg-background/50 border-border/40" />
                  <Input placeholder="Keywords, comma-separated" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="flex-1 bg-background/50 border-border/40" />
                  <Button type="submit" disabled={createItem.isPending}>Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {selectedProject && (
          <>
            {/* Calendar Grid */}
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="size-4" /></Button>
                  <CardTitle className="text-sm">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="size-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px">
                  {DAYS.map((d) => (
                    <div key={d} className="p-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const dateKey = day ? formatDateKey(day) : '';
                    const dayItems = day ? itemsByDate[dateKey] ?? [] : [];
                    const isToday = day && dateKey === new Date().toISOString().split('T')[0];

                    return (
                      <div key={i} className={`min-h-[85px] rounded-lg border p-1.5 transition-colors ${day ? 'border-border/30 bg-background/30 hover:bg-background/50' : 'border-transparent'} ${isToday ? 'ring-1 ring-violet-500/50 bg-violet-500/5' : ''}`}>
                        {day && (
                          <>
                            <span className={`text-[11px] ${isToday ? 'font-bold text-violet-400' : 'text-muted-foreground'}`}>{day}</span>
                            <div className="mt-1 space-y-0.5">
                              {dayItems.map((item) => (
                                <button key={item.id} onClick={() => cycleStatus(item)} className={`w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors ${statusColors[item.status]}`} title={`${item.title} (${item.status}) — click to change status`}>
                                  {item.title}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">Status:</span>
                  <span className="flex items-center gap-1 text-[10px]"><span className="size-2 rounded-full bg-violet-400" /> Plan</span>
                  <span className="flex items-center gap-1 text-[10px]"><span className="size-2 rounded-full bg-amber-400" /> Draft</span>
                  <span className="flex items-center gap-1 text-[10px]"><span className="size-2 rounded-full bg-emerald-400" /> Published</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">Click item to cycle status</span>
                </div>
              </CardContent>
            </Card>

            {/* Unscheduled */}
            {unscheduled.length > 0 && (
              <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Unscheduled ({unscheduled.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {unscheduled.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5 bg-background/30 hover:bg-background/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <button onClick={() => cycleStatus(item)} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[item.status]}`}>{item.status}</button>
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.topic && <span className="text-xs text-muted-foreground">— {item.topic}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => navigate(`/generator?topic=${encodeURIComponent(item.topic || item.title)}&keywords=${encodeURIComponent(item.keywords || '')}`)} title="Generate content">
                          <Sparkles className="size-3 text-violet-400" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => deleteItem.mutate({ id: item.id, projectId: selectedProject })}>
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {(!items || items.length === 0) && !showAiPanel && (
              <Card className="border-dashed border-border/40 bg-card/30">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No content planned yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Use AI Plan to auto-generate a content strategy</p>
                  <Button size="sm" onClick={() => setShowAiPanel(true)} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white">
                    <Sparkles className="size-4" /> Generate AI Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedProject && (
          <Card className="border-dashed border-border/40 bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Select a project to view the calendar</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Create a project first if you haven't already</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

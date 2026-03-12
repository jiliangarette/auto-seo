import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContentItems, useCreateContentItem, useDeleteContentItem, useUpdateContentItem } from '@/hooks/useContentItems';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  plan: 'bg-muted text-muted-foreground',
  draft: 'bg-yellow-950/30 text-yellow-400',
  published: 'bg-green-950/30 text-green-400',
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

  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  }, [year, month]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, typeof items> = {};
    items?.forEach((item) => {
      if (item.scheduled_date) {
        const key = item.scheduled_date;
        if (!map[key]) map[key] = [];
        map[key]!.push(item);
      }
    });
    return map;
  }, [items]);

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
      setTitle('');
      setTopic('');
      setKeywords('');
      setDate('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const cycleStatus = (item: { id: string; status: 'plan' | 'draft' | 'published' }) => {
    const order: ('plan' | 'draft' | 'published')[] = ['plan', 'draft', 'published'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    updateItem.mutate({ id: item.id, projectId: selectedProject, status: next });
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const formatDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const unscheduled = items?.filter((i) => !i.scheduled_date) ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="size-6" />
              Content Calendar
            </h1>
            <p className="text-muted-foreground">Plan and schedule SEO content</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Select project...</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => setShowForm(!showForm)} disabled={!selectedProject}>
              <Plus className="size-4" />
              New Item
            </Button>
          </div>
        </div>

        {showForm && selectedProject && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="flex-1" />
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1" />
                  <Input placeholder="Keywords, comma-separated" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="flex-1" />
                  <Button type="submit" disabled={createItem.isPending}>Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {selectedProject && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <CardTitle>
                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={nextMonth}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px">
                  {DAYS.map((d) => (
                    <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const dateKey = day ? formatDateKey(day) : '';
                    const dayItems = day ? itemsByDate[dateKey] ?? [] : [];
                    const isToday = day && dateKey === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={i}
                        className={`min-h-[80px] rounded-md border border-border/30 p-1 ${
                          day ? 'bg-card' : 'bg-transparent'
                        } ${isToday ? 'ring-1 ring-primary' : ''}`}
                      >
                        {day && (
                          <>
                            <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                              {day}
                            </span>
                            <div className="mt-1 space-y-0.5">
                              {dayItems.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => cycleStatus(item)}
                                  className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] ${statusColors[item.status]}`}
                                  title={`${item.title} (${item.status}) — click to change status`}
                                >
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
              </CardContent>
            </Card>

            {unscheduled.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Unscheduled ({unscheduled.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unscheduled.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md border border-border/50 p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cycleStatus(item)}
                          className={`rounded-full px-2 py-0.5 text-[10px] ${statusColors[item.status]}`}
                        >
                          {item.status}
                        </button>
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.topic && <span className="text-xs text-muted-foreground">— {item.topic}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.keywords && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => navigate(`/generator?topic=${encodeURIComponent(item.topic || item.title)}&keywords=${encodeURIComponent(item.keywords || '')}`)}
                            title="Generate content"
                          >
                            <Sparkles className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => deleteItem.mutate({ id: item.id, projectId: selectedProject })}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

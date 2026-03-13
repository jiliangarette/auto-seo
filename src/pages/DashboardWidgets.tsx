import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LayoutGrid,
  GripVertical,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  TrendingUp,
  Target,
  FileText,
  BarChart3,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

type WidgetType = 'stat' | 'chart' | 'feed' | 'goal' | 'progress' | 'checklist';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'sm' | 'md' | 'lg';
  config: Record<string, unknown>;
}

interface DashboardPreset {
  id: string;
  name: string;
  widgets: Widget[];
}

const widgetLibrary: { type: WidgetType; label: string; icon: typeof TrendingUp; description: string }[] = [
  { type: 'stat', label: 'Stat Card', icon: TrendingUp, description: 'Single metric with trend indicator' },
  { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Bar or line chart visualization' },
  { type: 'feed', label: 'Activity Feed', icon: Activity, description: 'Recent activity stream' },
  { type: 'goal', label: 'Goal Tracker', icon: Target, description: 'Progress toward a target' },
  { type: 'progress', label: 'Progress Bar', icon: FileText, description: 'Completion percentage display' },
  { type: 'checklist', label: 'Checklist', icon: CheckCircle2, description: 'Task checklist widget' },
];

const sampleData: Record<WidgetType, Record<string, unknown>> = {
  stat: { value: 1234, label: 'Total Keywords', change: 12, trend: 'up' },
  chart: { data: [40, 55, 60, 45, 70, 85, 90], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  feed: { items: ['Audit completed for example.com', 'New keyword added: "seo tools"', 'Report generated', 'Backlink detected'] },
  goal: { current: 75, target: 100, label: 'Monthly Links' },
  progress: { completed: 8, total: 12, label: 'Content Calendar' },
  checklist: { items: [{ text: 'Run site audit', done: true }, { text: 'Update meta tags', done: false }, { text: 'Check rankings', done: true }, { text: 'Review backlinks', done: false }] },
};

function WidgetRenderer({ widget }: { widget: Widget }) {
  const config = { ...sampleData[widget.type], ...widget.config };

  switch (widget.type) {
    case 'stat': {
      const { value, label, change, trend } = config as { value: number; label: string; change: number; trend: string };
      return (
        <div className="text-center py-2">
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-muted-foreground">{label as string}</p>
          <p className={`text-[10px] mt-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? '+' : '-'}{change as number}% this week
          </p>
        </div>
      );
    }
    case 'chart': {
      const { data, labels } = config as { data: number[]; labels: string[] };
      const max = Math.max(...(data as number[]));
      return (
        <div className="flex items-end gap-1 h-24 px-2">
          {(data as number[]).map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors min-h-[4px]"
                style={{ height: `${(val / max) * 80}%` }}
              />
              <span className="text-[8px] text-muted-foreground">{(labels as string[])[i]}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'feed': {
      const { items } = config as { items: string[] };
      return (
        <div className="space-y-1.5 max-h-24 overflow-y-auto">
          {(items as string[]).map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px]">
              <Clock className="size-2.5 mt-0.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'goal': {
      const { current, target, label } = config as { current: number; target: number; label: string };
      const pct = Math.round(((current as number) / (target as number)) * 100);
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label as string}</span>
            <span className="font-medium">{current as number}/{target as number}</span>
          </div>
          <div className="h-3 rounded-full bg-muted/50">
            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="text-[10px] text-center text-muted-foreground">{pct}% complete</p>
        </div>
      );
    }
    case 'progress': {
      const { completed, total, label } = config as { completed: number; total: number; label: string };
      return (
        <div className="text-center space-y-1">
          <p className="text-xl font-bold">{completed as number}<span className="text-muted-foreground text-sm">/{total as number}</span></p>
          <p className="text-xs text-muted-foreground">{label as string}</p>
          <div className="h-1.5 rounded-full bg-muted/50 mx-4">
            <div className="h-full rounded-full bg-primary" style={{ width: `${((completed as number) / (total as number)) * 100}%` }} />
          </div>
        </div>
      );
    }
    case 'checklist': {
      const { items } = config as { items: { text: string; done: boolean }[] };
      return (
        <div className="space-y-1">
          {(items as { text: string; done: boolean }[]).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className={`size-3 ${item.done ? 'text-green-400' : 'text-muted-foreground'}`} />
              <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'stat', title: 'Total Keywords', size: 'sm', config: {} },
    { id: '2', type: 'chart', title: 'Weekly Traffic', size: 'md', config: {} },
    { id: '3', type: 'goal', title: 'Link Building Goal', size: 'sm', config: {} },
    { id: '4', type: 'feed', title: 'Recent Activity', size: 'md', config: {} },
    { id: '5', type: 'checklist', title: 'SEO Checklist', size: 'sm', config: {} },
    { id: '6', type: 'progress', title: 'Content Calendar', size: 'sm', config: {} },
  ]);
  const [presets, setPresets] = useState<DashboardPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...widgets];
    const [removed] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, removed);
    setWidgets(updated);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const addWidget = (type: WidgetType) => {
    const lib = widgetLibrary.find((w) => w.type === type);
    const widget: Widget = {
      id: crypto.randomUUID(),
      type,
      title: lib?.label ?? 'Widget',
      size: type === 'chart' || type === 'feed' ? 'md' : 'sm',
      config: {},
    };
    setWidgets((prev) => [...prev, widget]);
    setShowLibrary(false);
    toast.success('Widget added');
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const cycleSize = (id: string) => {
    setWidgets((prev) => prev.map((w) => {
      if (w.id !== id) return w;
      const sizes: Widget['size'][] = ['sm', 'md', 'lg'];
      const idx = sizes.indexOf(w.size);
      return { ...w, size: sizes[(idx + 1) % sizes.length] };
    }));
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Enter a preset name');
      return;
    }
    const preset: DashboardPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      widgets: [...widgets],
    };
    setPresets((prev) => [...prev, preset]);
    setPresetName('');
    toast.success('Preset saved');
  };

  const loadPreset = (preset: DashboardPreset) => {
    setWidgets(preset.widgets.map((w) => ({ ...w, id: crypto.randomUUID() })));
    toast.success(`Loaded "${preset.name}"`);
  };

  const sizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-2';
      case 'lg': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutGrid className="size-6" />
              Dashboard Widgets
            </h1>
            <p className="text-muted-foreground">Customize your dashboard with drag-and-drop widgets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}>
              <Plus className="size-3.5" />
              Add Widget
            </Button>
          </div>
        </div>

        {/* Widget Library */}
        {showLibrary && (
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Widget Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-3">
                {widgetLibrary.map((w) => {
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.type}
                      onClick={() => addWidget(w.type)}
                      className="flex items-center gap-3 rounded-md border border-border/50 p-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <Icon className="size-5 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{w.label}</p>
                        <p className="text-[10px] text-muted-foreground">{w.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presets */}
        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-48 text-xs"
              />
              <Button size="sm" variant="outline" onClick={savePreset}>
                <Save className="size-3.5" />
                Save
              </Button>
              {presets.map((p) => (
                <Button key={p.id} size="sm" variant="ghost" onClick={() => loadPreset(p)} className="text-xs">
                  <RotateCcw className="size-3" />
                  {p.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Widget Grid */}
        <div className="grid grid-cols-3 gap-4">
          {widgets.map((widget, i) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`${sizeClass(widget.size)} cursor-grab active:cursor-grabbing`}
            >
              <Card className="h-full hover:border-primary/30 transition-colors">
                <CardHeader className="pb-1 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="size-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-medium">{widget.title}</span>
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => cycleSize(widget.id)}
                        className="text-[8px] text-muted-foreground hover:text-foreground px-1"
                      >
                        {widget.size.toUpperCase()}
                      </button>
                      <button onClick={() => removeWidget(widget.id)} className="text-red-400 hover:text-red-300 px-0.5">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <WidgetRenderer widget={widget} />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {widgets.length === 0 && (
          <Card className="border-border/30 bg-card/40">
            <CardContent className="pt-8 pb-8 text-center">
              <LayoutGrid className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No widgets. Click "Add Widget" to customize your dashboard.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

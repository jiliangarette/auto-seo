import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Plus, Trash2, CheckCircle2, Clock, Play } from 'lucide-react';
import { toast } from 'sonner';

interface SeoTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
  category: string;
}

let nextId = 1;

const prioColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

const statusIcons = {
  todo: Clock,
  'in-progress': Play,
  done: CheckCircle2,
};

const statusColors = {
  todo: 'text-muted-foreground',
  'in-progress': 'text-yellow-400',
  done: 'text-green-400',
};

export default function SeoTaskManager() {
  const [tasks, setTasks] = useState<SeoTask[]>([
    { id: String(nextId++), title: 'Fix broken internal links', priority: 'high', status: 'todo', dueDate: '2026-03-20', category: 'Technical' },
    { id: String(nextId++), title: 'Update meta descriptions on top pages', priority: 'medium', status: 'in-progress', dueDate: '2026-03-25', category: 'On-Page' },
    { id: String(nextId++), title: 'Submit new sitemap', priority: 'low', status: 'done', dueDate: '2026-03-10', category: 'Technical' },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDue, setNewDue] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const addTask = () => {
    if (!newTitle.trim()) { toast.error('Enter a task title'); return; }
    setTasks([...tasks, {
      id: String(nextId++),
      title: newTitle,
      priority: newPriority,
      status: 'todo',
      dueDate: newDue,
      category: newCategory || 'General',
    }]);
    setNewTitle('');
    setNewDue('');
    setNewCategory('');
    toast.success('Task added');
  };

  const cycleStatus = (id: string) => {
    setTasks(tasks.map((t) => {
      if (t.id !== id) return t;
      const next = t.status === 'todo' ? 'in-progress' : t.status === 'in-progress' ? 'done' : 'todo';
      return { ...t, status: next as SeoTask['status'] };
    }));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    toast.success('Task removed');
  };

  const filtered = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus);
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="size-6" />
            SEO Task Manager
          </h1>
          <p className="text-muted-foreground">Track SEO improvement tasks with priority and progress</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.todo}</p>
              <p className="text-[10px] text-muted-foreground">To Do</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
              <p className="text-[10px] text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.done}</p>
              <p className="text-[10px] text-muted-foreground">Done ({completionPct}%)</p>
              <div className="h-1 rounded-full bg-muted/30 mt-1">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${completionPct}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title" className="flex-1 min-w-[200px]" />
              <select
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as SeoTask['priority'])}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="w-36" />
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category" className="w-28" />
              <Button onClick={addTask}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-1">
          {['all', 'todo', 'in-progress', 'done'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded text-xs transition-colors ${filterStatus === s ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
            >
              {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {filtered.map((task) => {
            const StatusIcon = statusIcons[task.status];
            return (
              <Card key={task.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => cycleStatus(task.id)} className="shrink-0">
                      <StatusIcon className={`size-4 ${statusColors[task.status]}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${prioColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">
                          {task.category}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] text-muted-foreground">Due: {task.dueDate}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeTask(task.id)}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-sm text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

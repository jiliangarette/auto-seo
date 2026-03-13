import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Plus, Trash2, Play, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  tool: string;
  description: string;
  status: 'pending' | 'running' | 'done';
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  createdAt: string;
}

const availableTools = [
  'Keyword Analyzer', 'Content Optimizer', 'SEO Score', 'Meta Tag Generator',
  'Readability Check', 'Title Tester', 'SERP Preview', 'Schema Validator',
  'Broken Link Scan', 'Content Brief', 'Heading Analyzer', 'Image SEO',
];

let nextId = 1;
let nextStepId = 1;

export default function SeoWorkflowAutomator() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: String(nextId++),
      name: 'Full Content Audit',
      steps: [
        { id: String(nextStepId++), tool: 'Keyword Analyzer', description: 'Analyze target keywords', status: 'done' },
        { id: String(nextStepId++), tool: 'Content Optimizer', description: 'Optimize content for keywords', status: 'done' },
        { id: String(nextStepId++), tool: 'SEO Score', description: 'Check overall SEO score', status: 'pending' },
      ],
      createdAt: '2026-03-13',
    },
  ]);
  const [newName, setNewName] = useState('');
  const [newTool, setNewTool] = useState(availableTools[0]);
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const createWorkflow = () => {
    if (!newName.trim()) { toast.error('Enter workflow name'); return; }
    setWorkflows([...workflows, {
      id: String(nextId++),
      name: newName,
      steps: [],
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setNewName('');
    toast.success('Workflow created');
  };

  const addStep = (wfId: string) => {
    if (!newDesc.trim()) { toast.error('Enter step description'); return; }
    setWorkflows(workflows.map((wf) => {
      if (wf.id !== wfId) return wf;
      return { ...wf, steps: [...wf.steps, { id: String(nextStepId++), tool: newTool, description: newDesc, status: 'pending' as const }] };
    }));
    setNewDesc('');
    toast.success('Step added');
  };

  const removeStep = (wfId: string, stepId: string) => {
    setWorkflows(workflows.map((wf) => {
      if (wf.id !== wfId) return wf;
      return { ...wf, steps: wf.steps.filter((s) => s.id !== stepId) };
    }));
  };

  const runWorkflow = (wfId: string) => {
    setWorkflows(workflows.map((wf) => {
      if (wf.id !== wfId) return wf;
      return { ...wf, steps: wf.steps.map((s) => ({ ...s, status: 'done' as const })) };
    }));
    toast.success('Workflow executed');
  };

  const removeWorkflow = (id: string) => {
    setWorkflows(workflows.filter((wf) => wf.id !== id));
    toast.success('Workflow removed');
  };

  const statusColors = {
    pending: 'text-muted-foreground',
    running: 'text-yellow-400',
    done: 'text-green-400',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wand2 className="size-6" />
            SEO Workflow Automator
          </h1>
          <p className="text-muted-foreground">Create multi-step SEO workflows and chain tools together</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Create Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Workflow name" className="flex-1" />
              <Button onClick={createWorkflow}><Plus className="size-4" /> Create</Button>
            </div>
          </CardContent>
        </Card>

        {workflows.map((wf) => {
          const completedCount = wf.steps.filter((s) => s.status === 'done').length;
          const pct = wf.steps.length > 0 ? Math.round((completedCount / wf.steps.length) * 100) : 0;

          return (
            <Card key={wf.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{wf.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">{wf.steps.length} steps · {pct}% complete · Created {wf.createdAt}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => runWorkflow(wf.id)} className="gap-1">
                      <Play className="size-3" /> Run
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeWorkflow(wf.id)}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-muted/30 mt-1">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 mb-3">
                  {wf.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/20 transition-colors">
                      <span className="text-[10px] text-muted-foreground w-5">{idx + 1}.</span>
                      <CheckCircle2 className={`size-3.5 shrink-0 ${statusColors[step.status]}`} />
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{step.tool}</span>
                      <span className="text-sm flex-1 truncate">{step.description}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeStep(wf.id, step.id)}>
                        <Trash2 className="size-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  {wf.steps.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No steps yet. Add a step below.</p>
                  )}
                </div>

                {editingId === wf.id ? (
                  <div className="flex flex-wrap gap-2 border-t border-border/30 pt-2">
                    <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={newTool} onChange={(e) => setNewTool(e.target.value)}>
                      {availableTools.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Step description" className="flex-1 min-w-[200px]" />
                    <Button size="sm" onClick={() => addStep(wf.id)}><Plus className="size-3" /> Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Done</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditingId(wf.id)} className="gap-1">
                    <Save className="size-3" /> Add Steps
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {workflows.length === 0 && (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">No workflows created yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

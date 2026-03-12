import { useState } from 'react';
import { useBacklinks, useAddBacklink, useDeleteBacklink, useUpdateBacklinkStatus } from '@/hooks/useBacklinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowUpDown, Link2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'source_url' | 'status' | 'discovered_at';
type SortDir = 'asc' | 'desc';

const statusConfig = {
  active: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-950/30' },
  broken: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-950/30' },
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-950/30' },
} as const;

export default function BacklinkSection({ projectId }: { projectId: string }) {
  const { data: backlinks, isLoading } = useBacklinks(projectId);
  const addBacklink = useAddBacklink();
  const deleteBacklink = useDeleteBacklink();
  const updateStatus = useUpdateBacklinkStatus();

  const [showForm, setShowForm] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [sortField, setSortField] = useState<SortField>('discovered_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() || !targetUrl.trim()) return;

    try {
      await addBacklink.mutateAsync({
        projectId,
        sourceUrl: sourceUrl.trim(),
        targetUrl: targetUrl.trim(),
        anchorText: anchorText.trim() || undefined,
      });
      toast.success('Backlink added');
      setSourceUrl('');
      setTargetUrl('');
      setAnchorText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add backlink');
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...(backlinks ?? [])].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const activeCount = backlinks?.filter((b) => b.status === 'active').length ?? 0;
  const brokenCount = backlinks?.filter((b) => b.status === 'broken').length ?? 0;
  const totalCount = backlinks?.length ?? 0;

  const cycleStatus = (current: 'active' | 'broken' | 'pending') => {
    const order: ('active' | 'broken' | 'pending')[] = ['active', 'broken', 'pending'];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-5" />
              Backlinks
            </CardTitle>
            <CardDescription>
              {totalCount} total — {activeCount} active, {brokenCount} broken
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Source URL (linking page)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                required
                className="flex-1"
              />
              <Input
                placeholder="Target URL (your page)"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Anchor text (optional)"
                value={anchorText}
                onChange={(e) => setAnchorText(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={addBacklink.isPending}>
                Add
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !sorted.length ? (
          <p className="text-sm text-muted-foreground">No backlinks tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('source_url')}>
                      Source <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Anchor</th>
                  <th className="pb-2">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('status')}>
                      Status <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((bl) => {
                  const cfg = statusConfig[bl.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={bl.id} className="border-b border-border/50">
                      <td className="py-2 max-w-[200px] truncate">{bl.source_url}</td>
                      <td className="py-2 max-w-[200px] truncate">{bl.target_url}</td>
                      <td className="py-2 text-muted-foreground">{bl.anchor_text ?? '—'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => updateStatus.mutate({
                            id: bl.id,
                            projectId,
                            status: cycleStatus(bl.status),
                          })}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.bg} ${cfg.color}`}
                        >
                          <StatusIcon className="size-3" />
                          {bl.status}
                        </button>
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => deleteBacklink.mutate({ id: bl.id, projectId })}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

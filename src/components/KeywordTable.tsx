import { useState } from 'react';
import { useKeywords, useAddKeyword, useUpdateKeyword, useDeleteKeyword } from '@/hooks/useKeywords';
import { useConfirm } from '@/components/ConfirmDialog';
import { estimateKeywordDifficulty, batchEstimateDifficulty } from '@/lib/keyword-difficulty';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowUpDown, Zap, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'keyword' | 'position' | 'search_volume' | 'created_at';
type SortDir = 'asc' | 'desc';

interface DifficultyInfo {
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  opportunityScore: number;
  reasoning: string;
}

const difficultyColors = {
  easy: 'bg-green-950/30 text-green-400',
  medium: 'bg-yellow-950/30 text-yellow-400',
  hard: 'bg-red-950/30 text-red-400',
};

export default function KeywordTable({ projectId }: { projectId: string }) {
  const { data: keywords, isLoading } = useKeywords(projectId);
  const addKeyword = useAddKeyword();
  const updateKeyword = useUpdateKeyword();
  const deleteKeyword = useDeleteKeyword();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'position' | 'search_volume' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [position, setPosition] = useState('');
  const [volume, setVolume] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterPosMin, setFilterPosMin] = useState('');
  const [filterPosMax, setFilterPosMax] = useState('');
  const [filterVolMin, setFilterVolMin] = useState('');
  const [filterVolMax, setFilterVolMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [difficulties, setDifficulties] = useState<Record<string, DifficultyInfo>>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [batchChecking, setBatchChecking] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    try {
      await addKeyword.mutateAsync({
        projectId,
        keyword: keyword.trim(),
        position: position ? parseInt(position) : undefined,
        searchVolume: volume ? parseInt(volume) : undefined,
      });
      toast.success('Keyword added');
      setKeyword('');
      setPosition('');
      setVolume('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add keyword');
    }
  };

  const checkDifficulty = async (kw: { id: string; keyword: string; search_volume: number | null }) => {
    setCheckingId(kw.id);
    try {
      const result = await estimateKeywordDifficulty(kw.keyword, kw.search_volume);
      setDifficulties((prev) => ({
        ...prev,
        [kw.id]: {
          difficulty: result.difficulty,
          score: result.score,
          opportunityScore: result.opportunityScore,
          reasoning: result.reasoning,
        },
      }));
    } catch {
      toast.error('Failed to check difficulty');
    } finally {
      setCheckingId(null);
    }
  };

  const checkAllDifficulty = async () => {
    if (!keywords?.length) return;
    setBatchChecking(true);
    try {
      const results = await batchEstimateDifficulty(
        keywords.map((kw) => ({ keyword: kw.keyword, searchVolume: kw.search_volume }))
      );
      const newDiffs: Record<string, DifficultyInfo> = {};
      results.forEach((r, i) => {
        if (keywords[i]) {
          newDiffs[keywords[i].id] = {
            difficulty: r.difficulty,
            score: r.score,
            opportunityScore: r.opportunityScore,
            reasoning: r.reasoning,
          };
        }
      });
      setDifficulties((prev) => ({ ...prev, ...newDiffs }));
      toast.success(`Checked ${results.length} keywords`);
    } catch {
      toast.error('Batch check failed');
    } finally {
      setBatchChecking(false);
    }
  };

  const startEdit = (id: string, field: 'position' | 'search_volume', currentValue: number | null) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() ?? '');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    const val = editValue ? parseInt(editValue) : null;
    try {
      await updateKeyword.mutateAsync({
        id: editingCell.id,
        projectId,
        ...(editingCell.field === 'position' ? { position: val ?? undefined } : { searchVolume: val ?? undefined }),
      });
    } catch {
      toast.error('Failed to update');
    }
    setEditingCell(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete keyword?',
      description: `Remove "${name}" from this project. This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (ok) deleteKeyword.mutate({ id, projectId });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = (keywords ?? []).filter((kw) => {
    if (filterPosMin && (kw.position === null || kw.position < parseInt(filterPosMin))) return false;
    if (filterPosMax && (kw.position === null || kw.position > parseInt(filterPosMax))) return false;
    if (filterVolMin && (kw.search_volume === null || kw.search_volume < parseInt(filterVolMin))) return false;
    if (filterVolMax && (kw.search_volume === null || kw.search_volume > parseInt(filterVolMax))) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Keywords</CardTitle>
            <CardDescription>Track keyword rankings & difficulty</CardDescription>
          </div>
          <div className="flex gap-1">
            {keywords && keywords.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="size-4" />
                  Filter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkAllDifficulty}
                  disabled={batchChecking}
                >
                  {batchChecking ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                  Check All
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              placeholder="Position"
              type="number"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-24"
            />
            <Input
              placeholder="Volume"
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-24"
            />
            <Button type="submit" size="sm" disabled={addKeyword.isPending}>
              Add
            </Button>
          </form>
        )}

        {showFilters && (
          <div className="flex gap-2 items-center text-xs">
            <span className="text-muted-foreground">Position:</span>
            <Input placeholder="Min" type="number" value={filterPosMin} onChange={(e) => setFilterPosMin(e.target.value)} className="w-20 h-7 text-xs" />
            <span className="text-muted-foreground">-</span>
            <Input placeholder="Max" type="number" value={filterPosMax} onChange={(e) => setFilterPosMax(e.target.value)} className="w-20 h-7 text-xs" />
            <span className="text-muted-foreground ml-2">Volume:</span>
            <Input placeholder="Min" type="number" value={filterVolMin} onChange={(e) => setFilterVolMin(e.target.value)} className="w-20 h-7 text-xs" />
            <span className="text-muted-foreground">-</span>
            <Input placeholder="Max" type="number" value={filterVolMax} onChange={(e) => setFilterVolMax(e.target.value)} className="w-20 h-7 text-xs" />
            {(filterPosMin || filterPosMax || filterVolMin || filterVolMax) && (
              <span className="text-muted-foreground">({filtered.length}/{keywords?.length ?? 0})</span>
            )}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !sorted.length ? (
          <p className="text-sm text-muted-foreground">No keywords tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('keyword')}>
                      Keyword <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="pb-2">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('position')}>
                      Position <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="pb-2">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('search_volume')}>
                      Volume <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="pb-2">Difficulty</th>
                  <th className="pb-2">Opportunity</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((kw) => {
                  const diff = difficulties[kw.id];
                  return (
                    <tr key={kw.id} className="border-b border-border/50">
                      <td className="py-2 font-medium">{kw.keyword}</td>
                      <td className="py-2">
                        {editingCell?.id === kw.id && editingCell.field === 'position' ? (
                          <input
                            type="number"
                            className="w-16 rounded border border-primary bg-background px-1.5 py-0.5 text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors"
                            onClick={() => startEdit(kw.id, 'position', kw.position)}
                            title="Click to edit"
                          >
                            {kw.position ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {editingCell?.id === kw.id && editingCell.field === 'search_volume' ? (
                          <input
                            type="number"
                            className="w-20 rounded border border-primary bg-background px-1.5 py-0.5 text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors"
                            onClick={() => startEdit(kw.id, 'search_volume', kw.search_volume)}
                            title="Click to edit"
                          >
                            {kw.search_volume ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {diff ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColors[diff.difficulty]}`}
                            title={diff.reasoning}
                          >
                            {diff.difficulty} ({diff.score})
                          </span>
                        ) : (
                          <button
                            onClick={() => checkDifficulty(kw)}
                            disabled={checkingId === kw.id}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {checkingId === kw.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              'Check'
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-2">
                        {diff ? (
                          <span className="text-xs tabular-nums">{diff.opportunityScore}/100</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(kw.id, kw.keyword)}
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
      {confirmDialog}
    </Card>
  );
}

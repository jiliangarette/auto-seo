import { useState, useMemo } from 'react';
import { useKeywords } from '@/hooks/useKeywords';
import { useProjectRankHistory, useCheckInRank } from '@/hooks/useRankHistory';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function RankTracker({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { data: keywords } = useKeywords(projectId);
  const { data: allHistory } = useProjectRankHistory(projectId);
  const checkIn = useCheckInRank();

  const [checkInKeyword, setCheckInKeyword] = useState('');
  const [checkInPosition, setCheckInPosition] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const historyByKeyword = useMemo(() => {
    const map: Record<string, { position: number; checked_at: string }[]> = {};
    allHistory?.forEach((h) => {
      if (!map[h.keyword_id]) map[h.keyword_id] = [];
      map[h.keyword_id].push({ position: h.position, checked_at: h.checked_at });
    });
    return map;
  }, [allHistory]);

  const getRankDelta = (keywordId: string) => {
    const history = historyByKeyword[keywordId];
    if (!history || history.length < 2) return null;
    const latest = history[history.length - 1].position;
    const previous = history[history.length - 2].position;
    return previous - latest; // positive = improved (lower position is better)
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInKeyword || !checkInPosition || !user) return;

    try {
      await checkIn.mutateAsync({
        keywordId: checkInKeyword,
        projectId,
        userId: user.id,
        position: parseInt(checkInPosition),
      });
      toast.success('Rank check-in recorded');
      setCheckInPosition('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record');
    }
  };

  const chartKeyword = selectedKeyword ?? keywords?.[0]?.id ?? null;
  const chartData = chartKeyword ? historyByKeyword[chartKeyword] ?? [] : [];
  const chartMax = chartData.length ? Math.max(...chartData.map((d) => d.position)) + 5 : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Rank Tracking
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Check-in form */}
        <form onSubmit={handleCheckIn} className="flex gap-2">
          <select
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={checkInKeyword}
            onChange={(e) => setCheckInKeyword(e.target.value)}
          >
            <option value="">Select keyword...</option>
            {keywords?.map((kw) => (
              <option key={kw.id} value={kw.id}>{kw.keyword}</option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Position"
            value={checkInPosition}
            onChange={(e) => setCheckInPosition(e.target.value)}
            className="w-24"
            min={1}
            required
          />
          <Button type="submit" size="sm" disabled={checkIn.isPending || !checkInKeyword}>
            Check In
          </Button>
        </form>

        {/* Keyword rank summary with deltas */}
        {keywords && keywords.length > 0 && (
          <div className="space-y-1">
            {keywords.map((kw) => {
              const history = historyByKeyword[kw.id];
              const latest = history?.[history.length - 1]?.position;
              const delta = getRankDelta(kw.id);
              const isSelected = chartKeyword === kw.id;

              return (
                <button
                  key={kw.id}
                  onClick={() => setSelectedKeyword(kw.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-medium">{kw.keyword}</span>
                  <div className="flex items-center gap-2">
                    {latest !== undefined ? (
                      <span className="tabular-nums">#{latest}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {delta !== null && <DeltaBadge delta={delta} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Position history chart (SVG) */}
        {chartData.length > 1 && (
          <div className="pt-2">
            <p className="mb-2 text-xs text-muted-foreground">
              Position history — {keywords?.find((k) => k.id === chartKeyword)?.keyword}
            </p>
            <MiniChart data={chartData} maxPos={chartMax} />
          </div>
        )}

        {chartData.length <= 1 && chartKeyword && (
          <p className="text-xs text-muted-foreground">
            Need at least 2 check-ins to show chart.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-green-500">
        <TrendingUp className="size-3" />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-red-500">
        <TrendingDown className="size-3" />{delta}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="size-3" />0
    </span>
  );
}

function MiniChart({ data, maxPos }: { data: { position: number; checked_at: string }[]; maxPos: number }) {
  const width = 500;
  const height = 150;
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minPos = Math.max(1, Math.min(...data.map((d) => d.position)) - 2);

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    // Invert Y: lower position (better rank) = higher on chart
    const y = padding.top + ((d.position - minPos) / (maxPos - minPos)) * chartH;
    return { x, y, position: d.position, date: d.checked_at };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded border border-border/30 bg-card">
      {/* Y-axis labels */}
      {[minPos, Math.round((minPos + maxPos) / 2), maxPos].map((pos) => {
        const y = padding.top + ((pos - minPos) / (maxPos - minPos)) * chartH;
        return (
          <g key={pos}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity={0.1} />
            <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.5}>
              #{pos}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" />
      ))}

      {/* X-axis date labels (first and last) */}
      {[points[0], points[points.length - 1]].map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={height - 5}
          textAnchor={i === 0 ? 'start' : 'end'}
          fontSize={9}
          fill="currentColor"
          fillOpacity={0.5}
        >
          {new Date(p.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  );
}

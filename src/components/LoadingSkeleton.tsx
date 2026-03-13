export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-6 space-y-3">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-8 w-1/2 rounded bg-muted" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="flex gap-4 border-b border-border pb-2">
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="h-4 w-1/6 rounded bg-muted" />
        <div className="h-4 w-1/6 rounded bg-muted" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <div className="h-4 w-1/4 rounded bg-muted/60" />
          <div className="h-4 w-1/6 rounded bg-muted/60" />
          <div className="h-4 w-1/6 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

export function ScoreRingSkeleton() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="size-20 rounded-full border-4 border-muted bg-muted/30" />
      <div className="h-3 w-16 rounded bg-muted/60" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-11 w-full rounded-lg bg-muted/40" />
      <div className="h-11 w-full rounded-lg bg-muted/40" />
      <div className="h-11 w-32 rounded-lg bg-muted" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border/30 bg-card/40 p-6">
      <div className="h-4 w-24 rounded bg-muted mb-4" />
      <div className="flex items-end gap-2 h-32">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-t bg-muted/40" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/20 p-3">
          <div className="size-8 rounded-lg bg-muted/40 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-muted/60" />
            <div className="h-2.5 w-1/3 rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted/60" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="rounded-lg border border-border/30 bg-card/40 p-6">
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}

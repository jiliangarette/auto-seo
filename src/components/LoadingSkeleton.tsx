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

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted/60" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}

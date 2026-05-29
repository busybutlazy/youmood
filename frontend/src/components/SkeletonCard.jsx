// Loading 狀態：灰色漸層 skeleton card
export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-muted to-secondary" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

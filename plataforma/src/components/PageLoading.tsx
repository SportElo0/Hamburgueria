// Shown the instant a panel link is tapped, while the next page loads on the server,
// so a tap always gets an answer (and nobody taps again thinking it didn't work).
export function PageLoading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="fixed inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-accent/15">
        <div className="h-full w-1/3 animate-[carregando_1s_ease-in-out_infinite] bg-accent" />
      </div>
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-mute">
        <span className="size-4 animate-spin rounded-full border-2 border-accent/25 border-t-accent" aria-hidden="true" />
        {label}
      </p>
      <div className="mt-4 h-9 w-64 max-w-full animate-pulse rounded-lg bg-line/70" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-line/60" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-36 animate-pulse bg-white/70" />
        ))}
      </div>
    </div>
  );
}

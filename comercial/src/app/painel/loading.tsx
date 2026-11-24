export default function Carregando() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Carregando…</span>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-linha" />
      <div className="h-28 animate-pulse rounded-xl bg-linha" />
      <div className="h-28 animate-pulse rounded-xl bg-linha" />
    </div>
  );
}

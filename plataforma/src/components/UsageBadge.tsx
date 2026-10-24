import type { Usage } from '@/lib/changes';

export function UsageBadge({ usage }: { usage: Usage }) {
  if (usage.limit === 0 && usage.used === 0) return <span className="chip bg-line text-ink-soft">Sem mudanças inclusas</span>;
  const tone = usage.state === 'over' ? 'bg-bad/10 text-bad' : usage.state === 'last' ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok';
  return (
    <span className={`chip shrink-0 ${tone}`} title="Mudanças usadas neste mês">
      {usage.used} de {usage.limit} no mês
      {usage.extras > 0 && ` · ${usage.extras} extra`}
    </span>
  );
}

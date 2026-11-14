import type { Etapa } from '@/lib/vendas/regras';
import { nomeEtapa } from '@/lib/vendas/regras';

export const CHIP_ETAPA: Record<Etapa, string> = {
  qualificar: 'bg-warn/10 text-warn',
  novo: 'bg-line text-ink-soft',
  'em-aprovacao': 'bg-warn/10 text-warn',
  aprovado: 'bg-accent-soft text-accent',
  enviado: 'bg-accent-soft text-accent',
  respondeu: 'bg-warn/15 text-warn',
  quente: 'bg-bad/10 text-bad',
  morno: 'bg-warn/10 text-warn',
  frio: 'bg-line text-ink-mute',
  cliente: 'bg-ok/10 text-ok',
  perdido: 'bg-line text-ink-mute',
  'nao-contatar': 'bg-ink text-white',
};

export function ChipEtapa({ etapa }: { etapa: Etapa }) {
  return <span className={`chip ${CHIP_ETAPA[etapa]}`}>{nomeEtapa(etapa)}</span>;
}

export const dataHora = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '';

/** Shown on every Sales Agent page while phase 2 (real sending) does not exist. */
export function AvisoFase1({ gravacao }: { gravacao: boolean }) {
  return (
    <p role="note" className="mt-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm text-ink">
      <span className="font-semibold text-warn">Fase 1: nenhum e-mail é enviado.</span> &quot;Aprovado&quot; quer dizer que uma pessoa leu e aprovou o texto; o envio
      chega na fase 2, com no máximo 5 e-mails por dia e 1 acompanhamento por empresa.
      {!gravacao && <span className="block font-semibold">Esta é uma prévia: dá para ver, mas nada é salvo aqui.</span>}
    </p>
  );
}

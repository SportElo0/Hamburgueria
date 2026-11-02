'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { importarAction } from '@/app/painel/oportunidades/vendas/actions';
import type { ResumoImportacao } from '@/lib/vendas/dados';
import type { Lead } from '@/lib/oportunidades/regras';

/** Leads the team can pick: open (not "Descartada"/"Não contatar"), not in the CRM yet, without a working site. */
export const podeImportar = (l: Lead, noCrm: Record<string, string>) =>
  !noCrm[l.placeId] && l.situacao !== 'descartada' && l.situacao !== 'nao-contatar' && l.categoria !== 'site-proprio';

/**
 * The bridge Oportunidades → Vendas. Imports only place IDs and the team's own findings; the server re-checks every
 * rule (status, block list, duplicates), so this screen can never import something it shouldn't.
 */
export function ImportarParaCrm({
  selecionadas,
  visiveisSelecionaveis,
  elegiveis,
  selecionar,
  importou,
}: {
  selecionadas: string[];
  visiveisSelecionaveis: string[];
  elegiveis: number;
  selecionar: (ids: string[]) => void;
  importou: (r: ResumoImportacao) => void;
}) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState<ResumoImportacao | null>(null);
  const [restantes, setRestantes] = useState(elegiveis);

  const importar = (alvo: { placeIds: string[] } | 'elegiveis') =>
    start(async () => {
      setErro('');
      const r = await importarAction(alvo);
      if (!r.ok) return setErro(r.error);
      setResumo(r.dados);
      setRestantes((n) => Math.max(n - r.dados.importadas.length, 0));
      importou(r.dados);
    });

  const todasVisiveis = visiveisSelecionaveis.length > 0 && visiveisSelecionaveis.every((id) => selecionadas.includes(id));
  const motivos = Object.entries(
    (resumo?.ignoradas ?? []).reduce<Record<string, number>>((acc, x) => ({ ...acc, [x.motivo]: (acc[x.motivo] ?? 0) + 1 }), {}),
  );

  return (
    <div className="sticky top-14 z-10 mt-4 rounded-xl border border-line bg-paper/95 p-3 backdrop-blur sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-4"
            checked={todasVisiveis}
            disabled={visiveisSelecionaveis.length === 0}
            onChange={(e) => selecionar(e.target.checked ? [...new Set([...selecionadas, ...visiveisSelecionaveis])] : selecionadas.filter((id) => !visiveisSelecionaveis.includes(id)))}
          />
          Selecionar as da tela ({visiveisSelecionaveis.length})
        </label>
        <span className="flex-1" />
        <button type="button" className="btn-ghost" disabled={pending || selecionadas.length === 0} onClick={() => importar({ placeIds: selecionadas })}>
          {pending ? 'Importando…' : `Importar selecionadas para o CRM (${selecionadas.length})`}
        </button>
        <button type="button" className="btn-primary" disabled={pending || restantes === 0} onClick={() => importar('elegiveis')}>
          {pending ? 'Importando…' : `Importar oportunidades elegíveis (${restantes})`}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-mute">
        Elegíveis: abertas, fora do CRM, sem bloqueio e sem site próprio funcionando. Vai só o identificador do Google e o que a equipe já viu; nome e e-mail vocês
        completam em Vendas. Nada é enviado.
      </p>
      {erro && (
        <p role="alert" className="mt-2 text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
      {resumo && (
        <div role="status" className="mt-3 rounded-lg border border-ok/30 bg-ok/5 p-3 text-sm">
          <p className="font-semibold">Importação concluída</p>
          <ul className="mt-1 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            <li>
              <strong>{resumo.importadas.length}</strong> importadas para &quot;Aguardando qualificação&quot;
            </li>
            <li>
              <strong>{resumo.jaCadastradas.length}</strong> já estavam no CRM (nada duplicado)
            </li>
            <li>
              <strong>{resumo.ignoradas.length}</strong> ignoradas
              {motivos.length > 0 && <span className="text-ink-mute"> ({motivos.map(([m, n]) => `${m}: ${n}`).join('; ')})</span>}
            </li>
            <li>
              <strong>{resumo.pendentesVerificacao}</strong> pendentes de verificação (&quot;sem site&quot; ainda não conferido em 2 fontes)
            </li>
          </ul>
          <p className="mt-2 text-ink-soft">
            Todas as importadas precisam de nome, e-mail comercial e fonte antes de qualquer texto.{' '}
            <Link href="/painel/oportunidades/vendas" className="font-semibold text-accent underline underline-offset-2">
              Abrir Vendas para qualificar →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { brl } from '@/lib/conselheiro/calculos';
import { getDecisoes, getSimulacao } from '@/lib/conselheiro/registros';
import type { SimulacaoSalva } from '@/lib/conselheiro/simulacoes';
import { NOME_ORIGEM, NOME_SIMULACAO, NOME_STATUS_DECISAO, type Decisao } from '@/lib/conselheiro/modelo';
import { AcaoForm } from '@/components/conselheiro/AcaoForm';
import { mudarDecisaoAction } from '../actions';

export const metadata = { title: 'Conselheiro · Decisões' };

const cor: Record<Decisao['status'], string> = { proposta: 'bg-warn/10 text-warn', aprovada: 'bg-accent-soft text-accent', 'em-teste': 'bg-accent-soft text-accent', concluida: 'bg-ok/10 text-ok', descartada: 'bg-paper text-ink-mute' };

function ResumoSim({ s }: { s: SimulacaoSalva }) {
  const linhas: string[] = [];
  if (s.tipo === 'preco' || s.tipo === 'desconto') {
    const r = s.resultado;
    linhas.push(`Hoje ${brl(r.atual.receita)} → ${brl(r.atual.contribuicao)} por unidade; ${s.tipo === 'preco' ? 'proposto' : 'com desconto'} ${brl(r.proposto.receita)} → ${brl(r.proposto.contribuicao)}`);
    if (r.equilibrio.volume) linhas.push(`Volume para manter a contribuição: ${r.equilibrio.volume.exato} (base de ${r.volumeAtual} un.)`);
    else if (r.equilibrio.observacao) linhas.push(r.equilibrio.observacao);
  } else {
    const r = s.resultado;
    linhas.push(`Combo ${brl(r.combo.receita)} → ${brl(r.combo.contribuicao)}; separados ${brl(r.precoSeparado)} → ${brl(r.separado.contribuicao)}`);
    linhas.push(`Pelo mix: ${brl(r.incrementalTotal)} a mais em ${r.vendasCombo} combos`);
  }
  return (
    <div className="rounded-lg bg-paper p-3 text-sm">
      <p className="font-semibold">{NOME_SIMULACAO[s.tipo]}: {s.titulo}</p>
      {linhas.map((l) => <p key={l}>{l}</p>)}
      <details className="mt-1">
        <summary className="cursor-pointer text-xs text-ink-mute">Dados usados (fotografia de {new Date(s.criadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })})</summary>
        <ul className="mt-1 text-xs text-ink-soft">
          {s.fontes.map((f, i) => <li key={i}>{f.rotulo}: {f.origem === 'hipotese' ? 'hipótese' : NOME_ORIGEM[f.origem]}{f.data ? `, ${f.data.split('-').reverse().join('/')}` : ''} · versão {f.versao}</li>)}
          {s.hipoteses.map((h) => <li key={h}>Hipótese: {h}</li>)}
        </ul>
      </details>
    </div>
  );
}

const Lista = ({ titulo, itens }: { titulo: string; itens: string[] }) =>
  itens.length ? (
    <div>
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">{titulo}</p>
      <ul className="mt-0.5 list-disc pl-5 text-sm">{itens.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  ) : null;

export default async function DecisoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const base = `/loja/${slug}/dono/conselheiro`;
  const decisoes = await getDecisoes(slug);
  const sims = new Map<string, SimulacaoSalva>();
  for (const id of new Set(decisoes.flatMap((d) => d.simulacaoIds))) {
    const s = await getSimulacao(slug, id);
    if (s) sims.set(id, s);
  }
  const acao = mudarDecisaoAction.bind(null, slug);

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-ink-soft">Recomendações do Conselheiro e do simulador. Nada muda no restaurante sozinho: você aprova, descarta ou leva para um teste.</p>
      {decisoes.length === 0 && (
        <p className="text-ink-soft">Nenhuma decisão ainda. Salve uma simulação no <Link className="font-semibold text-accent" href={`${base}/simulador`}>Simulador</Link> ou uma recomendação na <Link className="font-semibold text-accent" href={`${base}/conversa`}>Conversa</Link>.</p>
      )}
      <ul className="space-y-3">
        {decisoes.map((d) => (
          <li key={d.id} id={d.id} className="card scroll-mt-6 space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold">{d.titulo}</p>
                <p className="text-sm text-ink-mute">{d.origem === 'conselheiro' ? 'Do Conselheiro' : d.origem === 'simulador' ? 'Do simulador' : 'Manual'} · {new Date(d.criadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} por {d.criadaPor}</p>
              </div>
              <span className={`chip ${cor[d.status]}`}>{NOME_STATUS_DECISAO[d.status]}</span>
            </div>
            {d.pergunta && d.pergunta !== d.titulo && <p className="text-sm"><strong>Pergunta:</strong> {d.pergunta}</p>}
            {d.recomendacao && <p className="text-sm whitespace-pre-line"><strong>Recomendação:</strong> {d.recomendacao}</p>}
            <div className="grid gap-3 md:grid-cols-2">
              <Lista titulo="Dados usados" itens={d.dadosUsados} />
              <Lista titulo="O que falta" itens={d.faltando} />
              <Lista titulo="Hipóteses" itens={d.hipoteses} />
              <Lista titulo="Riscos" itens={d.riscos} />
            </div>
            {d.calculos && <p className="text-sm whitespace-pre-line text-ink-soft">{d.calculos}</p>}
            {d.proximoPasso && <p className="text-sm"><strong>Próximo passo:</strong> {d.proximoPasso}</p>}
            {d.simulacaoIds.map((id) => sims.get(id)).filter(Boolean).map((s) => <ResumoSim key={s!.id} s={s!} />)}
            <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
              {d.status === 'proposta' && (
                <AcaoForm action={acao} botao="Aprovar" inline>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="para" value="aprovada" />
                </AcaoForm>
              )}
              {d.status === 'aprovada' && !d.testeId && <Link className="btn-primary" href={`${base}/testes?decisao=${d.id}#novo`}>Criar teste</Link>}
              {d.testeId && <Link className="btn-ghost" href={`${base}/testes#${d.testeId}`}>Ver teste</Link>}
              {(d.status === 'aprovada' || d.status === 'em-teste') && (
                <AcaoForm action={acao} botao="Marcar como concluída" variante="ghost" inline>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="para" value="concluida" />
                  <input name="motivo" className="field w-56" placeholder="Como ficou (opcional)" maxLength={400} aria-label="Como ficou" />
                </AcaoForm>
              )}
              {d.status !== 'concluida' && d.status !== 'descartada' && (
                <AcaoForm action={acao} botao="Descartar" variante="danger" inline>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="para" value="descartada" />
                  <input name="motivo" className="field w-56" placeholder="Por quê?" maxLength={400} aria-label="Por que descartar" />
                </AcaoForm>
              )}
            </div>
            {d.historico.length > 1 && (
              <details className="text-xs text-ink-mute">
                <summary className="cursor-pointer">Histórico</summary>
                <ul className="mt-1">{d.historico.map((h, i) => <li key={i}>{new Date(h.em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}: {h.de || 'criada'} → {h.para} por {h.por}{h.motivo ? ` (${h.motivo})` : ''}</li>)}</ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { brl } from '@/lib/conselheiro/calculos';
import { contexto } from '@/lib/conselheiro/dados';
import { comparar, getDecisoes, getTestes } from '@/lib/conselheiro/registros';
import { METRICAS, METRICA_EM_DINHEIRO, NOME_METRICA, NOME_STATUS_TESTE, PROXIMOS_TESTE, type Teste } from '@/lib/conselheiro/modelo';
import { AcaoForm } from '@/components/conselheiro/AcaoForm';
import { MedirTeste } from '@/components/conselheiro/MedirTeste';
import { criarTesteAction, mudarTesteAction, registrarMedicaoAction, resultadoManualAction } from '../actions';

export const metadata = { title: 'Conselheiro · Testes e metas' };

const br = (d: string | null) => (d ? d.split('-').reverse().join('/') : '?');
const ROTULO_PARA: Record<string, string> = { aprovado: 'Aprovar', 'em-andamento': 'Começar', concluido: 'Concluir', inconclusivo: 'Marcar inconclusivo', interrompido: 'Interromper' };

export default async function TestesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ decisao?: string }> }) {
  const { slug } = await params;
  const { decisao } = await searchParams;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const [ctx, testes, decisoes] = await Promise.all([contexto(slug), getTestes(slug), getDecisoes(slug)]);
  const origem = decisoes.find((d) => d.id === decisao && d.status === 'aprovada');
  const nome = (id: string) => ctx.produtos.find((p) => p.id === id)?.nome ?? id;
  const canal = (id: string) => ctx.perfil.canais.find((c) => c.id === id)?.nome ?? id;
  const fmt = (t: Teste, v: number) => (METRICA_EM_DINHEIRO[t.metrica] ? brl(v) : v.toLocaleString('pt-BR'));

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-ink-soft">
        Um teste diz o que você quer saber, como medir e por quanto tempo. O painel mostra o que aconteceu; ele não prova que foi a mudança que causou, e diz quando a amostra é pequena.
      </p>

      <ul className="space-y-3">
        {testes.map((t) => {
          const cmp = comparar(t);
          const final = PROXIMOS_TESTE[t.status].length === 0;
          return (
            <li key={t.id} id={t.id} className="card scroll-mt-6 space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold">{t.nome}</p>
                  <p className="text-sm text-ink-mute">{br(t.inicio)} a {br(t.fim)} · responsável: {t.responsavel || '—'} · {t.comparacao === 'antes-depois' ? 'antes e depois' : 'com grupo de controle'}</p>
                </div>
                <span className="chip bg-accent-soft text-accent">{NOME_STATUS_TESTE[t.status]}</span>
              </div>
              <p className="text-sm"><strong>Hipótese:</strong> {t.hipotese}</p>
              <p className="text-sm"><strong>Métrica principal:</strong> {NOME_METRICA[t.metrica]}{t.protecao.length ? ` · proteção: ${t.protecao.join(', ')}` : ''}</p>
              <p className="text-sm text-ink-soft">Produtos: {t.produtos.map(nome).join(', ') || 'todos'} · Canais: {t.canais.map(canal).join(', ') || 'todos'}</p>
              {t.premissas && <p className="text-sm text-ink-soft"><strong>Premissas:</strong> {t.premissas}</p>}
              {t.limites && <p className="text-sm text-ink-soft"><strong>Limites:</strong> {t.limites}</p>}

              {t.resultados.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="text-left text-ink-mute"><tr><th>Grupo</th><th>Valor</th><th>Dias</th><th>Atendimentos</th><th>Origem</th></tr></thead>
                  <tbody>
                    {t.resultados.map((r) => (
                      <tr key={r.id} className="border-t border-line"><td className="py-1">{r.grupo}</td><td className="tabular-nums">{fmt(t, r.valor)}</td><td>{r.dias}</td><td>{r.atendimentos ?? '—'}</td><td className="text-xs text-ink-mute">{r.origem === 'manual' ? 'informado à mão' : 'calculado'}{r.nota ? ` · ${r.nota}` : ''}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {cmp && (
                <div className="rounded-lg bg-paper p-3 text-sm">
                  <p className="font-semibold">Comparação (último resultado de cada grupo)</p>
                  <p>Por dia: base {fmt(t, cmp.avaliacao.porDiaBase)} · teste {fmt(t, cmp.avaliacao.porDiaTeste)} · diferença {fmt(t, cmp.avaliacao.diferencaPorDia)}</p>
                  {cmp.avaliacao.porAtendimentoBase !== null && cmp.avaliacao.porAtendimentoTeste !== null && <p>Por atendimento: base {fmt(t, cmp.avaliacao.porAtendimentoBase)} · teste {fmt(t, cmp.avaliacao.porAtendimentoTeste)}</p>}
                  {cmp.avaliacao.avisos.map((a) => <p key={a} className="text-warn">{a}</p>)}
                </div>
              )}
              {t.decisaoFinal && <p className="text-sm"><strong>Decisão final:</strong> {t.decisaoFinal}</p>}

              {!final && (
                <div className="space-y-3 border-t border-line pt-3">
                  {(t.status === 'aprovado' || t.status === 'em-andamento') && (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {t.comparacao === 'antes-depois' && (
                        <MedirTeste slug={slug} id={t.id} dinheiro={METRICA_EM_DINHEIRO[t.metrica]}>
                          <AcaoForm action={registrarMedicaoAction.bind(null, slug)} botao="Registrar base e teste calculados" variante="ghost">
                            <input type="hidden" name="id" value={t.id} />
                          </AcaoForm>
                        </MedirTeste>
                      )}
                      <details>
                        <summary className="cursor-pointer text-sm font-semibold text-accent">Registrar resultado à mão</summary>
                        <AcaoForm action={resultadoManualAction.bind(null, slug)} botao="Registrar" variante="ghost" className="mt-2">
                          <input type="hidden" name="id" value={t.id} />
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div><label className="label" htmlFor={`g-${t.id}`}>Grupo</label><select id={`g-${t.id}`} name="grupo" className="field"><option value="base">Base</option><option value="teste">Teste</option></select></div>
                            <div><label className="label" htmlFor={`v-${t.id}`}>{METRICA_EM_DINHEIRO[t.metrica] ? 'Valor (R$)' : 'Quantidade'}</label><input id={`v-${t.id}`} name="valor" className="field" inputMode="decimal" required /></div>
                            <div><label className="label" htmlFor={`d-${t.id}`}>Dias</label><input id={`d-${t.id}`} name="dias" className="field" inputMode="numeric" required /></div>
                            <div><label className="label" htmlFor={`a-${t.id}`}>Atendimentos</label><input id={`a-${t.id}`} name="atendimentos" className="field" inputMode="numeric" /></div>
                          </div>
                          <input name="nota" className="field" placeholder="De onde veio o número" maxLength={400} aria-label="Nota" />
                        </AcaoForm>
                      </details>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {PROXIMOS_TESTE[t.status].map((para) => (
                      <AcaoForm key={para} action={mudarTesteAction.bind(null, slug)} botao={ROTULO_PARA[para]} variante={para === 'interrompido' ? 'danger' : para === 'aprovado' || para === 'em-andamento' ? 'primary' : 'ghost'} inline>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="para" value={para} />
                        {(para === 'concluido' || para === 'inconclusivo') && <input name="decisaoFinal" className="field w-64" placeholder="Decisão final (manter, desfazer…)" maxLength={800} aria-label="Decisão final" required />}
                        {para === 'interrompido' && <input name="motivo" className="field w-48" placeholder="Por quê?" maxLength={400} aria-label="Motivo" required />}
                      </AcaoForm>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section id="novo" className="card scroll-mt-6 p-5">
        <h2 className="text-lg font-bold">Novo teste{origem ? `: ${origem.titulo}` : ''}</h2>
        <AcaoForm action={criarTesteAction.bind(null, slug)} botao="Criar teste (rascunho)" className="mt-3">
          {origem && <input type="hidden" name="decisaoId" value={origem.id} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="t-nome">Nome</label><input id="t-nome" name="nome" className="field" required maxLength={120} defaultValue={origem?.titulo} /></div>
            <div><label className="label" htmlFor="t-resp">Responsável</label><input id="t-resp" name="responsavel" className="field" maxLength={80} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="t-hip">Hipótese (o que você espera e como saberia)</label><textarea id="t-hip" name="hipotese" className="field min-h-16" required maxLength={600} defaultValue={origem?.recomendacao.slice(0, 600)} /></div>
            <div>
              <label className="label" htmlFor="t-met">Métrica principal</label>
              <select id="t-met" name="metrica" className="field" defaultValue="contribuicao-total">{METRICAS.map((m) => <option key={m} value={m}>{NOME_METRICA[m]}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="t-comp">Comparação</label>
              <select id="t-comp" name="comparacao" className="field"><option value="antes-depois">Antes e depois</option><option value="controle">Com grupo de controle (dias ou mesas sem a mudança)</option></select>
            </div>
            <div><label className="label" htmlFor="t-ini">Início</label><input id="t-ini" name="inicio" type="date" className="field" /></div>
            <div><label className="label" htmlFor="t-fim">Fim</label><input id="t-fim" name="fim" type="date" className="field" /></div>
            <fieldset className="sm:col-span-2">
              <legend className="label">Produtos</legend>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {ctx.produtos.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-sm"><input type="checkbox" name="produto" value={p.id} defaultChecked={origem?.produtos.includes(p.id)} /> {p.nome}</label>
                ))}
              </div>
            </fieldset>
            <fieldset className="sm:col-span-2">
              <legend className="label">Canais</legend>
              <div className="flex flex-wrap gap-2">
                {ctx.perfil.canais.map((c) => (
                  <label key={c.id} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-sm"><input type="checkbox" name="canal" value={c.id} /> {c.nome}</label>
                ))}
              </div>
            </fieldset>
            <div><label className="label" htmlFor="t-prot">Métricas de proteção (uma por linha)</label><textarea id="t-prot" name="protecao" className="field min-h-16" placeholder="Pedidos por dia&#10;Avaliações" /></div>
            <div><label className="label" htmlFor="t-prem">Premissas</label><textarea id="t-prem" name="premissas" className="field min-h-16" maxLength={600} placeholder="Sem outra promoção no período" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="t-lim">Limites operacionais</label><input id="t-lim" name="limites" className="field" maxLength={600} placeholder="Ex.: parar se faltar carne" /></div>
          </div>
          <p className="text-xs text-ink-mute">Antes e depois: o painel compara com o mesmo número de dias antes do início. Para grupo de controle, registre os resultados de cada grupo à mão.</p>
        </AcaoForm>
      </section>
    </div>
  );
}

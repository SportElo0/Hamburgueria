import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { brl } from '@/lib/conselheiro/calculos';
import { contribuicaoAgregada } from '@/lib/conselheiro/calculos';
import { custoVigente, etapasFeitas, taxasDoCanal } from '@/lib/conselheiro/dados';
import { panorama, prioridades } from '@/lib/conselheiro/alertas';
import { ETAPAS, NOME_ETAPA, NOME_STATUS_TESTE } from '@/lib/conselheiro/modelo';
import { AcaoForm } from '@/components/conselheiro/AcaoForm';
import { marcarAlertaAction } from './actions';

export const metadata = { title: 'Conselheiro · Hoje' };

const br = (d: string) => d.split('-').reverse().join('/');
const cor = { alta: 'bg-bad/10 text-bad', media: 'bg-warn/10 text-warn', baixa: 'bg-paper text-ink-mute' } as const;

export default async function HojePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const base = `/loja/${slug}/dono/conselheiro`;
  const p = await panorama(slug, base);
  const { ctx, recente } = p;
  const top = prioridades(base, p);
  const feitas = etapasFeitas(ctx);
  const faltam = ETAPAS.filter((e) => !feitas[e]);
  const andamento = p.testes.filter((t) => t.status === 'em-andamento' || t.status === 'aprovado');

  // Resumo do período: só canais com dado; contribuição só onde há custo.
  let receita = 0;
  let unidades = 0;
  let contribuicao = 0;
  let receitaComCusto = 0;
  for (const l of recente.linhas) {
    receita += l.receita;
    unidades += l.quantidade;
    const canal = ctx.perfil.canais.find((c) => c.id === l.canalId);
    const custo = custoVigente(ctx.custos, ctx.ficha, l.produtoId, ctx.dia, ctx.perfil.custoValidadeDias);
    if (!canal || !custo || custo.ingredientes === null) continue;
    const r = contribuicaoAgregada({ receita: l.receita, quantidade: l.quantidade, desconto: null, custos: { ingredientes: custo.ingredientes, embalagem: canal.embalagem ? custo.embalagem : 0, outros: custo.outros }, taxas: taxasDoCanal(canal) });
    if (r.contribuicao === null) continue;
    contribuicao += r.contribuicao;
    receitaComCusto += l.receita;
  }
  const comDado = recente.cobertura.filter((c) => c.ultimoDia);
  const ultima = comDado.map((c) => c.ultimoDia!).sort().at(-1) ?? null;

  return (
    <div className="space-y-8">
      {faltam.length > 0 && (
        <section className="rounded-xl border border-accent/30 bg-accent-soft p-5">
          <h2 className="text-lg font-bold">Comece pelo cadastro ({ETAPAS.length - faltam.length} de {ETAPAS.length})</h2>
          <p className="mt-1 text-sm text-ink-soft">Dá para começar com poucos produtos. Falta: {faltam.map((e) => NOME_ETAPA[e]).join(', ')}.</p>
          <Link href={`${base}/cadastro`} className="btn-primary mt-3">
            Continuar o cadastro
          </Link>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold">Prioridades</h2>
        {top.length === 0 ? (
          <p className="mt-2 text-ink-soft">Nada urgente com os dados de hoje. Quando um custo mudar, uma decisão esperar você ou um teste terminar, aparece aqui.</p>
        ) : (
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {top.map((t, i) => (
              <li key={i} className="card flex flex-col p-5">
                <p className="font-bold">{t.titulo}</p>
                <p className="mt-1 flex-1 text-sm text-ink-soft">{t.porque}</p>
                <Link href={t.href} className="btn-ghost mt-3 self-start">
                  {t.rotulo}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Últimos 30 dias</h2>
        {comDado.length === 0 ? (
          <p className="mt-2 text-ink-soft">
            Ainda não há vendas registradas. <Link className="font-semibold text-accent" href={`${base}/importar?tipo=vendas`}>Importe uma planilha de vendas</Link>
            {ctx.perfil.canais.some((c) => c.id === 'painel') ? '' : ' ou cadastre o canal dos pedidos do painel'}.
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="card p-5">
                <p className="text-[13px] font-semibold text-ink-mute">Receita depois dos descontos</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">{brl(receita)}</p>
              </div>
              <div className="card p-5">
                <p className="text-[13px] font-semibold text-ink-mute">Unidades vendidas</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">{unidades.toLocaleString('pt-BR')}</p>
              </div>
              <div className="card p-5">
                <p className="text-[13px] font-semibold text-ink-mute">Contribuição (itens com custo)</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">{receitaComCusto ? brl(contribuicao) : '—'}</p>
                <p className="mt-1 text-xs text-ink-mute">
                  {receita ? `Itens com custo: ${Math.round((receitaComCusto / receita) * 100)}% da receita.` : ''} Não é lucro: aluguel, equipe e outros custos fixos não entram.
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-mute">
              {br(recente.inicio)} a {br(recente.fim)}. Dado mais recente: {ultima ? br(ultima) : '—'}. Canais com dado: {comDado.map((c) => ctx.perfil.canais.find((x) => x.id === c.canalId)?.nome ?? c.canalId).join(', ')}.
              {recente.cobertura.some((c) => !c.ultimoDia) && ` Sem dado: ${recente.cobertura.filter((c) => !c.ultimoDia).map((c) => ctx.perfil.canais.find((x) => x.id === c.canalId)?.nome ?? c.canalId).join(', ')} (não conta como zero).`}
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Alertas</h2>
        {p.alertas.length === 0 ? (
          <p className="mt-2 text-ink-soft">Nenhum alerta.{p.ocultos ? ` ${p.ocultos} resolvido(s), adiado(s) ou dispensado(s).` : ''}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {p.alertas.map((a) => (
              <li key={a.chave} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">
                      <span className={`chip mr-2 ${cor[a.relevancia]}`}>{a.relevancia === 'alta' ? 'Importante' : a.relevancia === 'media' ? 'Atenção' : 'Para ver'}</span>
                      {a.titulo}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{a.evidencia}</p>
                  </div>
                  <Link href={a.acao.href} className="btn-ghost shrink-0">
                    {a.acao.rotulo}
                  </Link>
                </div>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-ink-mute">Resolver, adiar ou dispensar</summary>
                  <AcaoForm action={marcarAlertaAction.bind(null, slug)} botao="Salvar" variante="ghost" inline className="mt-2">
                    <input type="hidden" name="chave" value={a.chave} />
                    <label className="sr-only" htmlFor={`acao-${a.chave}`}>O que fazer</label>
                    <select id={`acao-${a.chave}`} name="acao" className="field w-auto">
                      <option value="resolvido">Resolvi</option>
                      <option value="adiado">Lembrar em 7 dias</option>
                      <option value="dispensado">Não vale (diga por quê)</option>
                    </select>
                    <label className="sr-only" htmlFor={`motivo-${a.chave}`}>Motivo</label>
                    <input id={`motivo-${a.chave}`} name="motivo" className="field max-w-xs" placeholder="Motivo" maxLength={300} />
                  </AcaoForm>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Testes em andamento</h2>
        {andamento.length === 0 ? (
          <p className="mt-2 text-ink-soft">Nenhum. Uma decisão aprovada pode virar um teste em <Link className="font-semibold text-accent" href={`${base}/testes`}>Testes e metas</Link>.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {andamento.map((t) => (
              <li key={t.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{t.nome}</p>
                  <p className="text-sm text-ink-soft">
                    {NOME_STATUS_TESTE[t.status]} · {t.inicio ? br(t.inicio) : '?'} a {t.fim ? br(t.fim) : '?'} · {t.resultados.length} resultado(s)
                  </p>
                </div>
                <Link href={`${base}/testes#${t.id}`} className="btn-ghost">
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

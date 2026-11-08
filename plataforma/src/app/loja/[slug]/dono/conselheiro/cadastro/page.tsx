import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { fmtBps } from '@/lib/conselheiro/calculos';
import { contexto, etapasFeitas } from '@/lib/conselheiro/dados';
import { CANAL_PAINEL, ETAPAS, NOME_ETAPA, NOME_TIPO_CANAL, TIPOS_CANAL, type Canal } from '@/lib/conselheiro/modelo';
import { AcaoForm } from '@/components/conselheiro/AcaoForm';
import { adicionarProdutoAction, criarCanalPainelAction, salvarCanalAction, salvarNegocioAction, salvarPrioritariosAction } from '../actions';

export const metadata = { title: 'Conselheiro · Cadastro' };

const pctTxt = (v: number | null) => (v === null ? '' : (v / 100).toString().replace('.', ','));

function CamposCanal({ c }: { c?: Canal }) {
  const k = c?.id ?? 'novo';
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div>
        <label className="label" htmlFor={`nome-${k}`}>Nome</label>
        <input id={`nome-${k}`} name="nome" className="field" required maxLength={60} defaultValue={c?.nome} placeholder="Ex.: iFood, Salão" />
      </div>
      <div>
        <label className="label" htmlFor={`tipo-${k}`}>Tipo</label>
        <select id={`tipo-${k}`} name="tipo" className="field" defaultValue={c?.tipo ?? 'app'}>
          {TIPOS_CANAL.map((t) => (
            <option key={t} value={t}>{NOME_TIPO_CANAL[t]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`com-${k}`}>Comissão do canal (%)</label>
        <input id={`com-${k}`} name="comissao" className="field" inputMode="decimal" defaultValue={pctTxt(c?.comissaoBps ?? null)} placeholder="vazio = não sei" />
      </div>
      <div>
        <label className="label" htmlFor={`pag-${k}`}>Taxa de pagamento (%)</label>
        <input id={`pag-${k}`} name="pagamento" className="field" inputMode="decimal" defaultValue={pctTxt(c?.pagamentoBps ?? null)} placeholder="vazio = não sei" />
      </div>
      <div>
        <label className="label" htmlFor={`trib-${k}`}>Tributo variável (%)</label>
        <input id={`trib-${k}`} name="tributos" className="field" inputMode="decimal" defaultValue={pctTxt(c?.tributosBps ?? null)} placeholder="confirme com o contador" />
      </div>
      <div className="flex flex-col justify-end gap-2 text-sm sm:col-span-2 lg:col-span-3">
        <label className="flex items-center gap-2"><input type="checkbox" name="tributosConfirmado" defaultChecked={c?.tributosConfirmado} /> Confirmei o percentual de tributo (o painel não deduz o regime)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="comissaoBruto" defaultChecked={c?.comissaoBase === 'bruto'} /> A comissão é cobrada sobre o preço cheio, antes do desconto</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="embalagem" defaultChecked={c ? c.embalagem : true} /> Usa embalagem</label>
        {c && <label className="flex items-center gap-2"><input type="checkbox" name="ativo" defaultChecked={c.ativo} /> Canal ativo</label>}
      </div>
    </div>
  );
}

function Marca({ feito }: { feito: boolean }) {
  return <span className={`chip ml-2 align-middle ${feito ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>{feito ? 'feito' : 'falta'}</span>;
}

export default async function CadastroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const ctx = await contexto(slug);
  const { perfil } = ctx;
  const feitas = etapasFeitas(ctx);
  const base = `/loja/${slug}/dono/conselheiro`;
  const temCardapio = ctx.produtos.some((p) => p.origem === 'cardapio');

  return (
    <div className="space-y-6">
      <p className="text-ink-soft">
        Preencha aos poucos: cada parte é salva sozinha. Faltando:{' '}
        {ETAPAS.filter((e) => !feitas[e]).map((e) => NOME_ETAPA[e]).join(', ') || 'nada'}.
      </p>

      <section className="card p-5">
        <h2 className="text-lg font-bold">1. O negócio<Marca feito={Boolean(feitas.negocio)} /></h2>
        <AcaoForm action={salvarNegocioAction.bind(null, slug)} botao="Salvar o negócio" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="segmento">Segmento</label><input id="segmento" name="segmento" className="field" maxLength={80} defaultValue={perfil.segmento} placeholder="Hamburgueria, pizzaria…" /></div>
            <div><label className="label" htmlFor="unidade">Unidade</label><input id="unidade" name="unidade" className="field" maxLength={80} defaultValue={perfil.unidade} placeholder="Ex.: Centro" /></div>
            <div><label className="label" htmlFor="horarios">Horários</label><input id="horarios" name="horarios" className="field" maxLength={300} defaultValue={perfil.horarios} placeholder="Ter a dom, 18h às 23h" /></div>
            <div><label className="label" htmlFor="sistemaAtual">Sistema que usa hoje</label><input id="sistemaAtual" name="sistemaAtual" className="field" maxLength={120} defaultValue={perfil.sistemaAtual} placeholder="Ex.: Saipos, caderno, planilha" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="publico">Público</label><input id="publico" name="publico" className="field" maxLength={300} defaultValue={perfil.publico} /></div>
            <div><label className="label" htmlFor="objetivos">Objetivos</label><textarea id="objetivos" name="objetivos" className="field min-h-20" maxLength={600} defaultValue={perfil.objetivos} placeholder="O que você quer melhorar nos próximos meses" /></div>
            <div><label className="label" htmlFor="restricoes">Restrições da operação</label><textarea id="restricoes" name="restricoes" className="field min-h-20" maxLength={600} defaultValue={perfil.restricoes} placeholder="Ex.: cozinha faz no máximo 60 lanches por noite" /></div>
          </div>
          <p className="text-xs text-ink-mute">Não escreva nome, telefone ou outro dado de clientes nestes campos: eles são usados pelo Conselheiro.</p>
        </AcaoForm>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">2. Canais de venda<Marca feito={Boolean(feitas.canais)} /></h2>
        <p className="mt-1 text-sm text-ink-soft">Cada canal tem as próprias taxas. Deixe em branco o que você não sabe: o painel avisa o que ficou fora da conta, em vez de usar zero.</p>
        <ul className="mt-3 space-y-2">
          {perfil.canais.map((c) => (
            <li key={c.id} className="rounded-lg border border-line p-3">
              <details>
                <summary className="cursor-pointer font-semibold">
                  {c.nome} <span className="font-normal text-ink-mute">· {NOME_TIPO_CANAL[c.tipo]} · comissão {fmtBps(c.comissaoBps)} · pagamento {fmtBps(c.pagamentoBps)} · tributo {c.tributosConfirmado ? fmtBps(c.tributosBps) : 'não confirmado'}{c.ativo ? '' : ' · inativo'}</span>
                </summary>
                <AcaoForm action={salvarCanalAction.bind(null, slug)} botao="Salvar canal" variante="ghost" className="mt-3">
                  <CamposCanal c={c} />
                </AcaoForm>
              </details>
            </li>
          ))}
        </ul>
        {temCardapio && !perfil.canais.some((c) => c.id === CANAL_PAINEL) && (
          <div className="mt-3 rounded-lg bg-accent-soft p-3 text-sm">
            <p>Seus pedidos pelo site e pela mesa já passam pelo painel. Crie o canal deles para as vendas entrarem sozinhas nas contas.</p>
            <AcaoForm action={criarCanalPainelAction.bind(null, slug)} botao="Criar canal dos pedidos do painel" variante="ghost" className="mt-2" />
          </div>
        )}
        <details className="mt-3">
          <summary className="btn-ghost inline-flex">Adicionar canal</summary>
          <AcaoForm action={salvarCanalAction.bind(null, slug)} botao="Adicionar canal" className="mt-3">
            <CamposCanal />
          </AcaoForm>
        </details>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">3. Produtos prioritários e meta<Marca feito={Boolean(feitas.produtos)} /></h2>
        <p className="mt-1 text-sm text-ink-soft">Comece com até 15 produtos (os que mais vendem ou que você quer mexer). Não precisa organizar o cardápio inteiro antes.</p>
        {ctx.produtos.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-warn">Nenhum produto ainda: cadastre abaixo ou importe uma lista em Importar.</p>
        ) : (
          <AcaoForm action={salvarPrioritariosAction.bind(null, slug)} botao="Salvar prioritários e meta" className="mt-3">
            <fieldset>
              <legend className="label">Prioritários</legend>
              <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
                {ctx.produtos.map((p) => (
                  <label key={p.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                    <input type="checkbox" name="produto" value={p.id} defaultChecked={perfil.prioritarios.includes(p.id)} />
                    {p.nome}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="label" htmlFor="meta">Meta mínima de contribuição (% do preço)</label>
                <input id="meta" name="meta" className="field w-32" inputMode="decimal" defaultValue={pctTxt(perfil.metaContribuicaoBps)} placeholder="sem meta" />
                <p className="mt-1 text-xs text-ink-mute">Você define. O painel avisa quem ficar abaixo.</p>
              </div>
              <div>
                <label className="label" htmlFor="validade">Custo vale por (dias)</label>
                <input id="validade" name="validade" className="field w-24" inputMode="numeric" defaultValue={perfil.custoValidadeDias} />
              </div>
            </div>
          </AcaoForm>
        )}
        <details className="mt-4">
          <summary className="btn-ghost inline-flex">Cadastrar produto fora do cardápio</summary>
          <AcaoForm action={adicionarProdutoAction.bind(null, slug)} botao="Cadastrar" inline className="mt-3">
            <div><label className="label" htmlFor="novo-nome">Nome</label><input id="novo-nome" name="nome" className="field" required maxLength={80} /></div>
            <div><label className="label" htmlFor="novo-cat">Categoria</label><input id="novo-cat" name="categoria" className="field" maxLength={60} /></div>
          </AcaoForm>
        </details>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">4. Custos<Marca feito={Boolean(feitas.custos)} /></h2>
        <p className="mt-1 text-sm text-ink-soft">Custo dos ingredientes por unidade (ou o custo de um lote e quantas porções ele rende), embalagem e outros custos variáveis.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${base}/produtos`} className="btn-ghost">Informar em Produtos e custos</Link>
          <Link href={`${base}/importar?tipo=custos`} className="btn-ghost">Importar planilha de custos</Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">5. Vendas<Marca feito={Boolean(feitas.vendas)} /></h2>
        <p className="mt-1 text-sm text-ink-soft">
          {perfil.canais.some((c) => c.id === CANAL_PAINEL) ? 'Os pedidos do painel já entram sozinhos. ' : ''}Para os outros canais (app de delivery, caixa), importe uma planilha de vendas por produto. Sem vendas, as simulações pedem o volume para você.
        </p>
        <Link href={`${base}/importar?tipo=vendas`} className="btn-ghost mt-3">Importar vendas</Link>
      </section>
    </div>
  );
}

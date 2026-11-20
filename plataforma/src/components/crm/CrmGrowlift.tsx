'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  NOME_PRODUTO_CRM,
  NOME_SITUACAO,
  PRODUTOS,
  SITUACOES,
  brl,
  centavosDe,
  csvDoCrm,
  totais,
  type ClienteCrm,
  type ProdutoCrm,
  type Situacao,
} from '@/lib/crm';
import {
  adicionarNotaAction,
  adicionarVendaAction,
  alternarPagoAction,
  removerClienteAction,
  removerVendaAction,
  salvarClienteAction,
  type ResultadoCrm,
} from '@/app/painel/clientes/actions';

const fmtFone = (p: string) => (p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : p.length === 10 ? `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}` : p);
const fmtData = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
const fmtQuando = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const COR: Record<Situacao, string> = { cliente: 'bg-ok/10 text-ok', possivel: 'bg-accent/10 text-accent', perdido: 'bg-line text-ink-mute' };

const FILTROS = {
  todos: { label: 'Todos', ok: () => true },
  cliente: { label: 'Clientes', ok: (c: ClienteCrm) => c.situacao === 'cliente' },
  possivel: { label: 'Possíveis clientes', ok: (c: ClienteCrm) => c.situacao === 'possivel' },
  receber: { label: 'A receber', ok: (c: ClienteCrm) => c.vendas.some((v) => !v.pago) },
  mensal: { label: 'Mensalidade', ok: (c: ClienteCrm) => c.vendas.some((v) => v.mensal) },
  perdido: { label: 'Não fecharam', ok: (c: ClienteCrm) => c.situacao === 'perdido' },
} as const;
type Filtro = keyof typeof FILTROS;

type Dados = { id?: string; negocio: string; contato: string; whatsapp: string; cidade: string; situacao: Situacao };
const vazio: Dados = { negocio: '', contato: '', whatsapp: '', cidade: '', situacao: 'possivel' };

/** The team's customer list: add by hand, sales (paid / to receive), monthly fees, notes, WhatsApp, export. */
export function CrmGrowlift({ inicial, hoje }: { inicial: ClienteCrm[]; hoje: string }) {
  const [lista, setLista] = useState(inicial);
  const [pending, start] = useTransition();
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [novo, setNovo] = useState<Dados | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  const t = useMemo(() => totais(lista, hoje.slice(0, 7)), [lista, hoje]);
  const contagem = useMemo(() => Object.fromEntries((Object.keys(FILTROS) as Filtro[]).map((f) => [f, lista.filter(FILTROS[f].ok).length])) as Record<Filtro, number>, [lista]);
  const vistos = useMemo(() => {
    const q = norm(busca.trim());
    const dig = busca.replace(/\D/g, '');
    return lista.filter((c) => FILTROS[filtro].ok(c) && (!q || norm(`${c.negocio} ${c.contato} ${c.cidade}`).includes(q) || (dig.length >= 3 && c.whatsapp.includes(dig))));
  }, [lista, busca, filtro]);

  const fazer = (p: Promise<ResultadoCrm>, depois?: () => void) => {
    setErro('');
    start(async () => {
      const r = await p;
      if (!r.ok) return setErro(r.error);
      setLista(r.lista);
      depois?.();
    });
  };

  const exportar = () => {
    const blob = new Blob([csvDoCrm(vistos)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-growlift-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero titulo="Vendido no mês" valor={brl(t.vendidoNoMes)} nota="vendas do mês + mensalidades" />
        <Numero titulo="A receber" valor={brl(t.aReceber)} destaque={t.aReceber > 0} />
        <Numero titulo="Por mês (mensalidades)" valor={brl(t.recorrente)} />
        <Numero titulo="Clientes · possíveis" valor={`${t.clientes} · ${t.possiveis}`} nota={`total vendido ${brl(t.totalVendido)}`} />
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="crm-busca" className="sr-only">
            Buscar
          </label>
          <input id="crm-busca" type="search" className="field flex-1" placeholder="Buscar por negócio, contato, cidade ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button type="button" className="btn-primary min-h-11" onClick={() => setNovo({ ...vazio })} disabled={Boolean(novo)}>
            + Adicionar
          </button>
          <button type="button" className="btn-ghost min-h-11" onClick={exportar} disabled={!vistos.length}>
            Exportar planilha
          </button>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar">
          {(Object.keys(FILTROS) as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filtro === f}
              onClick={() => setFiltro(f)}
              className={`min-h-9 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap ${filtro === f ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-ink/40'}`}
            >
              {FILTROS[f].label} <span className="tabular-nums opacity-70">{contagem[f]}</span>
            </button>
          ))}
        </div>
        {erro && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {erro}
          </p>
        )}
      </div>

      {novo && (
        <FormCliente
          titulo="Novo cliente ou possível cliente"
          dados={novo}
          pending={pending}
          onCancel={() => setNovo(null)}
          onSave={(d) => fazer(salvarClienteAction(d), () => setNovo(null))}
        />
      )}

      {lista.length === 0 && !novo ? (
        <div className="card p-6 text-center text-ink-soft">
          <p className="font-semibold text-ink">Nenhum cliente ainda.</p>
          <p className="mt-1 text-sm">Toque em “+ Adicionar” e cadastre quem já comprou (e quem pode comprar).</p>
        </div>
      ) : vistos.length === 0 ? (
        <p className="card p-5 text-center text-sm text-ink-mute">Ninguém com esse filtro.</p>
      ) : (
        <ul className="space-y-3">
          {vistos.map((c) => (
            <ItemCliente key={c.id} c={c} aberto={aberto === c.id} pending={pending} hoje={hoje} onToggle={() => setAberto(aberto === c.id ? null : c.id)} fazer={fazer} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Numero({ titulo, valor, nota, destaque }: { titulo: string; valor: string; nota?: string; destaque?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-ink-mute">{titulo}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight tabular-nums ${destaque ? 'text-warn' : ''}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-xs text-ink-mute">{nota}</p>}
    </div>
  );
}

function FormCliente({ titulo, dados, pending, onSave, onCancel }: { titulo: string; dados: Dados; pending: boolean; onSave: (d: Dados) => void; onCancel: () => void }) {
  const [d, setD] = useState(dados);
  const campo = (k: keyof Omit<Dados, 'id' | 'situacao'>, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`cli-${k}`} className="label">
        {label}
      </label>
      <input id={`cli-${k}`} className="field" value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} {...extra} />
    </div>
  );
  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(d);
      }}
    >
      <h2 className="font-bold">{titulo}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {campo('negocio', 'Negócio *', { required: true, maxLength: 80, placeholder: 'Ex.: Caiçara Burguer' })}
        {campo('contato', 'Nome do contato', { maxLength: 60, placeholder: 'Quem fala com a gente' })}
        {campo('whatsapp', 'WhatsApp', { inputMode: 'tel', maxLength: 20, placeholder: '(12) 91234-5678' })}
        {campo('cidade', 'Cidade / bairro', { maxLength: 60, placeholder: 'Ex.: Juquehy' })}
      </div>
      <fieldset>
        <legend className="label">Situação</legend>
        <div className="flex flex-wrap gap-2">
          {SITUACOES.map((s) => (
            <label key={s} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${d.situacao === s ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
              <input type="radio" name="situacao" value={s} checked={d.situacao === s} onChange={() => setD({ ...d, situacao: s })} className="sr-only" />
              {NOME_SITUACAO[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-ink-mute">Não coloque CPF aqui.</p>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary min-h-11" disabled={pending || !d.negocio.trim()}>
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" className="btn-ghost min-h-11" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ItemCliente(props: { c: ClienteCrm; aberto: boolean; pending: boolean; hoje: string; onToggle: () => void; fazer: (p: Promise<ResultadoCrm>, depois?: () => void) => void }) {
  const { c, fazer, pending } = props;
  const [editando, setEditando] = useState(false);
  const [venda, setVenda] = useState<{ produto: ProdutoCrm; descricao: string; valor: string; data: string; pago: boolean; mensal: boolean; vencimento: string } | null>(null);
  const [nota, setNota] = useState('');
  const [erroVenda, setErroVenda] = useState('');
  const aReceber = c.vendas.filter((v) => !v.pago).reduce((s, v) => s + v.valor, 0);
  const total = c.vendas.reduce((s, v) => s + v.valor, 0);
  const produtos = [...new Set(c.vendas.map((v) => NOME_PRODUTO_CRM[v.produto]))];

  const salvarVenda = () => {
    if (!venda) return;
    const valor = centavosDe(venda.valor);
    if (!Number.isFinite(valor)) return setErroVenda('Valor inválido. Ex.: 80 ou 147,00');
    setErroVenda('');
    fazer(
      adicionarVendaAction(c.id, { produto: venda.produto, descricao: venda.descricao, valor, data: venda.data, pago: venda.pago, mensal: venda.mensal, vencimento: venda.mensal && venda.vencimento ? Number(venda.vencimento) : null }),
      () => setVenda(null),
    );
  };

  return (
    <li className="card overflow-hidden">
      <button type="button" className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4 text-left hover:bg-paper/60" aria-expanded={props.aberto} onClick={props.onToggle}>
        <div className="min-w-0">
          <p className="font-bold">
            {c.negocio} <span className={`chip ml-1 align-middle ${COR[c.situacao]}`}>{NOME_SITUACAO[c.situacao]}</span>
          </p>
          <p className="text-sm text-ink-mute">
            {[c.contato, c.cidade, produtos.join(', ')].filter(Boolean).join(' · ') || 'Sem detalhes ainda'}
          </p>
        </div>
        <div className="text-right text-sm tabular-nums">
          {total > 0 && <p className="font-semibold">{brl(total)}</p>}
          {aReceber > 0 && <p className="font-semibold text-warn">a receber {brl(aReceber)}</p>}
        </div>
      </button>

      {props.aberto && (
        <div className="space-y-5 border-t border-line p-4">
          {editando ? (
            <FormCliente
              titulo="Editar"
              dados={{ id: c.id, negocio: c.negocio, contato: c.contato, whatsapp: c.whatsapp, cidade: c.cidade, situacao: c.situacao }}
              pending={pending}
              onCancel={() => setEditando(false)}
              onSave={(d) => fazer(salvarClienteAction(d), () => setEditando(false))}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {c.whatsapp && (
                <a className="btn min-h-10 border border-ok/40 bg-ok/5 px-4 text-ok hover:bg-ok hover:text-white" href={`https://wa.me/55${c.whatsapp}`} target="_blank" rel="noreferrer">
                  WhatsApp {fmtFone(c.whatsapp)}
                </a>
              )}
              <button type="button" className="btn-ghost min-h-10" onClick={() => setEditando(true)}>
                Editar
              </button>
              <button
                type="button"
                className="btn-ghost min-h-10 text-bad"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Apagar ${c.negocio} e todas as vendas e anotações dele?`)) fazer(removerClienteAction(c.id));
                }}
              >
                Apagar
              </button>
            </div>
          )}

          <section aria-label="Vendas">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold">Vendas</h3>
              {!venda && (
                <button type="button" className="btn-ghost min-h-10" onClick={() => setVenda({ produto: 'plaquinha-nfc', descricao: '', valor: '', data: props.hoje, pago: true, mensal: false, vencimento: '' })}>
                  + Venda
                </button>
              )}
            </div>
            {venda && (
              <div className="mt-2 space-y-3 rounded-xl border border-line bg-paper/60 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor={`v-prod-${c.id}`} className="label">
                      Produto
                    </label>
                    <select id={`v-prod-${c.id}`} className="field" value={venda.produto} onChange={(e) => setVenda({ ...venda, produto: e.target.value as ProdutoCrm, mensal: e.target.value === 'app' ? true : venda.mensal })}>
                      {PRODUTOS.map((p) => (
                        <option key={p} value={p}>
                          {NOME_PRODUTO_CRM[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`v-valor-${c.id}`} className="label">
                      Valor (R$){venda.mensal ? ' por mês' : ''}
                    </label>
                    <input id={`v-valor-${c.id}`} className="field" inputMode="decimal" placeholder="80,00" value={venda.valor} onChange={(e) => setVenda({ ...venda, valor: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={`v-data-${c.id}`} className="label">
                      Data
                    </label>
                    <input id={`v-data-${c.id}`} type="date" className="field" value={venda.data} onChange={(e) => setVenda({ ...venda, data: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label htmlFor={`v-desc-${c.id}`} className="label">
                    Detalhe (opcional)
                  </label>
                  <input id={`v-desc-${c.id}`} className="field" maxLength={120} placeholder="Ex.: 2 plaquinhas, uma no balcão e uma na mesa" value={venda.descricao} onChange={(e) => setVenda({ ...venda, descricao: e.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-5 w-5" checked={venda.pago} onChange={(e) => setVenda({ ...venda, pago: e.target.checked })} /> Já pagou
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-5 w-5" checked={venda.mensal} onChange={(e) => setVenda({ ...venda, mensal: e.target.checked })} /> É mensalidade
                  </label>
                  {venda.mensal && (
                    <label className="flex items-center gap-2">
                      Vence todo dia
                      <input className="field w-20" inputMode="numeric" maxLength={2} placeholder="10" value={venda.vencimento} onChange={(e) => setVenda({ ...venda, vencimento: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                    </label>
                  )}
                </div>
                {erroVenda && (
                  <p role="alert" className="text-sm font-semibold text-bad">
                    {erroVenda}
                  </p>
                )}
                <div className="flex gap-2">
                  <button type="button" className="btn-primary min-h-10" onClick={salvarVenda} disabled={pending || !venda.valor}>
                    Salvar venda
                  </button>
                  <button type="button" className="btn-ghost min-h-10" onClick={() => setVenda(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {c.vendas.length === 0 ? (
              !venda && <p className="mt-2 text-sm text-ink-mute">Nenhuma venda ainda.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {c.vendas.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {NOME_PRODUTO_CRM[v.produto]} · {brl(v.valor)}
                        {v.mensal && <span className="font-normal text-ink-mute"> por mês{v.vencimento ? `, vence dia ${v.vencimento}` : ''}</span>}
                      </p>
                      <p className="text-ink-mute">
                        {fmtData(v.data)}
                        {v.descricao && ` · ${v.descricao}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`chip min-h-8 cursor-pointer ${v.pago ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}
                        title="Tocar para trocar"
                        disabled={pending}
                        onClick={() => fazer(alternarPagoAction(c.id, v.id))}
                      >
                        {v.pago ? 'Pago' : 'A receber'}
                      </button>
                      <button
                        type="button"
                        className="min-h-8 px-1 text-ink-mute underline"
                        disabled={pending}
                        onClick={() => {
                          if (confirm('Apagar esta venda?')) fazer(removerVendaAction(c.id, v.id));
                        }}
                      >
                        apagar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Anotações">
            <h3 className="font-bold">Anotações</h3>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (nota.trim()) fazer(adicionarNotaAction(c.id, nota), () => setNota(''));
              }}
            >
              <label htmlFor={`nota-${c.id}`} className="sr-only">
                Nova anotação
              </label>
              <input id={`nota-${c.id}`} className="field flex-1" maxLength={500} placeholder="Ex.: plaquinha entregue, pediu link de avaliação (sem CPF)" value={nota} onChange={(e) => setNota(e.target.value)} />
              <button type="submit" className="btn-ghost min-h-11" disabled={pending || !nota.trim()}>
                Anotar
              </button>
            </form>
            {c.notas.length > 0 && (
              <ul className="mt-2 space-y-2">
                {c.notas.map((n, i) => (
                  <li key={i} className="rounded-lg bg-paper px-3 py-2 text-sm">
                    <p>{n.texto}</p>
                    <p className="mt-0.5 text-xs text-ink-mute">
                      {fmtQuando(n.em)} · {n.por}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </li>
  );
}

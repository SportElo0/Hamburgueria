'use client';

import { useMemo, useState, useTransition } from 'react';
import { brl, centavosDe, type ClienteCrm } from '@/lib/crm';
import {
  CATEGORIAS,
  FREQUENCIAS,
  NOME_CATEGORIA,
  NOME_FREQUENCIA,
  custoFixoMensal,
  mesAnterior,
  mesSeguinte,
  nomeMes,
  proximos,
  resumoDoMes,
  type Categoria,
  type Custo,
  type Frequencia,
} from '@/lib/custos';
import { encerrarCustoAction, removerCustoAction, salvarCustoAction, type ResultadoCaixa } from '@/app/painel/caixa/actions';

const fmtData = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const fmtDataAno = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

type Form = { id?: string; nome: string; categoria: Categoria; valor: string; frequencia: Frequencia; data: string; nota: string };

/** The "Caixa" tab: the month (in, out, left), next charges and every cost, added by hand. */
export function CaixaGrowlift({ inicial, clientes, hoje }: { inicial: Custo[]; clientes: ClienteCrm[]; hoje: string }) {
  const [lista, setLista] = useState(inicial);
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState('');
  const [pending, start] = useTransition();

  const m = useMemo(() => resumoDoMes(lista, clientes, mes), [lista, clientes, mes]);
  const fixo = useMemo(() => custoFixoMensal(lista, hoje), [lista, hoje]);
  const prox = useMemo(() => proximos(lista, hoje, 30), [lista, hoje]);
  const ativos = lista.filter((c) => !c.fim || c.fim >= hoje);
  const encerrados = lista.filter((c) => c.fim && c.fim < hoje);

  const fazer = (p: Promise<ResultadoCaixa>, depois?: () => void) => {
    setErro('');
    start(async () => {
      const r = await p;
      if (!r.ok) return setErro(r.error);
      setLista(r.lista);
      depois?.();
    });
  };

  const salvar = () => {
    if (!form) return;
    const valor = centavosDe(form.valor);
    if (!Number.isFinite(valor)) return setErro('Valor inválido. Ex.: 86 ou 129,90');
    fazer(salvarCustoAction({ id: form.id, nome: form.nome, categoria: form.categoria, valor, frequencia: form.frequencia, data: form.data, nota: form.nota }), () => setForm(null));
  };

  const editar = (c: Custo) =>
    setForm({ id: c.id, nome: c.nome, categoria: c.categoria, valor: (c.valor / 100).toFixed(2).replace('.', ','), frequencia: c.frequencia, data: c.data, nota: c.nota });

  return (
    <div className="mt-6 space-y-5">
      <section className="card p-4" aria-label="Resumo do mês">
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="btn-ghost min-h-10 px-3" onClick={() => setMes(mesAnterior(mes))} aria-label="Mês anterior">
            ←
          </button>
          <h2 className="text-lg font-bold">{nomeMes(mes)}</h2>
          <button type="button" className="btn-ghost min-h-10 px-3" onClick={() => setMes(mesSeguinte(mes))} aria-label="Próximo mês">
            →
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Numero titulo="Entrou (pago)" valor={brl(m.entrou)} cor="text-ok" />
          <Numero titulo="A receber" valor={brl(m.aReceber)} cor={m.aReceber ? 'text-warn' : ''} />
          <Numero titulo="Saiu (custos)" valor={brl(m.saiu)} cor="text-bad" />
          <Numero titulo="Sobra pra gastar" valor={brl(m.sobra)} cor={m.sobra >= 0 ? 'text-ok' : 'text-bad'} destaque />
        </div>
        <p className="mt-3 text-sm text-ink-mute">
          Sobra = entrou + a receber − custos do mês. Custo fixo médio por mês (mensais + anuais ÷ 12): <b className="text-ink">{brl(fixo)}</b>.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-4" aria-labelledby="saidas">
          <h2 id="saidas" className="font-bold">
            Custos de {nomeMes(mes).split(' ')[0].toLowerCase()}
          </h2>
          {m.saidas.length === 0 ? (
            <p className="mt-2 text-sm text-ink-mute">Nenhum custo neste mês.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {m.saidas.map(({ custo, dia }) => (
                <li key={custo.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <b className="font-semibold">{custo.nome}</b> <span className="text-ink-mute">· dia {fmtData(dia)}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{brl(custo.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-4" aria-labelledby="prox">
          <h2 id="prox" className="font-bold">
            Vence nos próximos 30 dias
          </h2>
          {prox.length === 0 ? (
            <p className="mt-2 text-sm text-ink-mute">Nada vencendo.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {prox.map(({ custo, dia }) => (
                <li key={custo.id + dia} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className={`chip mr-2 ${dia === hoje ? 'bg-warn/10 text-warn' : 'bg-line text-ink-soft'}`}>{dia === hoje ? 'hoje' : fmtData(dia)}</span>
                    {custo.nome}
                  </span>
                  <span className="font-semibold tabular-nums">{brl(custo.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card space-y-3 p-4" aria-labelledby="todos">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="todos" className="font-bold">
            Todos os custos
          </h2>
          <button type="button" className="btn-primary min-h-11" disabled={Boolean(form)} onClick={() => setForm({ nome: '', categoria: 'assinatura', valor: '', frequencia: 'mensal', data: hoje, nota: '' })}>
            + Adicionar custo
          </button>
        </div>

        {form && (
          <form
            className="space-y-3 rounded-xl border border-line bg-paper/60 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="c-nome" className="label">
                  O que é *
                </label>
                <input id="c-nome" className="field" required maxLength={80} placeholder="Ex.: Imposto (DAS do MEI), Claude, 10 plaquinhas" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-cat" className="label">
                  Tipo
                </label>
                <select id="c-cat" className="field" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {NOME_CATEGORIA[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="c-valor" className="label">
                  Valor (R$){form.frequencia === 'mensal' ? ' por mês' : form.frequencia === 'anual' ? ' por ano' : ''} *
                </label>
                <input id="c-valor" className="field" required inputMode="decimal" placeholder="86,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-freq" className="label">
                  Quando cobra
                </label>
                <select id="c-freq" className="field" value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value as Frequencia })}>
                  {FREQUENCIAS.map((f) => (
                    <option key={f} value={f}>
                      {NOME_FREQUENCIA[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="c-data" className="label">
                  {form.frequencia === 'unica' ? 'Dia que pagou' : form.frequencia === 'anual' ? 'Dia que renova (todo ano)' : 'Primeira cobrança (o dia se repete todo mês)'}
                </label>
                <input id="c-data" type="date" className="field" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-nota" className="label">
                  Anotação (opcional)
                </label>
                <input id="c-nota" className="field" maxLength={200} placeholder="Ex.: cartão do Lucas, plano de equipe" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary min-h-11" disabled={pending || !form.nome.trim() || !form.valor}>
                {pending ? 'Salvando…' : 'Salvar'}
              </button>
              <button type="button" className="btn-ghost min-h-11" onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {erro && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {erro}
          </p>
        )}

        {lista.length === 0 && !form ? (
          <p className="py-4 text-center text-sm text-ink-mute">Nenhum custo ainda. Comecem pelo imposto, as assinaturas e a compra das plaquinhas.</p>
        ) : (
          <ul className="divide-y divide-line">
            {[...ativos, ...encerrados].map((c) => {
              const enc = Boolean(c.fim && c.fim < hoje);
              return (
                <li key={c.id} className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 ${enc ? 'opacity-60' : ''}`}>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {c.nome} <span className="chip ml-1 bg-line text-ink-soft">{NOME_CATEGORIA[c.categoria].split(' (')[0]}</span>
                    </p>
                    <p className="text-sm text-ink-mute">
                      {brl(c.valor)} · {NOME_FREQUENCIA[c.frequencia].toLowerCase()}
                      {c.frequencia === 'mensal' && ` · dia ${c.data.slice(8, 10)}`}
                      {c.frequencia === 'anual' && ` · renova ${fmtData(c.data)}`}
                      {c.frequencia === 'unica' && ` · ${fmtDataAno(c.data)}`}
                      {c.fim && ` · cancelado em ${fmtDataAno(c.fim)}`}
                      {c.nota && ` · ${c.nota}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button type="button" className="btn-ghost min-h-9" disabled={pending || Boolean(form)} onClick={() => editar(c)}>
                      Editar
                    </button>
                    {c.frequencia !== 'unica' &&
                      (c.fim ? (
                        <button type="button" className="btn-ghost min-h-9" disabled={pending} onClick={() => fazer(encerrarCustoAction(c.id, null))}>
                          Reativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost min-h-9"
                          disabled={pending}
                          onClick={() => {
                            if (confirm(`Cancelar "${c.nome}" a partir de hoje? O histórico fica guardado.`)) fazer(encerrarCustoAction(c.id, hoje));
                          }}
                        >
                          Cancelei
                        </button>
                      ))}
                    <button
                      type="button"
                      className="min-h-9 px-1 text-ink-mute underline"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(`Apagar "${c.nome}"? (Se só cancelou, use "Cancelei" para guardar o histórico.)`)) fazer(removerCustoAction(c.id));
                      }}
                    >
                      apagar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Numero({ titulo, valor, cor = '', destaque }: { titulo: string; valor: string; cor?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${destaque ? 'border-ink/30 bg-paper' : 'border-line bg-white'}`}>
      <p className="text-xs font-semibold text-ink-mute">{titulo}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}

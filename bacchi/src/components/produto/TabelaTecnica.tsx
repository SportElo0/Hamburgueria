'use client';
// The technical table of one product line, with "Adicionar à cotação" on every row. On wide screens a real
// table; on phones each row becomes a compact card with the two main measures and a toggle for the rest.
// Choosing a row opens a small panel: finish, packaging, how many packages, an optional note.
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ACABAMENTOS, normalizar, opcoesEmbalagem, type Acabamento, type Produto, type Variacao } from '@/data/catalogo';
import { cotacao } from '@/lib/cotacao-store';
import { gsap } from '@/lib/animacao';

export function TabelaTecnica({ produto: p }: { produto: Produto }) {
  const busca = useSearchParams().get('q') ?? '';
  const [aberta, setAberta] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const grupos = useMemo(() => {
    const m = new Map<string, Variacao[]>();
    for (const v of p.variacoes) m.set(v.grupo ?? '', [...(m.get(v.grupo ?? '') ?? []), v]);
    return [...m.entries()];
  }, [p]);
  const destaque = (v: Variacao) => {
    const q = normalizar(busca.trim());
    return !!q && normalizar([v.modelo, v.grupo ?? '', ...Object.values(v.valores)].join(' ')).includes(q);
  };

  // scroll to the first row that matches the catalogue search
  useEffect(() => {
    if (!busca) return;
    const el = document.querySelector('[data-destaque="true"]');
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [busca]);

  const temAcabamentoPorLinha = p.variacoes.some((v) => v.acabamentos);
  const colunas = p.colunas;

  return (
    <div>
      {/* wide screens */}
      <div className="hidden overflow-hidden rounded-2xl border border-linha bg-white md:block">
        <table className="w-full text-left text-[0.95rem]">
          <caption className="sr-only">Tabela técnica de {p.nome}</caption>
          <thead className="bg-marinho text-white">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-semibold">{p.rotuloModelo}</th>
              {colunas.map((c) => (
                <th key={c.chave} scope="col" className="px-4 py-3.5 font-semibold">{c.titulo}</th>
              ))}
              {temAcabamentoPorLinha && <th scope="col" className="px-4 py-3.5 font-semibold">Acabamentos</th>}
              <th scope="col" className="px-4 py-3.5"><span className="sr-only">Cotação</span></th>
            </tr>
          </thead>
          {grupos.map(([grupo, linhas]) => (
            <tbody key={grupo || 'todos'}>
              {grupo && (
                <tr className="bg-papel">
                  <th scope="rowgroup" colSpan={colunas.length + 3} className="px-5 py-2 text-xs font-semibold tracking-[0.14em] text-aco uppercase">
                    {grupo}
                  </th>
                </tr>
              )}
              {linhas.map((v) => {
                const chave = `${v.grupo ?? ''}|${v.modelo}`;
                const d = destaque(v);
                return (
                  <FragmentoLinha key={chave} aberta={aberta === chave} destaque={d} colSpan={colunas.length + 3}
                    painel={<PainelAdicionar produto={p} variacao={v} aoFechar={() => setAberta(null)} aoAdicionar={(t) => { setAberta(null); setAviso(t); }} />}>
                    <th scope="row" className="px-5 py-3.5 font-semibold whitespace-nowrap">{v.modelo}</th>
                    {colunas.map((c) => (
                      <td key={c.chave} className="px-4 py-3.5 text-tinta-2">{v.valores[c.chave] ?? '–'}</td>
                    ))}
                    {temAcabamentoPorLinha && (
                      <td className="px-4 py-3.5">
                        <Amostras lista={v.acabamentos ?? []} />
                      </td>
                    )}
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => setAberta(aberta === chave ? null : chave)} aria-expanded={aberta === chave}
                        className="btn min-h-10 border border-linha px-4 text-sm text-tinta hover:border-azul hover:text-azul">
                        {aberta === chave ? 'Fechar' : 'Adicionar'}
                      </button>
                    </td>
                  </FragmentoLinha>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      {/* phones */}
      <div className="space-y-6 md:hidden">
        {grupos.map(([grupo, linhas]) => (
          <section key={grupo || 'todos'} aria-label={grupo || undefined}>
            {grupo && <h3 className="mb-2 text-xs font-semibold tracking-[0.14em] text-aco uppercase">{grupo}</h3>}
            <ul className="space-y-2.5">
              {linhas.map((v) => {
                const chave = `${v.grupo ?? ''}|${v.modelo}`;
                const principais = colunas.filter((c) => c.principal);
                const resto = colunas.filter((c) => !c.principal);
                return (
                  <li key={chave} data-destaque={destaque(v) || undefined} className={`rounded-2xl border bg-white p-4 ${destaque(v) ? 'border-azul shadow-[0_0_0_3px_rgba(0,123,196,.15)]' : 'border-linha'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-aco">{p.rotuloModelo}</p>
                        <p className="font-display text-xl font-semibold">{v.modelo}</p>
                      </div>
                      <button type="button" onClick={() => setAberta(aberta === chave ? null : chave)} aria-expanded={aberta === chave}
                        className="btn min-h-11 border border-linha px-4 text-sm">
                        {aberta === chave ? 'Fechar' : 'Adicionar'}
                      </button>
                    </div>
                    {principais.length > 0 && (
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        {principais.map((c) => (
                          <div key={c.chave}>
                            <dt className="text-xs text-aco">{c.titulo}</dt>
                            <dd className="font-medium">{v.valores[c.chave] ?? '–'}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {(resto.length > 0 || v.acabamentos) && (
                      <details className="group mt-3 text-sm">
                        <summary className="cursor-pointer list-none font-semibold text-azul [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">Embalagens e acabamentos +</span>
                          <span className="hidden group-open:inline">Ocultar detalhes −</span>
                        </summary>
                        <dl className="mt-3 grid grid-cols-2 gap-3">
                          {resto.map((c) => (
                            <div key={c.chave}>
                              <dt className="text-xs text-aco">{c.titulo}</dt>
                              <dd className="font-medium">{v.valores[c.chave] ?? '–'}</dd>
                            </div>
                          ))}
                          {v.acabamentos && (
                            <div className="col-span-2">
                              <dt className="text-xs text-aco">Acabamentos</dt>
                              <dd className="mt-1"><Amostras lista={v.acabamentos} comNome /></dd>
                            </div>
                          )}
                        </dl>
                      </details>
                    )}
                    {aberta === chave && (
                      <div className="mt-4 border-t border-linha pt-4">
                        <PainelAdicionar produto={p} variacao={v} aoFechar={() => setAberta(null)} aoAdicionar={(t) => { setAberta(null); setAviso(t); }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </div>
  );
}

function FragmentoLinha({ children, aberta, destaque, painel, colSpan }: { children: React.ReactNode; aberta: boolean; destaque: boolean; painel: React.ReactNode; colSpan: number }) {
  return (
    <>
      <tr data-destaque={destaque || undefined} className={`border-t border-linha transition-colors ${destaque ? 'bg-azul/[0.07]' : 'hover:bg-papel/60'}`}>{children}</tr>
      {aberta && (
        <tr className="bg-papel/70">
          <td colSpan={colSpan} className="px-5 py-5">{painel}</td>
        </tr>
      )}
    </>
  );
}

export function Amostras({ lista, comNome }: { lista: Acabamento[]; comNome?: boolean }) {
  if (!lista.length) return <span className="text-xs text-aco">A confirmar</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {lista.map((a) => (
        <span key={a} className="inline-flex items-center gap-1.5" title={ACABAMENTOS[a].nome}>
          <span className="amostra" style={{ background: ACABAMENTOS[a].amostra }} aria-hidden={comNome ? true : undefined} />
          {comNome ? <span className="mr-2 text-xs text-tinta-2">{ACABAMENTOS[a].nome}</span> : <span className="sr-only">{ACABAMENTOS[a].nome}</span>}
        </span>
      ))}
    </span>
  );
}

function PainelAdicionar({ produto: p, variacao: v, aoFechar, aoAdicionar }: { produto: Produto; variacao: Variacao; aoFechar: () => void; aoAdicionar: (texto: string) => void }) {
  const id = useId();
  const acabamentos = v.acabamentos ?? p.acabamentos;
  const embalagens = opcoesEmbalagem(p, v);
  const [acabamento, setAcabamento] = useState<Acabamento | undefined>(acabamentos.length === 1 ? acabamentos[0] : undefined);
  const [embalagem, setEmbalagem] = useState(embalagens[0] ?? '');
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');
  const raiz = useRef<HTMLFormElement>(null);

  useEffect(() => {
    raiz.current?.querySelector<HTMLElement>('input, button')?.focus();
    if (raiz.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(raiz.current, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' });
  }, []);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (acabamentos.length > 1 && !acabamento) return setErro('Escolha o acabamento.');
    if (!embalagem) return setErro('Escolha a embalagem.');
    cotacao.adicionar({ slug: p.slug, modelo: v.modelo, acabamento, embalagem, quantidade: qtd, observacao: obs.trim() || undefined });
    aoAdicionar(`${p.nome} ${v.modelo} adicionado à cotação.`);
  };

  return (
    <form ref={raiz} onSubmit={enviar} className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end" aria-label={`Adicionar ${p.nome} ${v.modelo} à cotação`}>
      {acabamentos.length > 0 && (
        <fieldset>
          <legend className="rotulo">Acabamento</legend>
          <div className="flex flex-wrap gap-2">
            {acabamentos.map((a) => (
              <label key={a} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-azul ${acabamento === a ? 'border-azul bg-azul/10 text-azul-profundo' : 'border-linha bg-white'}`}>
                <input type="radio" name={`${id}-ac`} value={a} checked={acabamento === a} onChange={() => { setAcabamento(a); setErro(''); }} className="sr-only" />
                <span className="amostra" style={{ background: ACABAMENTOS[a].amostra }} aria-hidden="true" />
                {ACABAMENTOS[a].nome}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="rotulo" htmlFor={`${id}-emb`}>Embalagem</label>
          <select id={`${id}-emb`} className="campo" value={embalagem} onChange={(e) => setEmbalagem(e.target.value)}>
            {embalagens.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor={`${id}-qtd`}>Quantidade</label>
          <div className="flex items-center rounded-xl border border-linha bg-white">
            <button type="button" onClick={() => setQtd((n) => Math.max(1, n - 1))} className="grid h-12 w-11 place-items-center text-lg" aria-label="Diminuir">−</button>
            <input id={`${id}-qtd`} type="number" inputMode="numeric" min={1} max={100000} value={qtd} onChange={(e) => setQtd(Math.max(1, Math.min(100000, Number(e.target.value) || 1)))} className="h-12 w-16 border-x border-linha text-center tabular-nums outline-none" />
            <button type="button" onClick={() => setQtd((n) => Math.min(100000, n + 1))} className="grid h-12 w-11 place-items-center text-lg" aria-label="Aumentar">+</button>
          </div>
          <p className="mt-1 text-xs text-aco">embalagens</p>
        </div>
      </div>
      <div className="flex gap-2 lg:flex-col">
        <button type="submit" className="btn btn-primario flex-1">Adicionar à cotação</button>
        <button type="button" onClick={aoFechar} className="btn btn-contorno text-tinta-2 lg:hidden">Cancelar</button>
      </div>
      <div className="lg:col-span-3">
        <label className="rotulo" htmlFor={`${id}-obs`}>Observação <span className="font-normal text-aco">(opcional{v.observacao ? `: ${v.observacao}` : ''})</span></label>
        <input id={`${id}-obs`} className="campo" maxLength={200} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Cor, prazo, outra informação" />
        {erro && <p role="alert" className="mt-2 text-sm font-semibold text-[#b3261e]">{erro}</p>}
      </div>
    </form>
  );
}

function Aviso({ texto, aoSumir }: { texto: string | null; aoSumir: () => void }) {
  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(aoSumir, 5000);
    return () => clearTimeout(t);
  }, [texto, aoSumir]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      {texto && (
        <div className="pointer-events-auto flex animate-[subir_.45s_var(--ease-saida)] items-center gap-4 rounded-full bg-marinho py-2.5 pr-2.5 pl-5 text-sm text-white shadow-[0_20px_40px_-12px_rgba(4,13,25,.6)]">
          <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-azul text-xs">✓</span>
          {texto}
          <Link href="/cotacao" className="btn btn-claro min-h-9 px-4 text-sm">Ver cotação</Link>
        </div>
      )}
    </div>
  );
}

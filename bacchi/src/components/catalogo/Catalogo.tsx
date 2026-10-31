'use client';
// The searchable catalogue. Search reads names, numbers (2/0, 26/6, 23/13…), sub-lines, applications and
// finishes; filters by family and finish. State lives in the URL (?q=&familia=&acabamento=), so a search can
// be shared and the back button works. Cards re-enter with a short stagger when the result changes.
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACABAMENTOS, FAMILIAS, PRODUTOS, normalizar, textoBusca, variacoesQueCasam, type Acabamento, type FamiliaId } from '@/data/catalogo';
import { gsap } from '@/lib/animacao';

const INDICE = PRODUTOS.map((p) => ({ p, texto: textoBusca(p) }));
const ACABAMENTOS_USADOS = [...new Set(PRODUTOS.flatMap((p) => p.acabamentos))] as Acabamento[];

export function Catalogo() {
  const params = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();
  const [q, setQ] = useState(params.get('q') ?? '');
  const familia = (params.get('familia') ?? '') as FamiliaId | '';
  const acabamento = (params.get('acabamento') ?? '') as Acabamento | '';
  const grade = useRef<HTMLUListElement>(null);

  // keep the URL in step with the search box (short debounce, no history spam)
  useEffect(() => {
    const t = setTimeout(() => {
      const u = new URLSearchParams(params.toString());
      if (q.trim()) u.set('q', q.trim());
      else u.delete('q');
      if (u.toString() !== params.toString()) router.replace(`${caminho}?${u}`, { scroll: false });
    }, 220);
    return () => clearTimeout(t);
  }, [q, params, router, caminho]);

  const filtrar = (chave: 'familia' | 'acabamento', valor: string) => {
    const u = new URLSearchParams(params.toString());
    if (!valor || params.get(chave) === valor) u.delete(chave);
    else u.set(chave, valor);
    router.replace(`${caminho}?${u}`, { scroll: false });
  };

  const chave = normalizar(q).split(/\s+/).filter(Boolean).join(' ');
  const resultado = useMemo(
    () =>
      INDICE.filter(({ p, texto }) => (!familia || p.familia === familia) && (!acabamento || p.acabamentos.includes(acabamento)) && chave.split(' ').filter(Boolean).every((t) => texto.includes(t))).map(({ p }) => ({
        p,
        modelos: chave ? variacoesQueCasam(p, chave) : [],
      })),
    [familia, acabamento, chave],
  );

  useEffect(() => {
    if (!grade.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(grade.current.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.035, ease: 'expo.out', overwrite: true });
  }, [resultado]);

  const total = PRODUTOS.length;

  return (
    <div className="container-b pb-24">
      <div className="z-20 -mx-[clamp(1rem,4vw,3rem)] bg-papel/90 sm:sticky sm:top-16 px-[clamp(1rem,4vw,3rem)] py-4 backdrop-blur-xl md:top-20">
        <label htmlFor="busca" className="sr-only">
          Buscar no catálogo
        </label>
        <div className="relative">
          <svg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-aco" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="busca"
            type="search"
            inputMode="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busque por nome ou número: 2/0, 26/6, colchete 9, alfinete 29…"
            className="campo !min-h-14 !rounded-full !pl-13 text-base shadow-[0_10px_30px_-20px_rgba(13,23,38,.35)]"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm text-tinta-2 hover:bg-papel-2">
              Limpar
            </button>
          )}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por família">
          <Chip ativo={!familia} onClick={() => filtrar('familia', '')}>
            Todas <span className="opacity-60">{total}</span>
          </Chip>
          {FAMILIAS.map((f) => (
            <Chip key={f.id} ativo={familia === f.id} onClick={() => filtrar('familia', f.id)}>
              {f.nome} <span className="opacity-60">{PRODUTOS.filter((p) => p.familia === f.id).length}</span>
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por acabamento">
          {ACABAMENTOS_USADOS.map((a) => (
            <Chip key={a} ativo={acabamento === a} onClick={() => filtrar('acabamento', a)} pequeno>
              <span className="amostra !h-3.5 !w-3.5" style={{ background: ACABAMENTOS[a].amostra }} />
              {ACABAMENTOS[a].nome}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-tinta-2" aria-live="polite">
        {resultado.length === 0 ? 'Nenhuma linha encontrada.' : `${resultado.length} ${resultado.length === 1 ? 'linha' : 'linhas'}${q || familia || acabamento ? ' com esses filtros' : ' no catálogo'}.`}
      </p>

      {resultado.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-aco-claro p-10 text-center">
          <p className="font-display text-2xl font-semibold">Não achamos “{q}”.</p>
          <p className="mx-auto mt-3 max-w-md text-tinta-2">Tente o número sem espaços (como 26/6 ou 2/0), o nome do produto ou limpe os filtros. Se não encontrar, a equipe comercial ajuda.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primario" onClick={() => { setQ(''); router.replace(caminho, { scroll: false }); }}>
              Limpar a busca
            </button>
            <Link href="/contato" className="btn btn-contorno">Falar com a equipe</Link>
          </div>
        </div>
      ) : (
        <ul ref={grade} className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
          {resultado.map(({ p, modelos }) => {
            const especificos = q.trim() && modelos.length < p.variacoes.length ? modelos : [];
            return (
              <li key={p.slug}>
                <Link href={`/produtos/${p.slug}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-papel shadow-[inset_0_0_0_1px_rgba(13,23,38,.06)] sm:rounded-3xl">
                    <Image src={p.imagens[0].src} alt={p.imagens[0].alt} fill sizes="(min-width:1024px) 30vw, 46vw" className="object-cover transition-transform duration-[1.1s] ease-[var(--ease-saida)] group-hover:scale-[1.045]" />
                    <span className="absolute top-4 left-4 hidden rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-tinta-2 backdrop-blur sm:block">
                      {FAMILIAS.find((f) => f.id === p.familia)!.nome}
                    </span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4 sm:mt-5">
                    <h2 className="font-display text-[1.02rem] leading-snug font-semibold group-hover:text-azul sm:text-2xl sm:leading-tight">{p.nome}</h2>
                    <span className="mt-1 hidden text-aco transition-transform duration-300 group-hover:translate-x-1 group-hover:text-azul sm:inline" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-2 hidden text-[0.95rem] leading-relaxed text-tinta-2 sm:block">{p.resumo}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-aco sm:mt-4 sm:gap-3">
                    <span className="font-semibold text-tinta-2">{p.variacoes.length} {p.variacoes.length === 1 ? 'modelo' : 'modelos'}</span>
                    <span className="flex gap-1" aria-label={`Acabamentos: ${p.acabamentos.map((a) => ACABAMENTOS[a].nome).join(', ')}`}>
                      {p.acabamentos.map((a) => (
                        <span key={a} className="amostra !h-3.5 !w-3.5" style={{ background: ACABAMENTOS[a].amostra }} title={ACABAMENTOS[a].nome} />
                      ))}
                    </span>
                  </div>
                  {especificos.length > 0 && (
                    <p className="mt-3 text-sm">
                      <span className="text-tinta-2">Encontrado: </span>
                      {especificos.slice(0, 6).map((v) => (
                        <span key={v.modelo} className="mr-1.5 mb-1.5 inline-block rounded-md bg-azul/10 px-2 py-0.5 font-semibold text-azul-profundo">
                          {v.modelo}
                        </span>
                      ))}
                      {especificos.length > 6 && <span className="text-tinta-2">+{especificos.length - 6}</span>}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ ativo, onClick, children, pequeno }: { ativo: boolean; onClick: () => void; children: React.ReactNode; pequeno?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 transition-[background-color,color,border-color] duration-300 ${pequeno ? 'min-h-9 text-xs' : 'min-h-10 text-sm font-medium'} ${
        ativo ? 'border-marinho bg-marinho text-white' : 'border-linha bg-white text-tinta-2 hover:border-aco'
      }`}
    >
      {children}
    </button>
  );
}

'use client';
// Representatives directory: tile map + state selector + free search (company, contact, city or region).
// Every published contact is kept; WhatsApp buttons appear only where the original page names the line WhatsApp.
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizar } from '@/data/catalogo';
import { ESTADOS, REPRESENTANTES, linkTelefone, linkWhatsApp, type Representante } from '@/data/representantes';
import { MapaBrasil } from './MapaBrasil';
import { gsap } from '@/lib/animacao';

const UFS = Object.keys(ESTADOS).sort((a, b) => ESTADOS[a].localeCompare(ESTADOS[b], 'pt-BR'));

export function DiretorioRepresentantes() {
  const params = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();
  const uf = (params.get('uf') ?? '').toUpperCase();
  const [busca, setBusca] = useState('');
  const lista = useRef<HTMLUListElement>(null);

  const escolher = (novo: string) => {
    const u = new URLSearchParams(params.toString());
    if (!novo || novo === uf) u.delete('uf');
    else u.set('uf', novo);
    router.replace(`${caminho}${u.size ? `?${u}` : ''}`, { scroll: false });
  };

  const resultado = useMemo(() => {
    const q = normalizar(busca.trim());
    return REPRESENTANTES.filter(
      (r) => (!uf || r.uf === uf) && (!q || normalizar([r.empresa, r.contato ?? '', r.regiao, ESTADOS[r.uf], r.uf].join(' ')).includes(q)),
    );
  }, [uf, busca]);

  useEffect(() => {
    if (!lista.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(lista.current.children, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'expo.out', overwrite: true });
  }, [resultado]);

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <div className="hidden sm:block">
            <MapaBrasil selecionado={uf} aoEscolher={escolher} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label htmlFor="estado" className="rotulo">Estado</label>
              <select id="estado" className="campo" value={uf} onChange={(e) => escolher(e.target.value)}>
                <option value="">Todos os estados</option>
                {UFS.map((u) => (
                  <option key={u} value={u}>{ESTADOS[u]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="busca-rep" className="rotulo">Buscar</label>
              <input id="busca-rep" type="search" className="campo" placeholder="Cidade, região ou empresa" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <p className="text-sm text-tinta-2" aria-live="polite">
          {resultado.length} {resultado.length === 1 ? 'representação' : 'representações'}
          {uf ? ` em ${ESTADOS[uf]}` : ' em todo o Brasil'}
          {busca ? ` para “${busca}”` : ''}.
        </p>
        {resultado.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-aco-claro p-8">
            <p className="font-display text-xl font-semibold">Nenhuma representação encontrada.</p>
            <p className="mt-2 text-tinta-2">Limpe a busca ou fale direto com a Bacchi pelo telefone ou WhatsApp da página de contato.</p>
          </div>
        ) : (
          <ul ref={lista} className="mt-6 space-y-4">
            {resultado.map((r) => (
              <Cartao key={r.uf + r.regiao + r.empresa} r={r} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Cartao({ r }: { r: Representante }) {
  const principal = r.telefones.find((t) => t.whatsapp) ?? r.telefones[0];
  return (
    <li className="rounded-3xl bg-white p-6 shadow-[0_24px_48px_-36px_rgba(13,23,38,.45)] md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-azul">{ESTADOS[r.uf]}</p>
          <h3 className="mt-2 font-display text-xl font-semibold md:text-2xl">{r.empresa}</h3>
          <p className="mt-1 text-sm text-tinta-2">{r.regiao}</p>
        </div>
        <span className="rounded-full bg-papel px-3 py-1 text-xs font-bold text-tinta-2">{r.uf}</span>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        {r.contato && (
          <div>
            <dt className="text-xs text-aco">Contato</dt>
            <dd className="mt-0.5 font-medium">{r.contato}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-aco">Telefone{r.telefones.length > 1 ? 's' : ''}</dt>
          <dd className="mt-0.5 space-y-1">
            {r.telefones.map((t) => (
              <p key={t.numero}>
                <a className="link-b font-medium" href={linkTelefone(t.numero)}>{t.numero}</a>
                {t.rotulo && <span className="text-tinta-2"> · {t.rotulo}</span>}
                {t.whatsapp && !t.rotulo?.toLowerCase().includes('whatsapp') && <span className="text-tinta-2"> · WhatsApp</span>}
              </p>
            ))}
          </dd>
        </div>
        {r.emails.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-aco">E-mail</dt>
            <dd className="mt-0.5 space-y-1">
              {r.emails.map((e) => (
                <p key={e}><a className="link-b break-all" href={`mailto:${e}`}>{e}</a></p>
              ))}
            </dd>
          </div>
        )}
        {r.instagram && (
          <div>
            <dt className="text-xs text-aco">Instagram</dt>
            <dd className="mt-0.5"><a className="link-b" href={`https://www.instagram.com/${r.instagram}`} target="_blank" rel="noopener noreferrer">@{r.instagram}</a></dd>
          </div>
        )}
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        {principal?.whatsapp ? (
          <a className="btn btn-primario min-h-11 text-sm" href={linkWhatsApp(principal.numero)} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a>
        ) : (
          principal && <a className="btn btn-primario min-h-11 text-sm" href={linkTelefone(principal.numero)}>Ligar {principal.numero}</a>
        )}
        {r.emails[0] && <a className="btn btn-contorno min-h-11 text-sm text-tinta" href={`mailto:${r.emails[0]}`}>Enviar e-mail</a>}
      </div>
    </li>
  );
}

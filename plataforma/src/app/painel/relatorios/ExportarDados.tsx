'use client';

import { useState } from 'react';

/**
 * Período + downloads. Os links baixam direto (a rota confere o login da equipe). As instruções do projeto do Claude
 * ficam aqui para copiar uma vez só.
 */
export function ExportarDados({
  lojas,
  periodos,
  hoje,
  instrucoes,
}: {
  lojas: { slug: string; nome: string }[];
  periodos: { rotulo: string; de: string; ate: string }[];
  hoje: string;
  instrucoes: string;
}) {
  const [de, setDe] = useState(periodos[0].de);
  const [ate, setAte] = useState(periodos[0].ate);
  const [copiado, setCopiado] = useState(false);
  const url = (loja: string) => `/api/relatorio?loja=${encodeURIComponent(loja)}&de=${de}&ate=${ate}`;
  const valido = de && ate && de <= ate && ate <= hoje;

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-5" aria-labelledby="periodo">
        <h2 id="periodo" className="text-lg font-bold">
          1. Período
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {periodos.map((p) => (
            <button
              key={p.rotulo}
              type="button"
              aria-pressed={de === p.de && ate === p.ate}
              onClick={() => {
                setDe(p.de);
                setAte(p.ate);
              }}
              className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${de === p.de && ate === p.ate ? 'border-accent bg-accent text-white' : 'border-line bg-white text-ink-soft hover:border-accent'}`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="de" className="label">
              De
            </label>
            <input id="de" type="date" className="field" value={de} max={hoje} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ate" className="label">
              Até
            </label>
            <input id="ate" type="date" className="field" value={ate} max={hoje} onChange={(e) => setAte(e.target.value)} />
          </div>
          <p className="pb-2 text-xs text-ink-mute">Até 92 dias. O documento compara com o mesmo número de dias logo antes.</p>
        </div>
      </section>

      <section className="card p-5" aria-labelledby="baixar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="baixar" className="text-lg font-bold">
            2. Baixar os dados
          </h2>
          {lojas.length > 1 && (
            <a href={valido ? url('todos') : undefined} aria-disabled={!valido} className={`btn-primary ${valido ? '' : 'pointer-events-none opacity-50'}`}>
              Baixar todos (um arquivo)
            </a>
          )}
        </div>
        {lojas.length === 0 ? (
          <p className="mt-3 text-sm text-ink-mute">Nenhum restaurante cadastrado.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {lojas.map((l) => (
              <li key={l.slug} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="font-semibold">{l.nome}</span>
                <a href={valido ? url(l.slug) : undefined} aria-disabled={!valido} className={`btn-ghost min-h-9 px-3 ${valido ? '' : 'pointer-events-none opacity-50'}`}>
                  Baixar
                </a>
              </li>
            ))}
          </ul>
        )}
        {!valido && <p className="mt-2 text-sm font-semibold text-bad">Confira as datas: o início vem antes do fim, e o fim não passa de hoje.</p>}
      </section>

      <section className="card p-5" aria-labelledby="claude">
        <h2 id="claude" className="text-lg font-bold">
          3. Projeto no Claude (uma vez só)
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
          <li>No Claude, crie um projeto chamado “Consultor de restaurantes”.</li>
          <li>Cole o texto abaixo nas instruções do projeto.</li>
          <li>Todo mês: solte os documentos baixados numa conversa do projeto e peça “a apresentação de cada restaurante”.</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(instrucoes);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2500);
              } catch {}
            }}
          >
            {copiado ? 'Copiado!' : 'Copiar as instruções'}
          </button>
          <a href="/api/relatorio?instrucoes=1" className="btn-ghost">
            Baixar as instruções
          </a>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold">Ver o texto das instruções</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-paper p-3 text-xs whitespace-pre-wrap">{instrucoes}</pre>
        </details>
      </section>
    </div>
  );
}

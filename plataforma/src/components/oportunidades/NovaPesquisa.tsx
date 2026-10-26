'use client';

import { useState, useTransition } from 'react';
import { estimarAction, pesquisarAction } from '@/app/painel/oportunidades/actions';
import type { Resultado } from '@/lib/oportunidades/dados';
import { CIDADES_SUGERIDAS, MAX_PAGINAS, SEGMENTOS, nomeCategoria, type Estimativa, type Segmento } from '@/lib/oportunidades/regras';
import { AtribuicaoGoogle, CHIP_CATEGORIA, linkSeguro, usd } from './estilos';

interface Props {
  chave: boolean;
  usadas: number;
  limite: number;
}

/**
 * New search in three steps: fill in, see the most it can cost, approve. Nothing reaches Google before
 * the approval, and the server checks the approval and the month's cap again on its side.
 */
export function NovaPesquisa({ chave, usadas, limite }: Props) {
  const [form, setForm] = useState({ cidade: 'Ilhabela', uf: 'SP', bairro: '', segmento: 'restaurantes' as Segmento, paginas: 1 });
  const [estimativa, setEstimativa] = useState<Estimativa | null>(null);
  const [aprovado, setAprovado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const mudar = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    // Any change means a new estimate and a new approval.
    setEstimativa(null);
    setAprovado(false);
  };

  const calcular = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    start(async () => {
      const res = await estimarAction(form);
      if (res.ok) setEstimativa(res.dados);
      else setError(res.error);
    });
  };

  const pesquisar = () => {
    if (!estimativa || !aprovado) return;
    setError('');
    start(async () => {
      const res = await pesquisarAction(form, estimativa.chamadas);
      setEstimativa(null);
      setAprovado(false);
      if (res.ok) setResultado(res.dados);
      else setError(res.error);
    });
  };

  return (
    <section className="card mt-6 p-5" aria-labelledby="nova-pesquisa">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="nova-pesquisa" className="text-xl font-bold">
          Nova pesquisa
        </h2>
        <p className="text-sm text-ink-mute">
          Buscas no Google este mês: <strong className="text-ink">{usadas}</strong> de {limite} (limite do painel)
        </p>
      </div>
      {!chave && (
        <p className="mt-3 rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">
          A chave do Google ainda não foi configurada. Dá para calcular o custo, mas a pesquisa só funciona depois que a variável GOOGLE_MAPS_API_KEY estiver na Vercel (passo a passo em plataforma/LEAD-FINDER.md).
        </p>
      )}

      <form onSubmit={calcular} className="mt-4 grid gap-3 sm:grid-cols-[2fr_70px_2fr_2fr_2fr]">
        <div>
          <label className="label" htmlFor="np-cidade">
            Cidade
          </label>
          <input id="np-cidade" className="field" list="np-cidades" required minLength={2} maxLength={60} value={form.cidade} onChange={(e) => mudar({ cidade: e.target.value })} />
          <datalist id="np-cidades">
            {CIDADES_SUGERIDAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="np-uf">
            UF
          </label>
          <input id="np-uf" className="field uppercase" required pattern="[A-Za-z]{2}" maxLength={2} value={form.uf} onChange={(e) => mudar({ uf: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="np-bairro">
            Bairro <span className="font-normal text-ink-mute">(opcional)</span>
          </label>
          <input id="np-bairro" className="field" maxLength={60} value={form.bairro} onChange={(e) => mudar({ bairro: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="np-segmento">
            Segmento
          </label>
          <select id="np-segmento" className="field" value={form.segmento} onChange={(e) => mudar({ segmento: e.target.value as Segmento })}>
            {SEGMENTOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="np-paginas">
            Quantos lugares
          </label>
          <select id="np-paginas" className="field" value={form.paginas} onChange={(e) => mudar({ paginas: Number(e.target.value) })}>
            {Array.from({ length: MAX_PAGINAS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Até {n * 20} ({n} {n === 1 ? 'busca' : 'buscas'})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-5">
          <button type="submit" className="btn-ghost" disabled={pending}>
            {pending && !estimativa ? 'Calculando…' : '1. Calcular o custo'}
          </button>
        </div>
      </form>

      {estimativa && (
        <div className="mt-4 rounded-lg border border-line bg-paper p-4 text-[15px]" aria-live="polite">
          <p className="font-semibold">
            Custo máximo desta pesquisa:{' '}
            {estimativa.usd === 0 ? (
              <span className="text-ok">sem custo (dentro das chamadas grátis do mês)</span>
            ) : (
              <span className="text-bad">até {usd(estimativa.usd)}</span>
            )}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>
              Até {estimativa.chamadas} {estimativa.chamadas === 1 ? 'chamada' : 'chamadas'} de {estimativa.sku} (US$ 35 a cada 1.000 depois das 1.000 grátis do mês).
            </li>
            <li>
              Grátis que ainda sobram no mês: {estimativa.gratisRestantes}. Chamadas que seriam pagas: {estimativa.pagas}.
            </li>
            <li>
              Limite do painel: {estimativa.usadasNoMes} de {estimativa.limiteMes} buscas usadas este mês.
            </li>
            <li>A parte grátis é da conta do Google Cloud inteira: se a mesma conta usar a Places API em outro lugar, sobra menos do que este painel conta.</li>
          </ul>
          {estimativa.cabe ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="size-4" checked={aprovado} onChange={(e) => setAprovado(e.target.checked)} />
                Aprovo esta pesquisa de até {estimativa.chamadas} {estimativa.chamadas === 1 ? 'chamada' : 'chamadas'} ({estimativa.usd === 0 ? 'sem custo' : usd(estimativa.usd)})
              </label>
              <button type="button" className="btn-primary" disabled={!aprovado || pending || !chave} onClick={pesquisar}>
                {pending ? 'Pesquisando…' : '2. Pesquisar'}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-bad">Esta pesquisa passa do limite do mês. Peça menos lugares ou espere o mês virar.</p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      {resultado && <ResultadoAoVivo resultado={resultado} />}
    </section>
  );
}

function ResultadoAoVivo({ resultado }: { resultado: Resultado }) {
  const { pesquisa: p, linhas } = resultado;
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="text-lg font-bold">Resultado</h3>
      <p className="mt-1 text-sm text-ink-soft">
        {p.chamadas} {p.chamadas === 1 ? 'busca usada' : 'buscas usadas'} · {p.encontrados} lugares em {p.cidade} · {p.novos} novos na lista · {p.repetidos} já estavam · {p.foraDaCidade} de outras cidades ignorados
      </p>
      <p className="mt-1 text-xs text-ink-mute">
        Nome, endereço, site e telefone aparecem só agora: os termos do Google não deixam guardar. Na lista abaixo ficam o identificador do lugar e a conclusão da equipe.
      </p>
      {linhas.length === 0 ? (
        <p className="mt-4 text-ink-mute">Nenhum lugar encontrado nessa cidade.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-paper text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-semibold">Lugar</th>
                <th className="px-3 py-2 font-semibold">Site no Google</th>
                <th className="px-3 py-2 font-semibold">Categoria e o que a checagem viu</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <p className="font-semibold">
                      {l.nome}
                      {l.novo && <span className="chip ml-2 bg-ink text-white">novo</span>}
                    </p>
                    <p className="text-ink-mute">{l.endereco}</p>
                    {l.telefone && <p className="text-ink-mute">Tel. comercial: {l.telefone}</p>}
                  </td>
                  <td className="max-w-[220px] px-3 py-2 break-words">
                    {linkSeguro(l.site) ? (
                      <a className="text-accent underline underline-offset-2" href={linkSeguro(l.site)} target="_blank" rel="noopener noreferrer nofollow">
                        {l.site}
                      </a>
                    ) : (
                      <span className="text-ink-mute">Nenhum</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`chip ${CHIP_CATEGORIA[l.categoria]}`}>{nomeCategoria(l.categoria)}</span>
                    <ul className="mt-1 text-ink-soft">
                      {l.sinais.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2">
        <AtribuicaoGoogle />
      </div>
    </div>
  );
}

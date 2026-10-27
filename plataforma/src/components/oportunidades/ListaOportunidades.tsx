'use client';

import { useMemo, useState, useTransition } from 'react';
import { revisarAction, verAoVivoAction } from '@/app/painel/oportunidades/actions';
import type { LugarAoVivo } from '@/lib/oportunidades/places';
import {
  CATEGORIAS,
  FONTES,
  FONTES_MINIMAS,
  SEGMENTOS,
  SITUACOES,
  VERIFICACOES,
  linkMaps,
  nomeCategoria,
  segmento,
  type Categoria,
  type Fonte,
  type Lead,
  type Situacao,
  type Verificacao,
} from '@/lib/oportunidades/regras';
import { AtribuicaoGoogle, CHIP_CATEGORIA, Telefone, dataCurta, linkSeguro } from './estilos';

const POR_PAGINA = 40;

export function ListaOportunidades({ leads, limiteDetalhes, usadasDetalhes }: { leads: Lead[]; limiteDetalhes: number; usadasDetalhes: number }) {
  const [items, setItems] = useState(leads);
  const [filtro, setFiltro] = useState({ categoria: '', cidade: '', segmento: '', situacao: '' });
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const cidades = useMemo(() => [...new Set(items.map((l) => l.cidade))].sort(), [items]);

  const visiveis = items.filter(
    (l) =>
      // places with a working site of their own stay out unless that chip is picked (searches no longer keep them)
      (filtro.categoria ? l.categoria === filtro.categoria : l.categoria !== 'site-proprio') &&
      (!filtro.cidade || l.cidade === filtro.cidade) &&
      (!filtro.segmento || l.segmento === filtro.segmento) &&
      (filtro.situacao ? l.situacao === filtro.situacao : l.situacao !== 'descartada' && l.situacao !== 'nao-contatar'),
  );
  const exportar = `/painel/oportunidades/exportar?${new URLSearchParams(Object.entries(filtro).filter(([, v]) => v)).toString()}`;
  const contagem = (c: Categoria) => items.filter((l) => l.categoria === c).length;

  if (items.length === 0)
    return <p className="card mt-6 px-5 py-10 text-center text-ink-mute">Nenhum lugar na lista ainda. Faça a primeira pesquisa acima.</p>;

  return (
    <section className="mt-8" aria-labelledby="lista">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="lista" className="text-xl font-bold">
            Lista para revisar
          </h2>
          <p className="text-sm text-ink-mute">
            {items.length} lugares guardados. Consultas de dados do Google este mês: {usadasDetalhes} de {limiteDetalhes}.
          </p>
        </div>
        <a className="btn-ghost" href={exportar} download>
          Exportar CSV ({visiveis.length})
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
        <button type="button" className={`chip min-h-8 border ${!filtro.categoria ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`} onClick={() => setFiltro({ ...filtro, categoria: '' })} aria-pressed={!filtro.categoria}>
          Todas · {items.length}
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.explica}
            aria-pressed={filtro.categoria === c.id}
            className={`chip min-h-8 border ${filtro.categoria === c.id ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
            onClick={() => setFiltro({ ...filtro, categoria: filtro.categoria === c.id ? '' : c.id })}
          >
            {c.nome} · {contagem(c.id)}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Filtro id="f-cidade" rotulo="Cidade" valor={filtro.cidade} mudar={(v) => setFiltro({ ...filtro, cidade: v })} opcoes={cidades.map((c) => [c, c])} />
        <Filtro id="f-segmento" rotulo="Segmento" valor={filtro.segmento} mudar={(v) => setFiltro({ ...filtro, segmento: v })} opcoes={SEGMENTOS.map((s) => [s.id, s.nome])} />
        <Filtro
          id="f-situacao"
          rotulo="Situação"
          valor={filtro.situacao}
          vazio="Abertas (sem descartadas)"
          mudar={(v) => setFiltro({ ...filtro, situacao: v })}
          opcoes={SITUACOES.map((s) => [s.id, s.nome])}
        />
      </div>

      <div className="mt-4 space-y-3">
        {visiveis.slice(0, mostrar).map((l) => (
          <CartaoLead key={l.placeId} lead={l} salvo={(novo) => setItems((list) => list.map((x) => (x.placeId === novo.placeId ? novo : x)))} />
        ))}
        {visiveis.length === 0 && <p className="text-ink-mute">Nenhum lugar com esses filtros.</p>}
        {visiveis.length > mostrar && (
          <button type="button" className="btn-ghost w-full" onClick={() => setMostrar((n) => n + POR_PAGINA)}>
            Mostrar mais ({visiveis.length - mostrar})
          </button>
        )}
      </div>
    </section>
  );
}

function Filtro({ id, rotulo, valor, mudar, opcoes, vazio = 'Todas' }: { id: string; rotulo: string; valor: string; mudar: (v: string) => void; opcoes: string[][]; vazio?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {rotulo}
      </label>
      <select id={id} className="field" value={valor} onChange={(e) => mudar(e.target.value)}>
        <option value="">{vazio}</option>
        {opcoes.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

function CartaoLead({ lead: l, salvo }: { lead: Lead; salvo: (l: Lead) => void }) {
  const [aoVivo, setAoVivo] = useState<LugarAoVivo | null>(null);
  const [aberto, setAberto] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const situacao = SITUACOES.find((s) => s.id === l.situacao)?.nome;
  const verif = l.verificacao;

  const carregar = () => {
    setError('');
    start(async () => {
      const res = await verAoVivoAction(l.placeId);
      if (res.ok) setAoVivo(res.dados);
      else setError(res.error);
    });
  };

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className={`chip ${CHIP_CATEGORIA[l.categoria]}`}>{nomeCategoria(l.categoria)}</span>
            {l.categoriaRevisada && <span className="chip bg-line text-ink-soft">revisada</span>}
            <span className="text-sm font-semibold">{situacao}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {segmento(l.segmento).nome} · {l.bairro ? `${l.bairro}, ` : ''}
            {l.cidade} - {l.uf} · achado em {dataCurta(l.criadoEm)}
          </p>
          <p className="mt-0.5 truncate font-mono text-xs text-ink-mute" title={l.placeId}>
            {l.placeId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-ghost min-h-9 px-3" href={linkMaps(l.placeId)} target="_blank" rel="noopener noreferrer">
            Abrir no Google Maps
          </a>
          {!aoVivo && (
            <button type="button" className="btn-ghost min-h-9 px-3" onClick={carregar} disabled={pending} title="Usa 1 consulta do limite do mês">
              {pending ? 'Carregando…' : 'Ver dados do Google'}
            </button>
          )}
        </div>
      </div>

      {aoVivo && (
        <div className="mt-3 rounded-lg border border-line bg-paper p-3 text-sm">
          <p className="font-semibold">{aoVivo.nome}</p>
          <p className="text-ink-soft">{aoVivo.endereco}</p>
          <Telefone telefone={aoVivo.telefone} className="text-ink-soft" />
          <p className="break-words text-ink-soft">
            Site no Google:{' '}
            {linkSeguro(aoVivo.site) ? (
              <a className="text-accent underline underline-offset-2" href={linkSeguro(aoVivo.site)} target="_blank" rel="noopener noreferrer nofollow">
                {aoVivo.site}
              </a>
            ) : (
              'nenhum'
            )}
          </p>
          {aoVivo.fechado && <p className="font-semibold text-bad">O Google marca como fechado definitivamente.</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a className="text-accent underline underline-offset-2" href={`https://www.google.com/search?q=${encodeURIComponent(`${aoVivo.nome} ${l.cidade} ${l.uf}`)}`} target="_blank" rel="noopener noreferrer">
              Buscar no Google
            </a>
            <a className="text-accent underline underline-offset-2" href="https://registro.br/" target="_blank" rel="noopener noreferrer">
              Registro.br
            </a>
          </p>
          <div className="mt-2">
            <AtribuicaoGoogle />
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="label">O que a checagem viu ({dataCurta(l.checadoEm)})</p>
          <ul className="list-disc pl-5 text-ink-soft">
            {l.sinais.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Verificação em outras fontes</p>
          {verif.situacao === 'pendente' ? (
            <p className="text-ink-mute">{l.categoria === 'sem-site' ? 'Falta conferir antes de concluir que não tem site.' : 'Não verificado.'}</p>
          ) : (
            <p className="text-ink-soft">
              {VERIFICACOES.find((v) => v.id === verif.situacao)?.nome} em {dataCurta(verif.em)}
              {verif.por && ` por ${verif.por}`}. Fontes: {verif.fontes.map((f) => FONTES.find((x) => x.id === f)?.nome).join('; ') || 'nenhuma marcada'}.
              {verif.links && <span className="block break-words">Links: {verif.links}</span>}
            </p>
          )}
          {l.observacoes && <p className="mt-1 whitespace-pre-line text-ink-soft">Obs.: {l.observacoes}</p>}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      <div className="mt-3">
        <button type="button" className="text-sm font-semibold text-accent underline underline-offset-2" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
          {aberto ? 'Fechar revisão' : 'Revisar'}
        </button>
        {aberto && (
          <FormRevisao
            lead={l}
            fechar={(novo) => {
              salvo(novo);
              setAberto(false);
            }}
          />
        )}
      </div>
    </article>
  );
}

function FormRevisao({ lead: l, fechar }: { lead: Lead; fechar: (l: Lead) => void }) {
  const [categoria, setCategoria] = useState<Categoria>(l.categoria);
  const [situacao, setSituacao] = useState<Situacao>(l.situacao);
  const [verificacao, setVerificacao] = useState<Verificacao>(l.verificacao.situacao);
  const [fontes, setFontes] = useState<Fonte[]>(l.verificacao.fontes);
  const [links, setLinks] = useState(l.verificacao.links);
  const [observacoes, setObservacoes] = useState(l.observacoes);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const id = l.placeId;
  const faltamFontes = categoria === 'sem-site' && verificacao === 'confirmado' && fontes.length < FONTES_MINIMAS;

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    start(async () => {
      const res = await revisarAction(id, { categoria, situacao, observacoes, verificacao: { situacao: verificacao, fontes, links } });
      if (res.ok) fechar(res.dados);
      else setError(res.error);
    });
  };

  return (
    <form onSubmit={salvar} className="mt-3 grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-3">
      <div>
        <label className="label" htmlFor={`cat-${id}`}>
          Categoria
        </label>
        <select id={`cat-${id}`} className="field" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`ver-${id}`}>
          Verificação
        </label>
        <select id={`ver-${id}`} className="field" value={verificacao} onChange={(e) => setVerificacao(e.target.value as Verificacao)}>
          {VERIFICACOES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`sit-${id}`}>
          Situação
        </label>
        <select id={`sit-${id}`} className="field" value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)}>
          {SITUACOES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="sm:col-span-3">
        <legend className="label">Fontes que vocês consultaram</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {FONTES.map((f) => (
            <label key={f.id} className="flex min-h-8 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={fontes.includes(f.id)}
                onChange={(e) => setFontes((list) => (e.target.checked ? [...list, f.id] : list.filter((x) => x !== f.id)))}
              />
              {f.nome}
            </label>
          ))}
        </div>
        {faltamFontes && <p className="mt-1 text-sm text-warn">Para confirmar &quot;sem website&quot;, marque pelo menos {FONTES_MINIMAS} fontes.</p>}
      </fieldset>
      <div className="sm:col-span-3">
        <label className="label" htmlFor={`links-${id}`}>
          Links do que encontraram <span className="font-normal text-ink-mute">(Instagram, site achado etc.)</span>
        </label>
        <input id={`links-${id}`} className="field" maxLength={600} value={links} onChange={(e) => setLinks(e.target.value)} />
      </div>
      <div className="sm:col-span-3">
        <label className="label" htmlFor={`obs-${id}`}>
          Observações
        </label>
        <textarea id={`obs-${id}`} className="field" rows={2} maxLength={1000} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad sm:col-span-3">
          {error}
        </p>
      )}
      <div className="sm:col-span-3">
        <button type="submit" className="btn-primary" disabled={pending || faltamFontes}>
          {pending ? 'Salvando…' : 'Salvar revisão'}
        </button>
      </div>
    </form>
  );
}

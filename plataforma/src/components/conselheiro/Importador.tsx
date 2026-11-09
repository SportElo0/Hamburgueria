'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CAMPOS, MAX_BYTES_CSV } from '@/lib/conselheiro/csv';
import type { Previa } from '@/lib/conselheiro/importar';
import type { TipoLote } from '@/lib/conselheiro/modelo';
import { importarAction, previaAction } from '@/app/loja/[slug]/dono/conselheiro/actions';

const NOME_TIPO: Record<TipoLote, string> = { produtos: 'Lista de produtos', custos: 'Custos', precos: 'Preços por canal', vendas: 'Vendas' };
const EXEMPLO: Record<TipoLote, string> = {
  produtos: 'nome;categoria\nX-Salada;Lanches',
  custos: 'produto;custo;embalagem;inicio\nX-Salada;12,40;1,50;01/11/2026\n(ou: produto;custo do lote;rendimento)',
  precos: 'produto;canal;preco;inicio\nX-Salada;iFood;38,90;01/11/2026',
  vendas: 'produto;canal;inicio;fim;quantidade;receita\nX-Salada;iFood;01/10/2026;31/10/2026;320;"11.840,00"\n(ou uma linha por dia ou por item vendido, com a coluna data e, se tiver, status)',
};

/** Importação em dois passos: prévia conferida no servidor e, depois do ok do dono, gravação. */
export function Importador({ slug, tipoInicial }: { slug: string; tipoInicial: TipoLote }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoLote>(tipoInicial);
  const [arquivo, setArquivo] = useState<{ nome: string; texto: string } | null>(null);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [mapa, setMapa] = useState<Record<string, number | null> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  const conferir = (texto: string, nome: string, t: TipoLote, m: Record<string, number | null> | null) =>
    start(async () => {
      setMsg(null);
      const r = await previaAction(slug, { tipo: t, texto, mapeamento: m, arquivo: nome });
      if (!r.ok) {
        setPrevia(null);
        setMsg({ ok: false, texto: r.msg });
        return;
      }
      setPrevia(r.previa);
      setMapa(r.previa.mapeamento);
    });

  async function escolher(f: File | undefined) {
    setPrevia(null);
    setMsg(null);
    if (!f) return;
    if (f.size > MAX_BYTES_CSV) return setMsg({ ok: false, texto: 'Arquivo grande demais (máximo 900 KB). Divida em partes, por mês por exemplo.' });
    if (!/\.(csv|txt)$/i.test(f.name)) return setMsg({ ok: false, texto: 'Use um arquivo .csv (no Excel: Salvar como › CSV).' });
    const texto = await f.text();
    setArquivo({ nome: f.name, texto });
    conferir(texto, f.name, tipo, null);
  }

  const gravar = () =>
    start(async () => {
      if (!arquivo || !mapa) return;
      const r = await importarAction(slug, { tipo, texto: arquivo.texto, mapeamento: mapa, arquivo: arquivo.nome });
      setMsg({ ok: r.ok, texto: r.msg });
      if (r.ok) {
        setPrevia(null);
        setArquivo(null);
        router.refresh();
      }
    });

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="tipo">O que vai importar</label>
          <select
            id="tipo"
            className="field w-auto"
            value={tipo}
            onChange={(e) => {
              const t = e.target.value as TipoLote;
              setTipo(t);
              setPrevia(null);
              if (arquivo) conferir(arquivo.texto, arquivo.nome, t, null);
            }}
          >
            {(Object.keys(NOME_TIPO) as TipoLote[]).map((t) => (
              <option key={t} value={t}>{NOME_TIPO[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="arquivo">Arquivo CSV</label>
          <input id="arquivo" type="file" accept=".csv,.txt,text/csv" className="text-sm" onChange={(e) => escolher(e.target.files?.[0])} />
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-ink-mute">Como deve ser a planilha</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-paper p-3 text-xs whitespace-pre-wrap">{EXEMPLO[tipo]}</pre>
        <p className="mt-1 text-xs text-ink-mute">Números com vírgula nos centavos (12,50), datas dd/mm/aaaa, separador ponto e vírgula. Produtos e canais precisam estar cadastrados (pelo nome).</p>
      </details>
      {pending && <p className="text-sm text-ink-mute">Conferindo…</p>}
      {msg && <p role="status" className={`text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.texto}</p>}

      {previa && mapa && arquivo && (
        <div className="space-y-4">
          <fieldset>
            <legend className="label">Colunas (confira)</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS[tipo].map((c) => (
                <label key={c.id} className="text-sm">
                  <span className="block font-semibold">{c.nome}{c.obrigatorio ? ' *' : ''}</span>
                  <select
                    className="field mt-1"
                    value={mapa[c.id] ?? ''}
                    onChange={(e) => {
                      const m = { ...mapa, [c.id]: e.target.value === '' ? null : Number(e.target.value) };
                      setMapa(m);
                      conferir(arquivo.texto, arquivo.nome, tipo, m);
                    }}
                  >
                    <option value="">— não tem —</option>
                    {previa.cabecalho.map((h, i) => (
                      <option key={i} value={i}>{h || `coluna ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-sm">
            <strong>{previa.validas}</strong> linha(s) prontas · <span className={previa.comErro ? 'font-semibold text-bad' : ''}>{previa.comErro} com erro</span> · {previa.repetidas} já importada(s) antes
            {previa.periodo && ` · período ${previa.periodo.inicio.split('-').reverse().join('/')} a ${previa.periodo.fim.split('-').reverse().join('/')}`}
          </p>
          {previa.jaImportado && <p className="text-sm font-semibold text-bad">Esse arquivo já foi importado.</p>}
          {previa.avisos.map((a) => (
            <p key={a} className="text-sm font-semibold text-warn">{a}</p>
          ))}
          <div className="max-h-96 overflow-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-paper text-left text-ink-mute">
                <tr><th className="px-3 py-2">Linha</th><th className="px-3 py-2">O que entra</th><th className="px-3 py-2">Situação</th></tr>
              </thead>
              <tbody>
                {previa.linhas.slice(0, 500).map((l) => (
                  <tr key={l.n} className="border-t border-line align-top">
                    <td className="px-3 py-1.5 tabular-nums">{l.n}</td>
                    <td className="px-3 py-1.5">{l.resumo || '—'}</td>
                    <td className={`px-3 py-1.5 ${l.erros.length ? 'text-bad' : l.repetida ? 'text-warn' : 'text-ok'}`}>{l.erros.length ? l.erros.join('; ') : l.repetida ? 'já importada (fica de fora)' : 'ok'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn-primary" disabled={pending || previa.validas === 0 || previa.jaImportado || previa.avisos.some((a) => a.startsWith('Ligue'))} onClick={gravar}>
            Importar {previa.validas} linha(s) conferida(s)
          </button>
          <p className="text-xs text-ink-mute">As linhas com erro ou repetidas ficam de fora. Quem importa fica registrado como quem conferiu os valores.</p>
        </div>
      )}
    </div>
  );
}

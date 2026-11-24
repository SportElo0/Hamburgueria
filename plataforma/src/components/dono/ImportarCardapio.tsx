'use client';

import { useMemo, useState, useTransition } from 'react';
import { importarCardapioAction } from '@/app/loja/[slug]/dono/actions';
import { PEDIDO_AO_CLAUDE, lerCardapio } from '@/lib/importar-cardapio';
import { brl } from '@/lib/ordering';

/**
 * Cardápio inteiro de uma vez: a foto ou o PDF vai para o Claude com o pedido pronto, o texto que ele devolve é colado
 * aqui, a prévia mostra o que vai entrar e "Importar" grava. Itens que já existem na mesma categoria ficam como estão.
 */
export function ImportarCardapio({ slug }: { slug: string }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const lido = useMemo(() => lerCardapio(texto), [texto]);

  if (!aberto)
    return (
      <button type="button" className="btn-ghost" onClick={() => setAberto(true)}>
        Importar de foto ou PDF
      </button>
    );

  return (
    <section className="card w-full p-5" aria-labelledby="importar">
      <div className="flex items-start justify-between gap-3">
        <h2 id="importar" className="text-lg font-bold">
          Importar o cardápio de uma foto ou PDF
        </h2>
        <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => setAberto(false)}>
          Fechar
        </button>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
        <li>Abra o Claude, anexe a foto (ou as fotos) ou o PDF do cardápio e cole o pedido abaixo.</li>
        <li>Copie a resposta do Claude e cole no campo. Confira a prévia: nomes e preços.</li>
        <li>Toque em Importar. Depois coloque o custo de cada item na tabela.</li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(PEDIDO_AO_CLAUDE);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2500);
            } catch {}
          }}
        >
          {copiado ? 'Copiado!' : 'Copiar o pedido para o Claude'}
        </button>
      </div>
      <label htmlFor="cardapio-texto" className="label mt-4">
        Resposta do Claude
      </label>
      <textarea
        id="cardapio-texto"
        className="field min-h-48 font-mono text-sm"
        placeholder={'## Lanches\nX-Salada | 34,90 | Pão, hambúrguer, alface e tomate\nX-Bacon | 39,90'}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {texto.trim() && (
        <div className="mt-4">
          <p className="text-sm font-semibold">
            Prévia: {lido.total} {lido.total === 1 ? 'item' : 'itens'} em {lido.categorias.length} {lido.categorias.length === 1 ? 'categoria' : 'categorias'}
          </p>
          {lido.avisos.length > 0 && (
            <ul className="mt-2 space-y-1 rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">
              {lido.avisos.slice(0, 8).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-line">
            {lido.categorias.map((c) => (
              <div key={c.name}>
                <p className="bg-paper px-3 py-1.5 text-[13px] font-bold text-ink-soft">{c.name}</p>
                <ul className="divide-y divide-line">
                  {c.items.map((i, k) => (
                    <li key={k} className="flex justify-between gap-3 px-3 py-1.5 text-sm">
                      <span className="min-w-0">
                        {i.name}
                        {i.description && <span className="block truncate text-xs text-ink-mute">{i.description}</span>}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{brl(i.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary mt-3"
            disabled={pending || !lido.total}
            onClick={() =>
              start(async () => {
                setMsg(null);
                const r = await importarCardapioAction(slug, texto);
                if (!r.ok) return setMsg({ ok: false, text: r.error ?? 'Não foi possível importar.' });
                setMsg({ ok: true, text: `${r.adicionados} ${r.adicionados === 1 ? 'item entrou' : 'itens entraram'}${r.repetidos ? `; ${r.repetidos} ${r.repetidos === 1 ? 'já existia e ficou como estava' : 'já existiam e ficaram como estavam'}` : ''}. Atualizando…` });
                setTimeout(() => window.location.reload(), 1200);
              })
            }
          >
            {pending ? 'Importando…' : `Importar ${lido.total} ${lido.total === 1 ? 'item' : 'itens'}`}
          </button>
        </div>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}

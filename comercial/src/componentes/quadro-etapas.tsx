'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { Retorno } from './formulario';

export interface ColunaQuadro {
  etapa: string;
  nome: string;
  total: number;
  /** Link to the full list when the column has more cards than the board shows. */
  verTodos?: { href: string; texto: string };
  cartoes: { id: string; nome: string; conteudo: React.ReactNode }[];
}

type Mover = (anterior: Retorno, dados: FormData) => Promise<Retorno>;

/**
 * Opportunity board: cards can be dragged to another column (mouse) or moved with the "Mover para" menu under
 * each card (keyboard, phone). Moving to "Perdido" asks the reason first. The server decides; on an error the card
 * goes back and the message is shown.
 */
export function QuadroEtapas({ colunas, mover }: { colunas: ColunaQuadro[]; mover: Mover }) {
  const router = useRouter();
  const [movidos, setMovidos] = useState<Record<string, string>>({});
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Retorno>({});
  const [perda, setPerda] = useState<{ id: string; nome: string } | null>(null);
  const [pendente, iniciar] = useTransition();
  const dialogo = useRef<HTMLDialogElement>(null);
  const motivo = useRef<HTMLTextAreaElement>(null);

  // The server's answer (after refresh) replaces the local moves.
  const assinatura = colunas.map((c) => c.cartoes.map((k) => k.id).join(',')).join('|');
  const [vista, setVista] = useState(assinatura);
  if (vista !== assinatura) {
    setVista(assinatura);
    setMovidos({});
  }

  useEffect(() => {
    if (perda) {
      dialogo.current?.showModal();
      motivo.current?.focus();
    } else dialogo.current?.close();
  }, [perda]);

  const etapaDe = (id: string, original: string) => movidos[id] ?? original;
  const nomeEtapa = (e: string) => colunas.find((c) => c.etapa === e)?.nome ?? e;

  function enviar(id: string, de: string, para: string, nome: string, motivoPerda = '') {
    setMovidos((m) => ({ ...m, [id]: para }));
    setAviso({});
    iniciar(async () => {
      const fd = new FormData();
      fd.set('id', id);
      fd.set('etapa', para);
      fd.set('motivo', motivoPerda);
      const r = await mover({}, fd);
      if (r.erro) {
        setMovidos((m) => ({ ...m, [id]: de }));
        setAviso({ erro: `${nome}: ${r.erro}` });
      } else {
        setAviso({ ok: `${nome} foi para ${nomeEtapa(para)}.` });
        router.refresh();
      }
    });
  }

  function pedir(id: string, de: string, para: string, nome: string) {
    if (!para || para === de) return;
    if (para === 'perdido') setPerda({ id, nome });
    else enviar(id, de, para, nome);
  }

  // Where each card is right now (including moves still waiting for the server).
  const todos = colunas.flatMap((c) => c.cartoes.map((k) => ({ ...k, original: c.etapa })));
  const deId = (id: string) => todos.find((k) => k.id === id);

  return (
    <div>
      <p className="sr-only" aria-live="polite">{aviso.ok ?? ''}</p>
      {aviso.erro && <p role="alert" className="aviso mb-3 bg-erro-clara text-erro">{aviso.erro}</p>}
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex gap-3" aria-busy={pendente}>
          {colunas.map((c) => {
            const aqui = todos.filter((k) => etapaDe(k.id, k.original) === c.etapa);
            const contagem = c.total - c.cartoes.filter((k) => etapaDe(k.id, c.etapa) !== c.etapa).length + aqui.filter((k) => k.original !== c.etapa).length;
            return (
              <section
                key={c.etapa}
                aria-label={c.nome}
                onDragOver={(e) => {
                  if (!arrastando) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (sobre !== c.etapa) setSobre(c.etapa);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre((s) => (s === c.etapa ? null : s));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setSobre(null);
                  const k = arrastando ? deId(arrastando) : undefined;
                  setArrastando(null);
                  if (k) pedir(k.id, etapaDe(k.id, k.original), c.etapa, k.nome);
                }}
                className={`w-72 shrink-0 rounded-xl p-2 transition-colors ${sobre === c.etapa ? 'bg-marca-clara outline-2 outline-dashed outline-marca' : 'bg-[#eceff4]'}`}
              >
                <h2 className="flex items-center justify-between px-1 pb-2 text-sm font-bold">
                  {c.nome} <span className="etiqueta bg-white">{contagem}</span>
                </h2>
                <div className="min-h-16 space-y-2">
                  {aqui.length === 0 ? (
                    <p className="px-1 pb-2 text-sm text-suave">Vazio</p>
                  ) : (
                    aqui.map((k) => {
                      const atual = etapaDe(k.id, k.original);
                      return (
                        <div
                          key={k.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', k.id);
                            setArrastando(k.id);
                          }}
                          onDragEnd={() => {
                            setArrastando(null);
                            setSobre(null);
                          }}
                          className={`cursor-grab rounded-lg active:cursor-grabbing ${arrastando === k.id ? 'opacity-50' : ''}`}
                        >
                          {k.conteudo}
                          <label className="mt-1 flex items-center gap-2 px-1 text-[13px] text-suave">
                            <span className="shrink-0">Mover para</span>
                            <select
                              className="min-h-9 w-full rounded-md border border-linha bg-white px-2 text-[13px] text-tinta"
                              value=""
                              aria-label={`Mover ${k.nome} para outra etapa`}
                              onChange={(e) => pedir(k.id, atual, e.target.value, k.nome)}
                            >
                              <option value="">Escolha…</option>
                              {colunas.filter((o) => o.etapa !== atual).map((o) => (
                                <option key={o.etapa} value={o.etapa}>{o.nome}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      );
                    })
                  )}
                  {c.verTodos && <a className="block px-1 text-sm underline" href={c.verTodos.href}>{c.verTodos.texto}</a>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[13px] text-suave">
        Arraste o cartão para outra coluna ou use &quot;Mover para&quot;. Para marcar como perdido, a plataforma pede o motivo. Só o administrador reabre uma oportunidade ganha ou perdida.
      </p>

      <dialog
        ref={dialogo}
        aria-labelledby="perda-titulo"
        onClose={() => setPerda(null)}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-linha p-0 backdrop:bg-black/40"
      >
        {perda && (
          <form
            className="space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const texto = motivo.current?.value.trim() ?? '';
              const k = deId(perda.id);
              if (!k) return setPerda(null);
              enviar(k.id, etapaDe(k.id, k.original), 'perdido', k.nome, texto);
              setPerda(null);
            }}
          >
            <h2 id="perda-titulo" className="text-lg font-bold">Por que {perda.nome} foi perdido?</h2>
            <label className="rotulo" htmlFor="motivo-perda">Motivo da perda</label>
            <textarea ref={motivo} id="motivo-perda" className="campo min-h-24" required minLength={3} maxLength={500} placeholder="Ex.: fechou com outra empresa, achou caro, desistiu" />
            <div className="flex justify-end gap-2">
              <button type="button" className="botao-2" onClick={() => setPerda(null)}>Cancelar</button>
              <button type="submit" className="botao">Marcar como perdido</button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}

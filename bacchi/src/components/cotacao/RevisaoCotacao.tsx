'use client';
// Quote review: edit quantities and notes, then one tap opens WhatsApp with the Bacchi sales number (the one
// published on the current site) and a short, ready message listing what was chosen. No form, no e-mail: the
// conversation continues on WhatsApp. "Copy" is there for whoever prefers to paste it elsewhere.
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ACABAMENTOS, produto } from '@/data/catalogo';
import { EMPRESA } from '@/data/empresa';
import { linkWhatsAppPedido, mensagemWhatsApp } from '@/lib/cotacao';
import { cotacao, useCotacao } from '@/lib/cotacao-store';

export function RevisaoCotacao() {
  const itens = useCotacao();
  const [copiado, setCopiado] = useState(false);
  const texto = mensagemWhatsApp(itens);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  if (!itens.length) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-aco-claro px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold">Sua cotação está vazia.</h2>
        <p className="mt-3 text-tinta-2">No catálogo, abra um produto e use “Adicionar” no modelo que você precisa. A lista fica guardada neste navegador.</p>
        <Link href="/produtos" className="btn btn-primario mt-8">Ir para o catálogo <span className="seta" aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section aria-labelledby="titulo-itens" className="min-w-0 lg:col-span-7">
        <div className="flex items-end justify-between">
          <h2 id="titulo-itens" className="font-display text-2xl font-semibold">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</h2>
          <button type="button" onClick={() => confirm('Remover todos os itens da cotação?') && cotacao.limpar()} className="link-b text-sm text-tinta-2">
            Esvaziar
          </button>
        </div>
        <ul className="mt-5 divide-y divide-linha border-y border-linha">
          {itens.map((i) => {
            const p = produto(i.slug);
            return (
              <li key={i.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
                <Link href={`/produtos/${i.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-papel">
                  {p && <Image src={p.imagens[0].src} alt="" fill sizes="88px" className="object-cover" />}
                </Link>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {p?.nome} · {p?.rotuloModelo} {i.modelo}
                  </p>
                  <p className="mt-1 text-sm text-tinta-2">
                    {i.acabamento && ACABAMENTOS[i.acabamento] ? `${ACABAMENTOS[i.acabamento].nome} · ` : ''}
                    {i.embalagem}
                  </p>
                  <label className="mt-3 block">
                    <span className="sr-only">Observação</span>
                    <input defaultValue={i.observacao ?? ''} onBlur={(e) => cotacao.observacao(i.id, e.target.value)} maxLength={200} placeholder="Observação (opcional)" className="w-full border-b border-linha bg-transparent py-1 text-sm outline-none focus:border-azul" />
                  </label>
                </div>
                <div className="col-start-2 flex items-center justify-between gap-4 sm:col-start-3 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-full border border-linha bg-white">
                    <button type="button" className="grid h-10 w-10 place-items-center" aria-label={`Diminuir ${p?.nome} ${i.modelo}`} onClick={() => cotacao.quantidade(i.id, i.quantidade - 1)}>−</button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`Quantidade de embalagens de ${p?.nome} ${i.modelo}`}
                      value={i.quantidade}
                      onChange={(e) => cotacao.quantidade(i.id, Number(e.target.value))}
                      className="h-10 w-16 text-center tabular-nums outline-none"
                    />
                    <button type="button" className="grid h-10 w-10 place-items-center" aria-label={`Aumentar ${p?.nome} ${i.modelo}`} onClick={() => cotacao.quantidade(i.id, i.quantidade + 1)}>+</button>
                  </div>
                  <button type="button" onClick={() => cotacao.remover(i.id)} className="text-sm text-tinta-2 hover:text-[#b3261e]">Remover</button>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/produtos" className="link-b mt-6 inline-block text-sm font-semibold text-azul">+ Adicionar mais produtos</Link>
      </section>

      <section aria-labelledby="titulo-envio" className="min-w-0 lg:col-span-5">
        <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(13,23,38,.45)] md:p-8 lg:sticky lg:top-28">
          <h2 id="titulo-envio" className="font-display text-2xl font-semibold">Pedir pelo WhatsApp</h2>
          <p className="mt-2 text-sm text-tinta-2">A conversa abre com a equipe comercial da Bacchi e esta mensagem já escrita. É só enviar.</p>

          <div className="mt-5 rounded-2xl bg-[#e7f6e9] p-4">
            <p className="text-xs font-semibold text-[#1f6b34]">Prévia da mensagem</p>
            <p className="mt-2 max-h-72 overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-tinta">{texto.replace(/\*/g, '')}</p>
          </div>

          <a className="btn mt-5 w-full bg-[#188046] text-white hover:bg-[#13693a]" href={linkWhatsAppPedido(texto)} target="_blank" rel="noopener noreferrer">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
            </svg>
            Enviar no WhatsApp
          </a>
          <button type="button" className="link-b mx-auto mt-4 block text-sm text-tinta-2" onClick={copiar}>
            {copiado ? 'Mensagem copiada ✓' : 'Copiar a mensagem'}
          </button>
          <p className="mt-4 text-center text-xs text-aco">WhatsApp da Bacchi: {EMPRESA.whatsapp}. Sem preços nesta etapa: a equipe responde com valores e prazos.</p>
        </div>
      </section>
    </div>
  );
}

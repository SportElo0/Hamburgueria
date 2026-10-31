'use client';

import { useMemo, useState, useTransition } from 'react';
import { setOptOutAction } from '@/app/loja/[slug]/actions';
import { brl, type Coupon } from '@/lib/ordering';
import type { Customer } from '@/lib/customers';

const fmtPhone = (p: string) => (p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`);
const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso));
const until = (c: Coupon) => (c.until ? ` até ${c.until.split('-').reverse().slice(0, 2).join('/')}` : '');

function offerOf(c: Coupon) {
  if (c.type === 'frete') return `a entrega é por nossa conta${until(c)}`;
  return `${c.type === 'percent' ? `${c.value}%` : brl(c.value)} de desconto${until(c)}`;
}

/** The suggested message: honest (no fake prize), with the coupon, the link and how to stop. */
function draftMessage(storeName: string, siteUrl: string, c: Coupon | undefined) {
  const offer = c ? ` ${offerOf(c).charAt(0).toUpperCase()}${offerOf(c).slice(1)} com o cupom ${c.code}.` : '';
  const link = siteUrl ? ` Peça pelo site: ${siteUrl}` : '';
  return `Bateu saudade do Chefão? 🍔 Aqui é do ${storeName}.${offer}${link}\n\nPara não receber mais promoções, responda SAIR.`;
}

function vcard(list: Customer[]) {
  return list.map((c) => ['BEGIN:VCARD', 'VERSION:3.0', `FN:${c.name.replace(/[\r\n;,]/g, ' ')} (cliente)`, `TEL;TYPE=CELL:+55${c.phone}`, 'END:VCARD'].join('\r\n')).join('\r\n');
}

export function CustomersBoard(props: { slug: string; storeName: string; siteUrl: string; coupons: Coupon[]; customers: Customer[] }) {
  const [customers, setCustomers] = useState(props.customers);
  const [couponCode, setCouponCode] = useState(props.coupons[0]?.code ?? '');
  const coupon = props.coupons.find((c) => c.code === couponCode);
  const [message, setMessage] = useState(() => draftMessage(props.storeName, props.siteUrl, props.coupons[0]));
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [, start] = useTransition();
  const opted = useMemo(() => customers.filter((c) => c.optIn), [customers]);
  const others = customers.length - opted.length;

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 2500);
    } catch {
      setError('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([vcard(opted)], { type: 'text/vcard' }));
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `clientes-promocoes-${props.slug}.vcf`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleOut = (phone: string, out: boolean) => {
    setCustomers((list) => list.map((c) => (c.phone === phone ? { ...c, optedOut: out, optIn: !out && c.ticked } : c)));
    start(async () => {
      const res = await setOptOutAction(props.slug, phone, out);
      if (!res.ok) setError(res.error ?? 'Não foi possível salvar.');
    });
  };

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Clientes e campanhas</p>
            <h1 className="text-lg font-bold">{props.storeName}</h1>
          </div>
          <a href={`/loja/${props.slug}`} className="btn-ghost min-h-11">
            Voltar aos pedidos
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
        <section aria-label="Resumo" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="card p-4">
            <p className="text-[13px] font-semibold text-ink-mute">Contatos (90 dias)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{customers.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-[13px] font-semibold text-ink-mute">Aceitam promoções</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ok">{opted.length}</p>
          </div>
          <div className="card col-span-2 p-4 md:col-span-1">
            <p className="text-[13px] font-semibold text-ink-mute">Sem permissão</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{others}</p>
            <p className="mt-1 text-xs text-ink-mute">Não marcaram a caixinha ou pediram para sair.</p>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold">Campanha no WhatsApp</h2>
            <p className="mt-1 text-sm text-ink-mute">Vai só para quem marcou “quero receber promoções” no pedido. No máximo uma por mês, sempre com um motivo real para voltar.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[16rem_1fr]">
            <div>
              <label htmlFor="camp-cupom" className="label">
                Cupom da campanha
              </label>
              <select
                id="camp-cupom"
                className="field"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setMessage(
                    draftMessage(
                      props.storeName,
                      props.siteUrl,
                      props.coupons.find((c) => c.code === e.target.value),
                    ),
                  );
                }}
              >
                <option value="">Sem cupom</option>
                {props.coupons.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {offerOf(c)}
                  </option>
                ))}
              </select>
              {props.coupons.length === 0 && <p className="mt-1 text-xs text-ink-mute">Nenhum cupom ativo. A equipe cria em Configurar → Cupons.</p>}
              {coupon?.type === 'frete' && <p className="mt-1 text-xs text-ink-mute">Entrega grátis: vale só para entrega.</p>}
            </div>
            <div>
              <label htmlFor="camp-msg" className="label">
                Mensagem
              </label>
              <textarea id="camp-msg" className="field min-h-36 resize-y" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={700} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => copy(message, 'mensagem')}>
              {copied === 'mensagem' ? 'Mensagem copiada' : 'Copiar mensagem'}
            </button>
            <button type="button" className="btn-ghost" onClick={download} disabled={!opted.length}>
              Baixar contatos ({opted.length})
            </button>
            <button type="button" className="btn-ghost" onClick={() => copy(opted.map((c) => `+55${c.phone}`).join('\n'), 'numeros')} disabled={!opted.length}>
              {copied === 'numeros' ? 'Números copiados' : 'Copiar números'}
            </button>
          </div>
          <details className="rounded-lg border border-line bg-white px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold">Como enviar pela lista de transmissão</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
              <li>Baixe os contatos e abra o arquivo no celular da loja para salvá-los.</li>
              <li>No WhatsApp Business: Conversas → ⋮ → Nova transmissão → escolha os contatos.</li>
              <li>Cole a mensagem e envie. Cada cliente recebe no privado.</li>
              <li>A transmissão só chega para quem também tem o número da loja salvo. Para os outros, use “Enviar” na lista abaixo.</li>
              <li>Se alguém responder SAIR, toque em “Tirar das promoções”.</li>
            </ol>
          </details>
          {error && (
            <p role="alert" className="text-sm font-semibold text-bad">
              {error}
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-bold">Clientes</h2>
          {customers.length === 0 ? (
            <p className="mt-2 text-sm text-ink-mute">Os clientes aparecem aqui a partir do primeiro pedido pelo site.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {customers.map((c) => (
                <li key={c.phone} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {c.name}{' '}
                      {c.optIn ? (
                        <span className="chip ml-1 bg-ok/10 text-ok">Aceita promoções</span>
                      ) : c.optedOut ? (
                        <span className="chip ml-1 bg-line text-ink-mute">Pediu para sair</span>
                      ) : (
                        <span className="chip ml-1 bg-line text-ink-mute">Sem permissão</span>
                      )}
                    </p>
                    <p className="text-sm text-ink-mute tabular-nums">
                      {fmtPhone(c.phone)} · {c.orders === 0 && c.subscribedAt ? `entrou pela lista do site em ${fmtDay(c.subscribedAt)}` : `${c.orders} ${c.orders === 1 ? 'pedido' : 'pedidos'} · ${brl(c.spent)} · último em ${fmtDay(c.lastOrderAt)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.optIn && (
                      <a
                        className="btn min-h-10 border border-ok/40 bg-ok/5 text-ok hover:bg-ok hover:text-white"
                        href={`https://wa.me/55${c.phone}?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Enviar
                      </a>
                    )}
                    {c.optIn && (
                      <button type="button" className="btn-ghost min-h-10" onClick={() => toggleOut(c.phone, true)}>
                        Tirar das promoções
                      </button>
                    )}
                    {c.optedOut && (
                      <button type="button" className="btn-ghost min-h-10" onClick={() => toggleOut(c.phone, false)}>
                        Desfazer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

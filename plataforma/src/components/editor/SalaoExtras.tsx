'use client';

import { useState, useTransition } from 'react';
import { sellerReady, type Ordering } from '@/lib/ordering';
import type { PdvSend } from '@/lib/pdv';
import { resendToPdvAction } from '@/app/painel/actions';

/** Waiting list, paying at the table, and sending orders to the store's POS (Saipos). Saved with the store; publish to apply. */
export function SalaoExtras(props: { slug: string; o: Ordering; set: <K extends keyof Ordering>(k: K, v: Ordering[K]) => void; hasMercadoPago: boolean; saiposReady: boolean; sends: PdvSend[] }) {
  const { o } = props;
  const wl = o.waitlist ?? { enabled: false, maxParties: 60 };
  const pdv = o.pdv ?? { provider: 'nenhum' as const, codStore: '', codes: {}, city: '', state: '' };
  const [sends, setSends] = useState(props.sends);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const [codesText, setCodesText] = useState(() => Object.entries(pdv.codes).map(([k, v]) => `${k} = ${v}`).join('\n'));
  const parseCodes = (text: string) =>
    Object.fromEntries(
      text
        .split('\n')
        .map((l) => l.split('=').map((x) => x.trim()))
        .filter(([k, v]) => k && v && k.length <= 40 && v.length <= 40)
        .slice(0, 500),
    );

  return (
    <section className="card space-y-6 p-5 lg:col-span-2">
      {(wl.enabled || o.tablePay || pdv.provider === 'saipos') && !sellerReady(o.reservations) && (
        <p className="text-sm font-semibold text-warn">Falta preencher os dados do restaurante (razão social, CNPJ, endereço e contato de privacidade, na parte de Reservas): sem eles a fila, o Pix da mesa e o envio ao PDV ficam desligados, porque o aviso de privacidade precisa deles.</p>
      )}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Fila de espera pelo celular</h2>
        <p className="text-sm text-ink-mute">Quem chega lê o QR da porta (Mapa → QR da porta), deixa o nome e espera onde quiser. A página do cliente vibra e toca quando a recepção toca em &quot;Chamar&quot; no mapa.</p>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-accent" checked={wl.enabled} onChange={(e) => props.set('waitlist', { ...wl, enabled: e.target.checked })} />
          <span className="text-[15px] font-semibold">Ligar a fila pelo celular</span>
        </label>
        <div>
          <label htmlFor="fila-max" className="label">
            Máximo de grupos na fila
          </label>
          <input id="fila-max" className="field w-28" inputMode="numeric" value={wl.maxParties} onChange={(e) => props.set('waitlist', { ...wl, maxParties: Math.max(5, Math.min(200, Number(e.target.value.replace(/\D/g, '')) || 5)) })} />
        </div>
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <h2 className="text-lg font-bold">Pagar a conta pelo celular (Pix)</h2>
        <p className="text-sm text-ink-mute">Na tela da mesa aparece &quot;Pagar pelo Pix&quot;: a conta inteira ou dividida por pessoa. O Pix cai direto na conta da loja; quando a conta fica paga, a mesa fecha sozinha.</p>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-accent" checked={Boolean(o.tablePay)} onChange={(e) => props.set('tablePay', e.target.checked)} />
          <span className="text-[15px] font-semibold">Deixar a mesa pagar pelo Pix</span>
        </label>
        {o.tablePay && o.pixMode === 'mercadopago' && !props.hasMercadoPago && <p className="text-sm font-semibold text-warn">Falta o token do Mercado Pago: sem ele o Pix da mesa não funciona.</p>}
        {o.tablePay && o.pixMode === 'demo' && (
          <p className="text-sm font-semibold text-bad">Pix em modo demonstração: o botão fica escondido no site (o cliente poderia &quot;pagar&quot; sem pagar). Ligue o Pix real do Mercado Pago para usar. Em loja de demonstração ele aparece para testes.</p>
        )}
        <p className="text-sm text-ink-mute">Taxa de serviço, couvert e gorjeta precisam entrar como itens da conta: o Pix cobra só o total que aparece na mesa.</p>
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <h2 className="text-lg font-bold">Enviar pedidos para o PDV (Saipos)</h2>
        <p className="text-sm text-ink-mute">Cada pedido do site e da mesa entra também no Saipos da loja, quando vai para a cozinha. Precisa do código da loja no Saipos e dos códigos dos itens.</p>
        <p className="text-sm text-ink-mute">Antes de ligar: confirme com o Saipos que o código da loja é deste restaurante (os pedidos levam nome, telefone e endereço do cliente), e que o contrato com o restaurante cita o envio ao PDV.</p>
        {!props.saiposReady && <p className="text-sm font-semibold text-warn">A Growlift ainda não tem as credenciais de parceiro do Saipos no servidor: os envios ficam guardados como &quot;não enviado&quot; até isso existir.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pdv" className="label">
              Sistema
            </label>
            <select id="pdv" className="field" value={pdv.provider} onChange={(e) => props.set('pdv', { ...pdv, provider: e.target.value === 'saipos' ? 'saipos' : 'nenhum' })}>
              <option value="nenhum">Nenhum</option>
              <option value="saipos">Saipos</option>
            </select>
          </div>
          <div>
            <label htmlFor="cod-store" className="label">
              Código da loja no Saipos
            </label>
            <input id="cod-store" className="field" value={pdv.codStore} maxLength={40} onChange={(e) => props.set('pdv', { ...pdv, codStore: e.target.value.trim() })} />
          </div>
        </div>
        <div>
          <label htmlFor="pdv-codes" className="label">
            Códigos dos itens (um por linha: id do item = código no Saipos)
          </label>
          <textarea
            id="pdv-codes"
            className="field min-h-28 font-mono text-sm"
            placeholder={'el-patron = 1234\nbatata-frita = 5678'}
            value={codesText}
            onChange={(e) => setCodesText(e.target.value)}
            onBlur={() => props.set('pdv', { ...pdv, codes: parseCodes(codesText) })}
          />
          <p className="mt-1 text-xs text-ink-mute">Item sem código vai com o id do painel. Adicional: use &quot;id-do-item:Nome do adicional = código&quot;. O pedido vai para o Saipos quando a loja toca em &quot;Aceitar&quot;.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
          <div>
            <label htmlFor="pdv-cidade" className="label">
              Cidade (para pedidos de entrega)
            </label>
            <input id="pdv-cidade" className="field" value={pdv.city} maxLength={60} onChange={(e) => props.set('pdv', { ...pdv, city: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pdv-uf" className="label">
              UF
            </label>
            <input id="pdv-uf" className="field uppercase" value={pdv.state} maxLength={2} onChange={(e) => props.set('pdv', { ...pdv, state: e.target.value.toUpperCase() })} />
          </div>
        </div>
        {sends.length > 0 && (
          <div>
            <p className="label">Últimos envios</p>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {sends.map((s) => (
                <li key={s.orderId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>
                    Pedido #{s.number} ·{' '}
                    <span className={s.status === 'enviado' ? 'font-semibold text-ok' : 'font-semibold text-warn'}>{s.status === 'enviado' ? 'enviado' : s.status === 'erro' ? 'erro' : 'não enviado'}</span>
                    {s.error && <span className="block text-xs text-ink-mute">{s.error}</span>}
                  </span>
                  {s.status !== 'enviado' && (
                    <button
                      type="button"
                      className="btn-ghost min-h-9"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const res = await resendToPdvAction(props.slug, s.orderId);
                          setMsg(res.ok ? `Pedido #${s.number} enviado.` : res.error ?? 'Não foi enviado.');
                          if (res.ok) setSends((list) => list.map((x) => (x.orderId === s.orderId ? { ...x, status: 'enviado', error: '' } : x)));
                        })
                      }
                    >
                      Reenviar
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {msg && (
              <p role="status" className="mt-2 text-sm text-ink-soft">
                {msg}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

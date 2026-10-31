'use client';

import { useState, useTransition } from 'react';
import { newId, type Store } from '@/lib/schema';
import { brl, orderingOf, todaySP, type Coupon } from '@/lib/ordering';
import type { OperatorSummary } from '@/lib/operators';
import { createOperatorAction, removeOperatorAction, saveMercadoPagoTokenAction } from '@/app/painel/actions';
import { setOpenAction } from '@/app/loja/[slug]/actions';
import type { Update } from './StoreEditor';

const toCents = (v: string) => {
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
};
const toReais = (c: number) => (c / 100).toFixed(2).replace('.', ',');

function Check(props: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <label htmlFor={props.id} className="flex cursor-pointer items-start gap-3">
      <input id={props.id} type="checkbox" className="mt-1 h-4 w-4 accent-ink" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <span>
        <span className="text-[15px] font-semibold">{props.label}</span>
        {props.help && <span className="block text-xs text-ink-mute">{props.help}</span>}
      </span>
    </label>
  );
}

function Money(props: { id: string; label: string; cents: number; onChange: (c: number) => void; help?: string }) {
  const [text, setText] = useState(toReais(props.cents));
  return (
    <div>
      <label htmlFor={props.id} className="label">
        {props.label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-mute">R$</span>
        <input
          id={props.id}
          inputMode="decimal"
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const c = toCents(text);
            setText(toReais(c));
            props.onChange(c);
          }}
        />
      </div>
      {props.help && <p className="mt-1 text-xs text-ink-mute">{props.help}</p>}
    </div>
  );
}

const couponLabel = (c: Coupon) => (c.type === 'frete' ? 'entrega grátis' : c.type === 'percent' ? `${c.value}% de desconto` : `${brl(c.value)} de desconto`);

/** Discount codes the customer types at checkout; the server prices them, the site only previews. */
function Coupons({ coupons, onChange }: { coupons: Coupon[]; onChange: (c: Coupon[]) => void }) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<Coupon['type']>('percent');
  const [value, setValue] = useState('');
  const [min, setMin] = useState('');
  const [until, setUntil] = useState('');
  const [error, setError] = useState('');
  const today = todaySP();
  const patch = (i: number, p: Partial<Coupon>) => onChange(coupons.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <section className="card space-y-4 p-5">
      <h2 className="text-lg font-bold">Cupons de desconto</h2>
      <p className="text-sm text-ink-mute">O cliente digita o código na finalização. O desconto vale sobre os itens (não sobre a entrega).</p>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {coupons.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-mute">Nenhum cupom ainda.</li>}
        {coupons.map((c, i) => {
          const expired = c.until !== '' && c.until < today;
          return (
            <li key={c.code} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
              <span>
                <span className="font-mono text-sm font-bold">{c.code}</span>
                <span className="ml-2 text-sm">{couponLabel(c)}</span>
                <span className="block text-xs text-ink-mute">
                  {c.minOrder ? `pedido mínimo ${brl(c.minOrder)}` : 'sem pedido mínimo'}
                  {c.until && ` · ${expired ? 'venceu' : 'até'} ${c.until.split('-').reverse().join('/')}`}
                </span>
              </span>
              <span className="flex items-center gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" className="h-4 w-4 accent-ink" checked={c.active} onChange={(e) => patch(i, { active: e.target.checked })} />
                  Ativo
                </label>
                <button type="button" className="text-bad underline" onClick={() => onChange(coupons.filter((_, j) => j !== i))}>
                  Remover
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <form
        className="grid grid-cols-2 items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = code.trim().toUpperCase();
          const n = type === 'frete' ? 0 : type === 'percent' ? Math.round(Number(value.replace(',', '.'))) : toCents(value);
          if (!/^[A-Z0-9]{3,20}$/.test(clean)) return setError('Código: 3 a 20 letras ou números, sem espaço.');
          if (coupons.some((c) => c.code === clean)) return setError('Esse código já existe.');
          if (type !== 'frete' && (!(n >= 1) || (type === 'percent' && n > 100))) return setError(type === 'percent' ? 'Desconto entre 1% e 100%.' : 'Informe o valor do desconto.');
          onChange([...coupons, { code: clean, type, value: n, minOrder: toCents(min), active: true, until }]);
          setCode('');
          setValue('');
          setMin('');
          setUntil('');
          setError('');
        }}
      >
        <div className="col-span-2">
          <label htmlFor="cupom-codigo" className="label">
            Código
          </label>
          <input id="cupom-codigo" className="field font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PATRON10" maxLength={20} />
        </div>
        <div>
          <label htmlFor="cupom-tipo" className="label">
            Tipo
          </label>
          <select id="cupom-tipo" className="field" value={type} onChange={(e) => setType(e.target.value as Coupon['type'])}>
            <option value="percent">%</option>
            <option value="fixed">R$</option>
            <option value="frete">Entrega grátis</option>
          </select>
        </div>
        {type !== 'frete' && (
          <div>
            <label htmlFor="cupom-valor" className="label">
              {type === 'percent' ? 'Desconto %' : 'Desconto R$'}
            </label>
            <input id="cupom-valor" inputMode="decimal" className="field" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percent' ? '10' : '5,00'} />
          </div>
        )}
        <div>
          <label htmlFor="cupom-min" className="label">
            Mínimo R$
          </label>
          <input id="cupom-min" inputMode="decimal" className="field" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label htmlFor="cupom-ate" className="label">
            Vale até
          </label>
          <input id="cupom-ate" type="date" className="field" value={until} min={today} onChange={(e) => setUntil(e.target.value)} />
        </div>
        <button type="submit" className="btn-ghost col-span-2">
          Criar cupom
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}
    </section>
  );
}

export function OnlineOrdersPanel(props: {
  store: Store;
  update: Update;
  operators: OperatorSummary[];
  hasMercadoPago: boolean;
  ordersUrl: string;
  webhookUrl: string;
  open: boolean;
}) {
  const o = orderingOf(props.store);
  const set = <K extends keyof typeof o>(key: K, value: (typeof o)[K]) =>
    props.update((d) => {
      d.ordering = { ...orderingOf(d), [key]: value };
    });
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [token, setToken] = useState('');
  const [hasMp, setHasMp] = useState(props.hasMercadoPago);
  const [operators, setOperators] = useState(props.operators);
  const [opEmail, setOpEmail] = useState('');
  const [opName, setOpName] = useState('');
  const [handover, setHandover] = useState<{ email: string; password: string } | null>(null);
  const [open, setOpen] = useState(props.open);
  const [areaName, setAreaName] = useState('');
  const [areaFee, setAreaFee] = useState('');

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={`card flex flex-wrap items-center justify-between gap-4 p-5 lg:col-span-2 ${open ? 'border-ok' : 'border-warn'}`}>
        <div>
          <h2 className="text-lg font-bold">{open ? 'Loja aberta: o site está aceitando pedidos' : 'Loja fechada: o site não aceita pedidos agora'}</h2>
          <p className="text-sm text-ink-mute">
            {o.enabled ? 'A loja abre e fecha aqui ou na tela de pedidos. Vale na hora, sem publicar.' : 'Ligue “Receber pedidos pelo site” e publique antes de abrir.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            aria-pressed={open}
            onClick={() =>
              start(async () => {
                const res = await setOpenAction(props.store.slug, !open);
                if (res.ok) setOpen(!open);
                else setMsg({ tone: 'bad', text: res.error ?? 'Erro.' });
              })
            }
            className={`btn min-h-12 border px-5 text-base ${open ? 'border-line bg-white text-ink hover:border-bad hover:text-bad' : 'border-ok bg-ok text-white hover:bg-ink'}`}
          >
            {open ? 'Fechar a loja' : 'Abrir a loja agora'}
          </button>
          <a href={props.ordersUrl} className="btn-ghost min-h-12 px-5 text-base" target="_blank" rel="noreferrer">
            Tela de pedidos
          </a>
        </div>
      </section>
      {msg && (
        <p role="status" className={`text-sm font-semibold lg:col-span-2 ${msg.tone === 'ok' ? 'text-ok' : 'text-bad'}`}>
          {msg.text}
        </p>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Pedidos pelo site</h2>
        <p className="text-sm text-ink-mute">
          Ligado, o site finaliza o pedido sozinho e ele cai na tela da loja, sem passar pelo WhatsApp. Salve e <strong>publique</strong> para valer no site.
        </p>
        <Check id="on" label="Receber pedidos pelo site" checked={o.enabled} onChange={(v) => set('enabled', v)} help="Desligado, o site continua mandando o pedido pelo WhatsApp." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Check id="entrega" label="Entrega" checked={o.delivery} onChange={(v) => set('delivery', v)} />
          <Check id="retirada" label="Retirada no local" checked={o.pickup} onChange={(v) => set('pickup', v)} />
        </div>
        <Money id="minimo" label="Pedido mínimo (sem a entrega)" cents={o.minOrder} onChange={(c) => set('minOrder', c)} help="0 = sem mínimo." />
        <div>
          <label htmlFor="eta" className="label">
            Tempo estimado
          </label>
          <input id="eta" className="field" placeholder="Ex.: 40 a 60 min" value={o.eta} maxLength={40} onChange={(e) => set('eta', e.target.value)} />
        </div>
        <a href={props.ordersUrl} className="btn-primary w-full" target="_blank" rel="noreferrer">
          Abrir a tela de pedidos da loja
        </a>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Pedido na mesa (QR)</h2>
        <p className="text-sm text-ink-mute">
          Cada mesa ganha um QR Code: o cliente pede pelo celular, chama o garçom e pede a conta. O garçom confirma o primeiro pedido de cada mesa no celular dele (tela Salão). Salve e <strong>publique</strong> para valer.
        </p>
        <Check id="mesas" label="Receber pedidos pela mesa" checked={o.tables.enabled} onChange={(v) => set('tables', { ...o.tables, enabled: v })} help="Precisa de “Receber pedidos pelo site” ligado." />
        <div>
          <label htmlFor="mesas-n" className="label">
            Quantas mesas
          </label>
          <input
            id="mesas-n"
            className="field w-32"
            inputMode="numeric"
            value={o.tables.count}
            onChange={(e) => set('tables', { ...o.tables, count: Math.max(1, Math.min(200, Number(e.target.value.replace(/\D/g, '')) || 1)) })}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={`${props.ordersUrl}/salao`} className="btn-primary w-full" target="_blank" rel="noreferrer">
            Tela do salão (garçom)
          </a>
          <a href={`${props.ordersUrl}/mesas`} className="btn-ghost w-full" target="_blank" rel="noreferrer">
            QR Codes para imprimir
          </a>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Bairros e taxa de entrega</h2>
        <p className="text-sm text-ink-mute">Sem bairros cadastrados, a taxa fica “a combinar” e o Pix pelo site não aparece para entrega.</p>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {o.areas.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-mute">Nenhum bairro ainda.</li>}
          {o.areas.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="text-sm font-semibold">{a.name}</span>
              <span className="flex items-center gap-3 text-sm">
                {brl(a.fee)}
                <button type="button" className="text-bad underline" onClick={() => set('areas', o.areas.filter((x) => x.id !== a.id))}>
                  Remover
                </button>
              </span>
            </li>
          ))}
        </ul>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!areaName.trim()) return;
            set('areas', [...o.areas, { id: newId(), name: areaName.trim().slice(0, 60), fee: toCents(areaFee) }].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
            setAreaName('');
            setAreaFee('');
          }}
        >
          <div className="min-w-40 flex-1">
            <label htmlFor="bairro" className="label">
              Bairro
            </label>
            <input id="bairro" className="field" value={areaName} onChange={(e) => setAreaName(e.target.value)} />
          </div>
          <div className="w-28">
            <label htmlFor="taxa" className="label">
              Taxa (R$)
            </label>
            <input id="taxa" inputMode="decimal" className="field" value={areaFee} onChange={(e) => setAreaFee(e.target.value)} placeholder="0,00" />
          </div>
          <button type="submit" className="btn-ghost">
            Adicionar
          </button>
        </form>
      </section>

      <Coupons coupons={o.coupons} onChange={(c) => set('coupons', c)} />

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Pagamento</h2>
        <div className="grid gap-3">
          <Check id="pix" label="Pix pelo site" checked={o.pix} onChange={(v) => set('pix', v)} help="O cliente paga na hora; o pedido só chega na loja depois de pago." />
          <Check id="cartao" label="Cartão na entrega" checked={o.card} onChange={(v) => set('card', v)} />
          <Check id="dinheiro" label="Dinheiro na entrega" checked={o.cash} onChange={(v) => set('cash', v)} />
        </div>
        <fieldset className="space-y-2">
          <legend className="label">Pix</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="pixmode" checked={o.pixMode === 'demo'} onChange={() => set('pixMode', 'demo')} /> Demonstração (nada é cobrado)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="pixmode" checked={o.pixMode === 'mercadopago'} onChange={() => set('pixMode', 'mercadopago')} /> Mercado Pago da loja
          </label>
          {o.enabled && o.pix && o.pixMode === 'demo' && (
            <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm font-semibold text-bad">
              Pedidos ligados com Pix de demonstração: o cliente consegue &quot;pagar&quot; sem pagar. Só use assim em teste ou apresentação; para clientes de verdade, escolha o Mercado Pago da loja.
            </p>
          )}
        </fieldset>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await saveMercadoPagoTokenAction(props.store.slug, token);
              setMsg(res.ok ? { tone: 'ok', text: token.trim() ? 'Token do Mercado Pago salvo.' : 'Token removido.' } : { tone: 'bad', text: res.error ?? 'Erro.' });
              if (res.ok) {
                setHasMp(Boolean(token.trim()));
                setToken('');
              }
            });
          }}
        >
          <label htmlFor="mp" className="label">
            Access token do Mercado Pago {hasMp ? '(configurado)' : '(não configurado)'}
          </label>
          <div className="flex gap-2">
            <input id="mp" type="password" autoComplete="off" className="field font-mono" value={token} onChange={(e) => setToken(e.target.value)} placeholder={hasMp ? '•••••• (deixe vazio e salve para remover)' : 'APP_USR-…'} />
            <button type="submit" className="btn-ghost shrink-0" disabled={busy}>
              Salvar
            </button>
          </div>
          <p className="text-xs text-ink-mute">
            Fica guardado só no painel, nunca vai para o site. O dinheiro cai direto na conta da loja. Aviso de pagamento (webhook): <span className="font-mono break-all">{props.webhookUrl}</span>
          </p>
        </form>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Acesso da loja</h2>
        <p className="text-sm text-ink-mute">Logins da equipe da loja. Eles entram só na tela de pedidos desta loja.</p>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {operators.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-mute">Nenhum login ainda.</li>}
          {operators.map((op) => (
            <li key={op.email} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>
                <strong>{op.name}</strong> <span className="text-ink-mute">{op.email}</span>
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    start(async () => {
                      const res = await createOperatorAction(props.store.slug, op.email, op.name);
                      if (res.ok && res.password) setHandover({ email: op.email, password: res.password });
                      else setMsg({ tone: 'bad', text: res.error ?? 'Erro.' });
                    })
                  }
                >
                  Nova senha
                </button>
                <button
                  type="button"
                  className="text-bad underline"
                  onClick={() =>
                    start(async () => {
                      await removeOperatorAction(props.store.slug, op.email);
                      setOperators((list) => list.filter((x) => x.email !== op.email));
                    })
                  }
                >
                  Remover
                </button>
              </span>
            </li>
          ))}
        </ul>
        {handover && (
          <div role="status" className="rounded-lg border-2 border-ok bg-ok/5 p-3 text-sm">
            <p className="font-semibold">Passe para a loja (a senha não aparece de novo):</p>
            <p className="mt-1 font-mono">
              {handover.email}
              <br />
              {handover.password}
            </p>
          </div>
        )}
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await createOperatorAction(props.store.slug, opEmail, opName);
              if (!res.ok || !res.password) return setMsg({ tone: 'bad', text: res.error ?? 'Erro.' });
              setHandover({ email: opEmail.trim().toLowerCase(), password: res.password });
              setOperators((list) => [...list.filter((x) => x.email !== opEmail.trim().toLowerCase()), { email: opEmail.trim().toLowerCase(), name: opName.trim() || opEmail, createdAt: new Date().toISOString() }]);
              setOpEmail('');
              setOpName('');
            });
          }}
        >
          <div className="min-w-40 flex-1">
            <label htmlFor="op-nome" className="label">
              Nome
            </label>
            <input id="op-nome" className="field" value={opName} onChange={(e) => setOpName(e.target.value)} />
          </div>
          <div className="min-w-48 flex-1">
            <label htmlFor="op-email" className="label">
              E-mail
            </label>
            <input id="op-email" type="email" className="field" value={opEmail} onChange={(e) => setOpEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-ghost" disabled={busy}>
            Criar login
          </button>
        </form>
      </section>
    </div>
  );
}

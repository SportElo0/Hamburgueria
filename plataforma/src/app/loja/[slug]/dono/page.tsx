import Link from 'next/link';
import { semSistemaCompleto } from '@/lib/produto-servidor';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { resumoDoDono } from '@/lib/dono';
import { horasComMovimento, variacao, type Kpi } from '@/lib/dono-resumo';
import { brl } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';

export const metadata = { title: 'Resumo geral' };

const TZ = 'America/Sao_Paulo';
const weekday = (day: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long' }).format(new Date(`${day}T12:00:00Z`));
const fullDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;
const minutesAgo = (iso: string, now: number) => Math.max(0, Math.round((now - Date.parse(iso)) / 60000));

function Change({ k, label, money }: { k: Kpi; label: string; money?: boolean }) {
  if (k.before === null) return <p className="mt-1 text-[13px] text-ink-mute">Sem {label} para comparar</p>;
  const v = variacao(k);
  const diff = k.value - k.before;
  if (diff === 0) return <p className="mt-1 text-[13px] font-semibold text-ink-mute">Igual a {label}</p>;
  const up = diff > 0;
  const amount = v !== null && !money ? pct(v) : money ? brl(Math.abs(diff)) : String(Math.abs(diff));
  return (
    <p className={`mt-1 text-[13px] font-semibold ${up ? 'text-ok' : 'text-bad'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {amount} {up ? 'a mais que' : 'a menos que'} {label}
    </p>
  );
}

function Stat({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-[13px] font-semibold text-ink-mute">{title}</p>
      <p className="mt-1 text-[30px] leading-tight font-extrabold tracking-tight tabular-nums">{value}</p>
      {children}
    </div>
  );
}

export default async function ResumoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, DONO);
  await semSistemaCompleto(slug);
  const now = new Date();
  const d = await resumoDoDono(slug, now);
  const r = d.resumo;
  const first = (user.name || '').trim().split(/\s+/)[0];
  const greeting = d.hora < 12 ? 'Bom dia' : d.hora < 18 ? 'Boa tarde' : 'Boa noite';
  const sameDay = r.hoje.diaAntes ? `${weekday(r.hoje.diaAntes).replace('-feira', '')} passada` : 'a semana passada';
  const hours = horasComMovimento(r.porHora);
  const max = Math.max(1, ...hours.map((h) => r.porHora[h]));
  const peaks = new Set([...hours].sort((a, b) => r.porHora[b] - r.porHora[a]).slice(0, 3).filter((h) => r.porHora[h] > 0));
  const base = `/loja/${slug}/dono`;
  const garcom = d.chamados.filter((c) => c.tipo === 'garcom');
  const conta = d.chamados.filter((c) => c.tipo === 'conta');

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {greeting}
          {first ? `, ${first}` : ''}
        </h1>
        <p className="mt-1 text-ink-mute first-letter:uppercase">{fullDate(now)} · vendas pelo site e pelas mesas (QR)</p>
      </header>

      <section aria-label="Números principais" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Vendas hoje" value={brl(r.hoje.vendas.value)}>
          <Change k={r.hoje.vendas} label={sameDay} />
        </Stat>
        <Stat title="Vendas nos últimos 7 dias" value={brl(r.semana.vendas.value)}>
          <Change k={r.semana.vendas} label="os 7 dias antes" />
        </Stat>
        <Stat title="Pedidos hoje" value={String(r.hoje.pedidos.value)}>
          <Change k={r.hoje.pedidos} label={sameDay} />
        </Stat>
        <Stat title="Ticket médio (7 dias)" value={r.semana.ticket.value ? brl(r.semana.ticket.value) : '—'}>
          <Change k={r.semana.ticket} label="os 7 dias antes" money />
        </Stat>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="card min-w-0 p-5" aria-labelledby="pico">
          <h2 id="pico" className="text-[17px] font-bold">
            Horários de pico <span className="font-normal text-ink-mute">(pedidos nos últimos {r.diasNoPico} dias)</span>
          </h2>
          {hours.length === 0 ? (
            <p className="mt-6 text-ink-mute">Ainda sem pedidos nestes dias.</p>
          ) : (
            <>
              <div className="mt-5 flex h-48 items-end gap-1.5" role="img" aria-label={`Mais pedidos às ${[...peaks].sort((a, b) => a - b).map((h) => `${h}h`).join(', ')}`}>
                {hours.map((h) => (
                  <div key={h} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${h}h: ${r.porHora[h]} pedidos`}>
                    <div className={`rounded-t-md ${peaks.has(h) ? 'bg-accent' : 'bg-accent-soft'}`} style={{ height: `${Math.max(3, (r.porHora[h] / max) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
                {hours.map((h, i) => (
                  <span key={h} className={`min-w-0 flex-1 overflow-hidden text-center text-[11px] text-ink-mute tabular-nums ${i % 2 ? 'invisible sm:visible' : ''}`}>
                    {h}h
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card min-w-0 p-5" aria-labelledby="top">
          <h2 id="top" className="text-[17px] font-bold">
            Mais pedidos <span className="font-normal text-ink-mute">(7 dias)</span>
          </h2>
          {r.maisVendidos.length === 0 ? (
            <p className="mt-6 text-ink-mute">Ainda sem pedidos nesta semana.</p>
          ) : (
            <ol className="mt-3 divide-y divide-line">
              {r.maisVendidos.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                  <span className="min-w-0 truncate">
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-bold tabular-nums">{p.quantity}</span>
                </li>
              ))}
              {r.menosVendido && (
                <li className="flex items-center justify-between gap-3 py-2.5 text-[15px] text-bad">
                  <span className="min-w-0 truncate">Menos pedido: {r.menosVendido.name}</span>
                  <span className="font-bold tabular-nums">{r.menosVendido.quantity}</span>
                </li>
              )}
            </ol>
          )}
        </section>
      </div>

      <section aria-label="Avisos" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {d.chamados.length > 0 ? (
          <Link href={`${base}/mesas`} className="card block border-l-4 border-l-bad p-5 hover:border-bad">
            <p className="font-bold">
              {garcom.length > 0 && `${garcom.length} ${garcom.length === 1 ? 'mesa chamando' : 'mesas chamando'} o garçom`}
              {garcom.length > 0 && conta.length > 0 && ' · '}
              {conta.length > 0 && `${conta.length} ${conta.length === 1 ? 'mesa pedindo' : 'mesas pedindo'} a conta`}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{d.chamados.map((c) => `Mesa ${c.mesa} há ${minutesAgo(c.desde, now.getTime())} min`).join(' · ')}</p>
          </Link>
        ) : (
          <Link href={`${base}/mesas`} className="card block border-l-4 border-l-ok p-5 hover:border-ok">
            <p className="font-bold">Nenhuma mesa chamando</p>
            <p className="mt-1 text-sm text-ink-soft">{d.mesasAbertas ? `${d.mesasAbertas} ${d.mesasAbertas === 1 ? 'mesa aberta' : 'mesas abertas'} agora.` : 'Nenhuma mesa aberta agora.'}</p>
          </Link>
        )}

        {d.totalItens === 0 ? (
          <div className="card border-l-4 border-l-accent p-5">
            <p className="font-bold">Cardápio ainda não está no painel</p>
            <p className="mt-1 text-sm text-ink-soft">A Growlift monta o cardápio com você. Depois disso aparecem preços, custos e margens.</p>
          </div>
        ) : d.margemBaixa.length > 0 ? (
          <Link href={`${base}/precos`} className="card block border-l-4 border-l-warn p-5 hover:border-warn">
            <p className="font-bold">
              {d.margemBaixa.length === 1 ? `${d.margemBaixa[0].name} com margem baixa` : `${d.margemBaixa.length} itens com margem baixa`}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {d.margemBaixa
                .slice(0, 3)
                .map((m) => `${m.name}: sobra ${brl(m.lucro)} (${pct(m.taxa)})`)
                .join(' · ')}
              . Veja em Preços e custos.
            </p>
          </Link>
        ) : d.semCusto > 0 ? (
          <Link href={`${base}/precos`} className="card block border-l-4 border-l-accent p-5 hover:border-accent">
            <p className="font-bold">
              {d.semCusto === d.totalItens ? 'Informe quanto custa cada prato' : `${d.semCusto} ${d.semCusto === 1 ? 'item' : 'itens'} sem custo`}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Com o custo, o painel mostra quanto sobra em cada prato e avisa quando a margem fica baixa.</p>
          </Link>
        ) : (
          <Link href={`${base}/precos`} className="card block border-l-4 border-l-ok p-5 hover:border-ok">
            <p className="font-bold">Margens em dia</p>
            <p className="mt-1 text-sm text-ink-soft">Nenhum item com margem abaixo de 30%.</p>
          </Link>
        )}

        {d.esgotados.length > 0 && (
          <Link href={`${base}/precos`} className="card block border-l-4 border-l-ink-mute p-5 hover:border-ink-mute">
            <p className="font-bold">
              {d.esgotados.length} {d.esgotados.length === 1 ? 'item esgotado' : 'itens esgotados'}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{d.esgotados.join(', ')}. O cliente não consegue pedir.</p>
          </Link>
        )}
      </section>
    </div>
  );
}

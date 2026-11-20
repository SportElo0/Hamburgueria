'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { csvDoCrm, type LinhaCrm } from '@/lib/importados';
import { setOptOutAction } from '@/app/loja/[slug]/actions';

const fmtPhone = (p: string) => `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
const fmtDia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(new Date(iso));
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const tempo = (d: number) => (d < 60 ? `${d} dias` : d < 365 ? `${Math.round(d / 30)} meses` : 'mais de 1 ano');

const FILTROS = {
  todos: { label: 'Todos', ok: () => true },
  sumidos: { label: 'Sumidos (1 a 4 meses)', ok: (l: LinhaCrm) => !l.saiu && l.diasParado >= 30 && l.diasParado <= 120 },
  fieis: { label: 'Fiéis (5+ pedidos)', ok: (l: LinhaCrm) => l.orders >= 5 },
  chamados: { label: 'Já chamados', ok: (l: LinhaCrm) => Boolean(l.chamadoEm) },
  sairam: { label: 'Pediram para sair', ok: (l: LinhaCrm) => l.saiu },
} as const;
type Filtro = keyof typeof FILTROS;
const PAGINA = 50;

/** The store's customer list: search, quick filters, export and the "asked to stop" switch. */
export function ClientesCrm(props: { slug: string; storeName: string; linhas: LinhaCrm[]; torpedo: boolean; demo?: { sair: (phone: string, out: boolean) => void; irTorpedo: () => void } }) {
  const [linhas, setLinhas] = useState(props.linhas);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [mostrar, setMostrar] = useState(PAGINA);
  const [erro, setErro] = useState('');
  const [, start] = useTransition();

  const contagem = useMemo(() => Object.fromEntries((Object.keys(FILTROS) as Filtro[]).map((f) => [f, linhas.filter(FILTROS[f].ok).length])) as Record<Filtro, number>, [linhas]);
  const lista = useMemo(() => {
    const q = norm(busca.trim());
    const digitos = busca.replace(/\D/g, '');
    return linhas.filter((l) => FILTROS[filtro].ok(l) && (!q || norm(l.name).includes(q) || (digitos.length >= 3 && l.phone.includes(digitos))));
  }, [linhas, busca, filtro]);

  const exportar = () => {
    const blob = new Blob([csvDoCrm(lista)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-${props.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sair = (l: LinhaCrm, out: boolean) => {
    if (!out && !confirm('Esta pessoa pediu para sair. Só tire daqui se ela mesma pediu para voltar a receber.')) return;
    setErro('');
    setLinhas((all) => all.map((x) => (x.phone === l.phone ? { ...x, saiu: out } : x)));
    if (props.demo) return props.demo.sair(l.phone, out);
    start(async () => {
      const res = await setOptOutAction(props.slug, l.phone, out);
      if (!res.ok) {
        setErro(res.error ?? 'Não foi possível salvar.');
        setLinhas((all) => all.map((x) => (x.phone === l.phone ? { ...x, saiu: !out } : x)));
      }
    });
  };

  return (
    <section className="space-y-4" aria-labelledby="lista">
      <h2 id="lista" className="sr-only">
        Lista de clientes
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Numero titulo="Clientes" valor={contagem.todos} />
        <Numero titulo="Sumidos de 1 a 4 meses" valor={contagem.sumidos} />
        <Numero titulo="Já chamados" valor={contagem.chamados} />
        <Numero titulo="Pediram para sair" valor={contagem.sairam} />
      </div>

      {props.torpedo && contagem.sumidos > 0 && (
        <div className="card flex items-center justify-between gap-3 border-ink/20 p-4">
          <span className="text-sm">
            <b>{contagem.sumidos.toLocaleString('pt-BR')} clientes sumidos</b> que já pediram com você. Vale mandar um torpedo.
          </span>
          {props.demo ? (
            <button type="button" onClick={props.demo.irTorpedo} className="btn-primary min-h-10 shrink-0 px-4 text-sm">
              Preparar torpedo
            </button>
          ) : (
            <Link href={`/loja/${props.slug}/app/torpedo`} className="btn-primary min-h-10 shrink-0 px-4 text-sm">
              Preparar torpedo
            </Link>
          )}
        </div>
      )}

      <div className="card space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="crm-busca" className="sr-only">
            Buscar cliente
          </label>
          <input
            id="crm-busca"
            type="search"
            className="field flex-1"
            placeholder="Buscar por nome ou telefone"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrar(PAGINA);
            }}
          />
          <button type="button" className="btn-ghost min-h-11" onClick={exportar} disabled={!lista.length}>
            Exportar planilha ({lista.length.toLocaleString('pt-BR')})
          </button>
        </div>
        <p className="text-xs text-ink-mute">A planilha exportada tem dados pessoais dos clientes: não envie para outras pessoas e apague do computador quando não precisar. Se alguém responder SAIR no WhatsApp, marque “Pediu para sair”.</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar">
          {(Object.keys(FILTROS) as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filtro === f}
              onClick={() => {
                setFiltro(f);
                setMostrar(PAGINA);
              }}
              className={`min-h-9 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap ${filtro === f ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-ink/40'}`}
            >
              {FILTROS[f].label} <span className="tabular-nums opacity-70">{contagem[f]}</span>
            </button>
          ))}
        </div>

        {lista.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-mute">Ninguém aqui com esse filtro.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lista.slice(0, mostrar).map((l) => (
              <li key={l.phone} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="text-sm text-ink-mute tabular-nums">
                    {fmtPhone(l.phone)} · {l.orders} {l.orders === 1 ? 'pedido' : 'pedidos'} · sem pedir há {tempo(l.diasParado)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {l.chamadoEm && <span className="chip bg-ok/10 text-ok">Torpedo em {fmtDia(l.chamadoEm)}</span>}
                  {l.saiu ? (
                    <>
                      <span className="chip bg-bad/10 text-bad">Pediu para sair</span>
                      <button type="button" className="min-h-9 px-1 text-ink-mute underline" onClick={() => sair(l, false)}>
                        Voltar a receber
                      </button>
                    </>
                  ) : (
                    <button type="button" className="min-h-9 px-1 text-ink-mute underline" onClick={() => sair(l, true)}>
                      Pediu para sair
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {lista.length > mostrar && (
          <button type="button" className="btn-ghost min-h-11 w-full" onClick={() => setMostrar((m) => m + PAGINA * 2)}>
            Mostrar mais ({(lista.length - mostrar).toLocaleString('pt-BR')} restantes)
          </button>
        )}
        {erro && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {erro}
          </p>
        )}
      </div>
    </section>
  );
}

function Numero({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card p-3">
      <p className="text-xs font-semibold text-ink-mute">{titulo}</p>
      <p className="text-2xl font-extrabold tracking-tight tabular-nums">{valor.toLocaleString('pt-BR')}</p>
    </div>
  );
}

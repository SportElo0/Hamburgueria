'use client';

import { useMemo, useState } from 'react';
import { escolher, linhasDoCrm, type Importado } from '@/lib/importados';
import { clientesDemo, iaSimulada, type Demo } from '@/lib/demo-app';
import type { PlanoTorpedo } from '@/lib/torpedo-servidor';
import { ImportarLista } from './ImportarLista';
import { ClientesCrm } from './ClientesCrm';
import { Torpedo } from './Torpedo';

const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** The store's app with everything kept in this browser: same screens the store gets, for showing before they sign. */
export function DemoApp({ demo }: { demo: Demo }) {
  const [aba, setAba] = useState<'clientes' | 'torpedo'>('clientes');
  const [inicio] = useState(() => ({ em: new Date().toISOString(), hoje: hojeSP() }));
  const [lista, setLista] = useState<{ clientes: Importado[]; em: string; fonte: string } | null>(() => ({ clientes: clientesDemo(), em: inicio.em, fonte: 'uma lista de exemplo' }));
  const [enviados, setEnviados] = useState<Record<string, string>>({});
  const [optOuts, setOptOuts] = useState<string[]>([]);
  const [plano, setPlano] = useState<PlanoTorpedo | null>(null);
  const [versao, setVersao] = useState(0);

  const linhas = useMemo(() => (lista ? linhasDoCrm(lista.clientes, { importadoEm: lista.em, optOuts, enviados }) : []), [lista, optOuts, enviados]);
  const escolhidos = useMemo(() => (lista ? escolher(lista.clientes, { importadoEm: lista.em, optOuts, enviados, limite: 200 }) : []), [lista, optOuts, enviados]);
  const resumo = lista ? { fonte: lista.fonte, importadoEm: lista.em, aceitePor: 'demonstração', total: lista.clientes.length, enviadosNoMes: Object.keys(enviados).length } : null;
  const sair = (phone: string, out: boolean) => setOptOuts((o) => (out ? [...new Set([...o, phone])] : o.filter((x) => x !== phone)));
  const irPara = (a: 'clientes' | 'torpedo') => {
    setAba(a);
    setVersao((v) => v + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-dvh bg-paper">
      <div className="bg-ink px-4 py-2 text-center text-xs font-semibold text-white">
        Demonstração feita pela Growlift para o {demo.nome}. Clientes de exemplo e IA simulada: nada aqui é salvo nem enviado.
      </div>
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-4 py-2.5">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-[#0b5c8a] text-lg">
            🐟
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-tight font-bold">{demo.nome}</p>
            <p className="text-xs text-ink-mute">{demo.cidade} · app da loja</p>
          </div>
        </div>
        <nav aria-label="Seções do app" className="mx-auto flex max-w-4xl gap-1 px-4">
          {(['clientes', 'torpedo'] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-current={aba === a ? 'page' : undefined}
              onClick={() => irPara(a)}
              className={`-mb-px min-h-11 border-b-2 px-3 pt-0.5 text-sm font-semibold transition-colors ${aba === a ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}
            >
              {a === 'clientes' ? 'Clientes' : 'Torpedo'}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-5 pb-16">
        {aba === 'clientes' ? (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
              <p className="mt-1 text-sm text-ink-soft">Todos os seus clientes do Anota Aí num lugar só: quem mais pede, quem sumiu e quem já foi chamado.</p>
            </div>
            <ImportarLista
              key={`importar-${lista?.em ?? 'vazio'}-${versao}`}
              slug={demo.slug}
              resumo={resumo}
              demo={{
                importar: (clientes) => setLista({ clientes, em: new Date().toISOString(), fonte: 'Anota Aí (só neste aparelho)' }),
                apagar: () => setLista(null),
              }}
            />
            {linhas.length > 0 && (
              <ClientesCrm key={`crm-${lista?.em}-${versao}`} slug={demo.slug} storeName={demo.nome} linhas={linhas} torpedo demo={{ sair, irTorpedo: () => irPara('torpedo') }} />
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Torpedo</h1>
              <p className="mt-1 text-sm text-ink-soft">Conte o que você quer vender e a IA prepara a mensagem. Depois é só tocar em Enviar: sai do seu WhatsApp, sem custo por mensagem.</p>
            </div>
            <Torpedo
              key={`${lista?.em}-${versao}`}
              slug={demo.slug}
              storeName={demo.nome}
              ia
              hoje={inicio.hoje}
              plano={plano}
              escolhidos={escolhidos}
              temLista={Boolean(lista)}
              clientes
              demo={{
                conversar: async (falas) => {
                  await new Promise((r) => setTimeout(r, 900));
                  return { ok: true, ...iaSimulada(falas, demo) };
                },
                salvar: (p) => setPlano({ ...p, atualizadoEm: new Date().toISOString(), por: 'demonstração' }),
                apagar: () => setPlano(null),
                enviado: (phone) => setEnviados((e) => ({ ...e, [phone]: new Date().toISOString() })),
                sair: (phone) => sair(phone, true),
                irClientes: () => irPara('clientes'),
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

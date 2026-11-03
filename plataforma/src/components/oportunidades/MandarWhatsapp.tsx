'use client';

import { useState, useTransition } from 'react';
import { contatadoAction, naoQuerAction, paginaWhatsappAction } from '@/app/painel/oportunidades/actions';
import type { LinhaWhatsapp } from '@/lib/oportunidades/whatsapp';

type Estado = 'aberto' | 'mandado' | 'ligado' | 'nao-quer';

/**
 * One button, a list of names with their WhatsApp, one tap to open the conversation with the message ready.
 * The person presses send. Each business once; "Não quer" removes it for good.
 */
export function MandarWhatsapp({ fila, custo, liberado }: { fila: number; custo: { chamadas: number; pagas: number; usd: number; gratisRestantes: number }; liberado: boolean }) {
  const [pending, start] = useTransition();
  const [linhas, setLinhas] = useState<LinhaWhatsapp[]>([]);
  const [estado, setEstado] = useState<Record<string, Estado>>({});
  const [erro, setErro] = useState('');
  const [acabou, setAcabou] = useState(false);

  const carregar = () =>
    start(async () => {
      setErro('');
      const r = await paginaWhatsappAction(linhas.map((l) => l.placeId));
      if (!r.ok) return setErro(r.error);
      if (r.dados.length === 0) setAcabou(true);
      setLinhas((x) => [...x, ...r.dados]);
    });
  const marcar = (placeId: string, e: Estado) => {
    setEstado((s) => ({ ...s, [placeId]: e }));
    start(async () => {
      const r = e === 'nao-quer' ? await naoQuerAction(placeId) : await contatadoAction(placeId, e === 'ligado' ? 'ligacao' : 'whatsapp');
      if (!r.ok) {
        setErro(r.error);
        setEstado((s) => ({ ...s, [placeId]: 'aberto' }));
      }
    });
  };

  return (
    <div className="mt-6">
      {linhas.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {linhas.map((l) => {
            const e = estado[l.placeId] ?? 'aberto';
            return (
              <li key={l.placeId} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 ${e !== 'aberto' ? 'opacity-60' : ''}`}>
                <div className="min-w-0">
                  <p className="text-lg font-bold">{l.nome}</p>
                  <p className="text-sm text-ink-mute">{l.telefone || 'Sem telefone no Google'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {e === 'mandado' && <span className="chip bg-ok/10 text-ok">Mensagem mandada</span>}
                  {e === 'ligado' && <span className="chip bg-ok/10 text-ok">Ligação feita</span>}
                  {e === 'nao-quer' && <span className="chip bg-line text-ink-mute">Não contatar</span>}
                  {e === 'aberto' && (
                    <>
                      {l.whatsapp ? (
                        <a className="btn-primary min-h-11 px-4" href={l.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => marcar(l.placeId, 'mandado')}>
                          Abrir WhatsApp
                        </a>
                      ) : l.telefone ? (
                        <a className="btn-primary min-h-11 px-4" href={`tel:${l.telefone.replace(/\D/g, '')}`} onClick={() => marcar(l.placeId, 'ligado')}>
                          Ligar (fixo)
                        </a>
                      ) : (
                        <a className="btn-ghost min-h-11 px-4" href={l.maps} target="_blank" rel="noopener noreferrer">
                          Ver no Maps
                        </a>
                      )}
                      <button type="button" className="btn-ghost min-h-11 px-3 text-ink-mute" disabled={pending} onClick={() => marcar(l.placeId, 'nao-quer')}>
                        Não quer
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!acabou && linhas.length < fila && (
        <div className="mt-4">
          <button type="button" className="btn-primary min-h-12 px-6 text-base" disabled={pending || !liberado} onClick={carregar}>
            {pending ? 'Buscando…' : linhas.length ? 'Mostrar mais 10' : `Mostrar os restaurantes (${fila})`}
          </button>
          <p className="mt-1 text-xs text-ink-mute">
            1 consulta ao Google por restaurante mostrado ({custo.pagas === 0 ? `grátis: ainda restam ${custo.gratisRestantes} no mês` : `estes ${custo.chamadas}: US$ ${custo.usd.toFixed(2)}`}). Nome
            e telefone só aparecem na tela; nada fica guardado.
          </p>
        </div>
      )}
      {(acabou || (fila === 0 && linhas.length === 0)) && <p className="mt-4 text-ink-mute">Ninguém mais na fila. Faça uma nova pesquisa em Oportunidades.</p>}
      {erro && (
        <p role="alert" className="mt-3 font-semibold text-bad">
          {erro}
        </p>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { enviarModeloAcao } from '@/app/acoes';
import { Enviar, Formulario } from './formulario';

export interface ModeloParaEnviar {
  nome: string;
  titulo: string;
  texto: string;
  campos: string[];
}

/** Fills {{1}}, {{2}}... the way the customer will read it (same rule as the server). */
const montar = (texto: string, valores: string[]) => texto.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => valores[Number(n) - 1]?.trim() || `[${n}]`);

/** A sensible first value for a field, from its name: the customer's first name, the company's name. */
function sugestao(rotulo: string, contato: string, empresa: string): string {
  if (/empresa|pousada|hotel|loja|restaurante/i.test(rotulo)) return empresa;
  if (/nome|cliente|h[óo]spede/i.test(rotulo)) return contato.trim().split(/\s+/)[0] ?? '';
  return '';
}

/**
 * A person of the team sends an approved WhatsApp template: picks it, fills the fields, reads the exact message and sends.
 * The server checks consent, opt-out, the number and the 24 hours again; the queue then shows the delivery.
 */
export function EnviarModelo({
  modelos,
  oportunidadeId,
  conversaId,
  contato,
  empresa,
  podeSeguirRetomada,
  avisoRetomada,
}: {
  modelos: ModeloParaEnviar[];
  oportunidadeId?: string;
  conversaId?: string;
  contato: string;
  empresa: string;
  /** The opportunity is before "Proposta enviada": offer to move it and let the follow-up run. */
  podeSeguirRetomada: boolean;
  /** Why the follow-up would not go out (the conversation is with a person), if that is the case. */
  avisoRetomada?: string | null;
}) {
  const [escolhido, setEscolhido] = useState(modelos[0]?.nome ?? '');
  const m = modelos.find((x) => x.nome === escolhido) ?? modelos[0];
  const [valores, setValores] = useState<Record<string, string[]>>({});
  const atuais = useMemo(() => (m ? valores[m.nome] ?? m.campos.map((c) => sugestao(c, contato, empresa)) : []), [m, valores, contato, empresa]);
  const [seguir, setSeguir] = useState(true);
  if (!m) return null;
  const mudar = (i: number, v: string) => setValores((x) => ({ ...x, [m.nome]: atuais.map((a, j) => (j === i ? v : a)) }));
  return (
    <Formulario acao={enviarModeloAcao} className="mt-3 space-y-3">
      {oportunidadeId && <input type="hidden" name="oportunidade" value={oportunidadeId} />}
      {conversaId && <input type="hidden" name="conversa" value={conversaId} />}
      {modelos.length > 1 ? (
        <div>
          <label className="rotulo" htmlFor="em-modelo">Modelo aprovado</label>
          <select className="campo" id="em-modelo" name="modelo" value={m.nome} onChange={(e) => setEscolhido(e.target.value)}>
            {modelos.map((x) => <option key={x.nome} value={x.nome}>{x.titulo}</option>)}
          </select>
        </div>
      ) : (
        <input type="hidden" name="modelo" value={m.nome} />
      )}
      {m.campos.map((c, i) => (
        <div key={`${m.nome}-${i}`}>
          <label className="rotulo" htmlFor={`em-c${i}`}>{c}</label>
          <input className="campo" id={`em-c${i}`} name={`campo_${i}`} value={atuais[i] ?? ''} onChange={(e) => mudar(i, e.target.value)} required maxLength={300} autoComplete="off" />
        </div>
      ))}
      <div>
        <p className="rotulo">Como o cliente vai ler</p>
        <p className="whitespace-pre-wrap rounded-2xl border border-linha bg-fundo px-3.5 py-2.5 text-[15px]">{montar(m.texto, atuais)}</p>
      </div>
      {podeSeguirRetomada && (
        <div className="space-y-2 rounded-xl border border-linha p-3">
          <label className="flex items-start gap-3 text-[15px]">
            <input type="checkbox" name="retomada" checked={seguir} onChange={(e) => setSeguir(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#175cd3]" />
            <span>
              É o orçamento: mover para “Proposta enviada” e deixar a retomada automática seguir se o cliente não responder
              <span className="block text-sm text-suave">Sem marcar, você assume a conversa e as mensagens automáticas param.</span>
            </span>
          </label>
          {seguir && (
            <div>
              <label className="rotulo" htmlFor="em-valor">Valor do orçamento em reais (opcional)</label>
              <input className="campo" id="em-valor" name="valor" inputMode="decimal" placeholder="3.200,00" />
            </div>
          )}
          {seguir && avisoRetomada && <p className="text-sm text-alerta">{avisoRetomada}</p>}
        </div>
      )}
      <Enviar>Enviar pelo WhatsApp</Enviar>
    </Formulario>
  );
}

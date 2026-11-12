import { NOME_CONDICAO, descreverGatilho, type GatilhoFluxo, type Passo } from '@/server/fluxos';

const ICONE: Record<Passo['tipo'], string> = { esperar: '⏱', parar_se: '■', se: '◆', ir_para: '↪', enviar_whatsapp: '✉', criar_tarefa: '☑', avisar_equipe: '🔔', anotar: '✎' };
const COR: Record<Passo['tipo'], string> = {
  esperar: 'border-linha bg-fundo',
  parar_se: 'border-erro/30 bg-erro-clara',
  se: 'border-alerta/40 bg-alerta-clara',
  ir_para: 'border-linha bg-fundo',
  enviar_whatsapp: 'border-ok/30 bg-ok-clara',
  criar_tarefa: 'border-marca/30 bg-marca-clara',
  avisar_equipe: 'border-marca/30 bg-marca-clara',
  anotar: 'border-linha bg-white',
};

function texto(p: Passo): { titulo: string; detalhe?: string } {
  switch (p.tipo) {
    case 'esperar': return { titulo: p.minutos % 1440 === 0 && p.minutos ? `Esperar ${p.minutos / 1440} dia(s)` : p.minutos % 60 === 0 && p.minutos ? `Esperar ${p.minutos / 60} hora(s)` : `Esperar ${p.minutos} min` };
    case 'parar_se': return { titulo: 'Parar o fluxo se…', detalhe: NOME_CONDICAO[p.condicao] };
    case 'se': return { titulo: 'Se…', detalhe: NOME_CONDICAO[p.condicao] };
    case 'ir_para': return { titulo: p.passo ? `Ir para o passo ${p.passo}` : 'Terminar o fluxo' };
    case 'enviar_whatsapp': return { titulo: `Enviar WhatsApp${p.modelo ? ` (modelo ${p.modelo})` : ''}`, detalhe: p.texto };
    case 'criar_tarefa': return { titulo: 'Criar tarefa', detalhe: `${p.titulo}${p.prazo_horas ? ` · prazo ${p.prazo_horas} h` : ''}` };
    case 'avisar_equipe': return { titulo: 'Avisar a equipe', detalhe: p.titulo };
    case 'anotar': return { titulo: 'Anotar no histórico', detalhe: p.texto };
  }
}

const Ligacao = ({ rotulo }: { rotulo?: string }) => (
  <div aria-hidden className="flex flex-col items-center py-0.5">
    <span className="h-3 w-0.5 bg-[#b8c2d1]" />
    {rotulo && <span className="my-0.5 rounded bg-white px-1.5 text-[11.5px] font-semibold text-suave">{rotulo}</span>}
    <span className="h-3 w-0.5 bg-[#b8c2d1]" />
    <span className="-mt-1 text-[10px] leading-none text-[#8a96a8]">▼</span>
  </div>
);

/** The flow drawn as connected boxes: the trigger on top, each step below, and where every branch or stop leads. */
export function DiagramaFluxo({ gatilho, passos }: { gatilho: GatilhoFluxo; passos: Passo[] }) {
  return (
    <figure aria-label="Desenho do fluxo" className="mx-auto max-w-md">
      <div className="rounded-full border-2 border-marca bg-white px-4 py-2 text-center text-[14.5px] font-bold text-marca-escura">⚡ {descreverGatilho(gatilho)}</div>
      {passos.map((p, i) => {
        const t = texto(p);
        const desvio = p.tipo === 'se' ? (p.ir_para ? `Sim → passo ${p.ir_para}` : 'Sim → fim') : p.tipo === 'parar_se' ? 'Sim → para aqui' : null;
        return (
          <div key={i}>
            <Ligacao rotulo={passos[i - 1]?.tipo === 'se' || passos[i - 1]?.tipo === 'parar_se' ? 'Não' : undefined} />
            <div className={`relative rounded-xl border p-3 ${COR[p.tipo]}`}>
              <p className="flex items-start gap-2 text-[14.5px] font-semibold text-tinta">
                <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-suave ring-1 ring-linha">{i + 1}</span>
                <span><span aria-hidden className="mr-1">{ICONE[p.tipo]}</span>{t.titulo}</span>
              </p>
              {t.detalhe && <p className="mt-1 line-clamp-3 pl-8 text-[13.5px] text-texto">{t.detalhe}</p>}
              {desvio && <p className="mt-2 pl-8"><span className={`etiqueta ${p.tipo === 'parar_se' ? 'etiqueta-erro' : 'etiqueta-alerta'}`}>{desvio}</span></p>}
            </div>
            {p.tipo === 'ir_para' && i < passos.length - 1 && <p className="py-1 text-center text-[12px] text-suave">(o passo {i + 2} só roda se outro passo pular para ele)</p>}
          </div>
        );
      })}
      <Ligacao />
      <div className="rounded-full border border-linha bg-fundo px-4 py-1.5 text-center text-[13.5px] font-semibold text-suave">Fim</div>
    </figure>
  );
}

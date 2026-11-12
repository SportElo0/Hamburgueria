import { NOME_ESTADO, NOME_ETAPA, type EstadoConversa, type Etapa } from '@/server/config';

const COR_ETAPA: Record<Etapa, string> = { novo: 'etiqueta-alerta', atendimento: 'etiqueta-azul', qualificado: 'etiqueta-azul', proposta: 'etiqueta-azul', negociacao: 'etiqueta-azul', ganho: 'etiqueta-ok', perdido: 'etiqueta-erro' };
export const EtiquetaEtapa = ({ etapa }: { etapa: Etapa }) => <span className={`etiqueta ${COR_ETAPA[etapa]}`}>{NOME_ETAPA[etapa]}</span>;

const COR_ESTADO: Record<EstadoConversa, string> = { ia_ativa: 'etiqueta-azul', aguardando_humano: 'etiqueta-alerta', humano_atendendo: 'etiqueta-ok', encerrada: '' };
export const EtiquetaEstado = ({ estado }: { estado: EstadoConversa }) => <span className={`etiqueta ${COR_ESTADO[estado]}`}>{NOME_ESTADO[estado]}</span>;

export function Vazio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="cartao p-8 text-center">
      <p className="font-semibold text-tinta">{titulo}</p>
      {children && <div className="mt-1 text-[15px] text-suave">{children}</div>}
    </div>
  );
}

export const ESTADO_MENSAGEM: Record<string, string> = { recebida: '', na_fila: 'na fila', enviando: 'enviando', enviada: 'enviada', entregue: 'entregue', lida: 'lida', falhou: 'não enviada', incerta: 'sem confirmação de envio', cancelada: 'cancelada' };

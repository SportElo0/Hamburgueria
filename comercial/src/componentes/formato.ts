const FUSO = 'America/Sao_Paulo';
export const dataHora = (d: Date | string | null) => (d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: FUSO }).format(new Date(d)) : '—');
export const dia = (d: Date | string | null) => (d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO }).format(new Date(d)) : '—');
export const reais = (centavos: number | string | null) => (centavos == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(centavos) / 100));
export function minutos(m: number | null): string {
  if (m == null) return '—';
  if (m < 1) return 'menos de 1 min';
  if (m < 90) return `${Math.round(m)} min`;
  if (m < 48 * 60) return `${(m / 60).toFixed(1).replace('.', ',')} h`;
  return `${Math.round(m / 1440)} dias`;
}
/** Value for an <input type="datetime-local"> in São Paulo time. */
export function paraCampoData(d: Date | null): string {
  if (!d) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: FUSO }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
/** Reads a datetime-local value as São Paulo time (UTC-3, no daylight saving since 2019). */
export function deCampoData(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return null;
  const d = new Date(`${v.slice(0, 16)}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const ORIGENS: Record<string, string> = { site: 'Site', formulario_incorporado: 'Formulário no site do cliente', api: 'Integração', whatsapp: 'WhatsApp', chat_site: 'Chat do site', ligacao: 'Ligação não atendida', desconhecida: 'Não informada' };
export const NOME_EVENTO: Record<string, string> = {
  pedido_recebido: 'Pedido recebido',
  ligacao_nao_atendida: 'Ligação não atendida',
  visita_marcada: 'Visita marcada',
  limpeza_automatica: 'Limpeza automática de dados',
  investimento_informado: 'Gasto de anúncio informado',
  visita_alterada: 'Visita alterada',
  etapa_alterada: 'Etapa alterada',
  responsavel_alterado: 'Responsável alterado',
  proxima_acao_definida: 'Próxima ação definida',
  anotacao: 'Anotação',
  valor_informado: 'Valor da proposta informado',
  servico_concluido: 'Serviço marcado como concluído',
  link_avaliacao_gerado: 'Link de avaliação gerado',
  conversa_assumida: 'Uma pessoa assumiu a conversa',
  conversa_devolvida_ia: 'Conversa devolvida para a assistente',
  conversa_encerrada: 'Conversa encerrada',
  conversa_encaminhada: 'Conversa encaminhada para uma pessoa',
  mensagem_humana: 'Mensagem enviada por uma pessoa',
  ia_respondeu: 'A assistente respondeu',
  ia_falhou: 'A assistente falhou',
  resposta_ia_descartada: 'Resposta da assistente descartada',
  dados_coletados: 'A assistente anotou dados',
  interesse_visita: 'Interesse em visita',
  pedido_de_interrupcao: 'Contato pediu para não receber mensagens',
  alerta_sem_atendimento: 'Alerta: pedido sem atendimento no prazo',
  envio_automatico_confirmacao: 'Confirmação automática enviada',
  envio_automatico_retorno: 'Retorno automático enviado',
  envio_automatico_avaliacao: 'Convite de avaliação enviado',
  acesso_admin_growlift: 'Acesso da equipe Growlift',
};

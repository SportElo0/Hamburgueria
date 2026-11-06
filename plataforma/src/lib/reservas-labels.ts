/** Booking states and their names, shared by server and screens (no server-only code here). */
export const RESERVATION_STATUSES = ['aguardando-pix', 'confirmada', 'chegou', 'concluida', 'cancelada', 'nao-veio', 'expirada'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_LABEL: Record<ReservationStatus, string> = {
  'aguardando-pix': 'Aguardando o Pix do sinal',
  confirmada: 'Confirmada',
  chegou: 'Chegou',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  'nao-veio': 'Não veio',
  expirada: 'Pix não pago',
};

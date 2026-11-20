import { SOLD_STATUSES, type Order, type PaymentMethod } from './ordering';

/**
 * Fechamento do dia: quanto entrou em Pix, cartão e dinheiro, por canal, com taxa de serviço e couvert das mesas
 * fechadas, e o que ainda está em aberto. Puro: quem chama lê os pedidos do dia e as mesas fechadas no dia.
 */

export interface MesaFechada {
  total: number;
  servico?: number;
  couvert?: number;
  credit: number;
}

export interface Fechamento {
  dia: string;
  /** Pedidos vendidos já pagos, por forma de pagamento (centavos). */
  porForma: Record<PaymentMethod, { pedidos: number; valor: number }>;
  /** Total dos pedidos vendidos já pagos. */
  recebido: number;
  /** Pedidos vendidos por canal (pagos ou não). */
  porCanal: Record<'entrega' | 'retirada' | 'mesa', { pedidos: number; valor: number }>;
  /** Taxa de serviço e couvert cobrados nas mesas fechadas no dia (fora do valor dos pedidos). */
  servico: number;
  couvert: number;
  /** Sinais de reserva abatidos nas contas fechadas (já pagos antes). */
  sinais: number;
  descontos: number;
  entregas: number;
  /** Pedidos ainda sem pagamento: mesa aberta, cartão/dinheiro na entrega, Pix não confirmado. */
  emAberto: { pedidos: number; valor: number };
  recusados: number;
  devolvidos: { pedidos: number; valor: number };
}

const vazio = () => ({ pedidos: 0, valor: 0 });

export function fecharDia(dia: string, pedidos: Order[], mesas: MesaFechada[]): Fechamento {
  const f: Fechamento = {
    dia,
    porForma: { pix: vazio(), cartao: vazio(), dinheiro: vazio() },
    recebido: 0,
    porCanal: { entrega: vazio(), retirada: vazio(), mesa: vazio() },
    servico: 0,
    couvert: 0,
    sinais: 0,
    descontos: 0,
    entregas: 0,
    emAberto: vazio(),
    recusados: 0,
    devolvidos: vazio(),
  };
  for (const o of pedidos) {
    if (o.status === 'recusado' || o.status === 'expirado') {
      f.recusados += o.status === 'recusado' ? 1 : 0;
      continue;
    }
    if (o.payment.status === 'devolvido' || o.payment.status === 'devolver') {
      f.devolvidos.pedidos++;
      f.devolvidos.valor += o.total;
      continue;
    }
    // Mesa: o que foi para a cozinha já é consumo, mesmo antes de a cozinha aceitar.
    const vendido = SOLD_STATUSES.includes(o.status) || (o.mode === 'mesa' && o.status === 'novo');
    if (!vendido) continue;
    const canal = f.porCanal[o.mode as 'entrega' | 'retirada' | 'mesa'];
    if (canal) {
      canal.pedidos++;
      canal.valor += o.total;
    }
    f.descontos += o.discount;
    f.entregas += o.deliveryFee;
    // Pago na entrega ou no balcão: o sistema não marca como pago; concluído quer dizer que o dinheiro entrou.
    if (o.payment.status === 'pago' || (o.payment.status === 'na-entrega' && o.status === 'concluido')) {
      f.porForma[o.payment.method].pedidos++;
      f.porForma[o.payment.method].valor += o.total;
      f.recebido += o.total;
    } else {
      f.emAberto.pedidos++;
      f.emAberto.valor += o.total;
    }
  }
  for (const m of mesas) {
    f.servico += m.servico ?? 0;
    f.couvert += m.couvert ?? 0;
    f.sinais += m.credit;
  }
  return f;
}

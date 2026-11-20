import type { Metadata } from 'next';
import { OrderTracking } from '@/components/order/OrderTracking';

export const metadata: Metadata = {
  title: 'Seu pedido · El Patron Burger',
  robots: { index: false, follow: false },
};

export default function PedidoPage() {
  return <OrderTracking />;
}

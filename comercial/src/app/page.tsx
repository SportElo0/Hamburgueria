import { redirect } from 'next/navigation';
import { sessao } from '@/server/sessao';

export default async function Inicio() {
  const s = await sessao();
  redirect(!s ? '/login' : s.ctx ? '/painel' : s.adminPlataforma ? '/admin' : '/login?sem=empresa');
}

import { notFound } from 'next/navigation';
import { ChatSite } from '@/componentes/chat-site';
import { empresaPorChave } from '@/server/empresas';

export const metadata = { title: 'Chat' };

/** The chat alone, opened by /chat.js inside the company's own site (in an iframe, so its styles never mix with the site's). */
export default async function ChatIncorporado({ params }: { params: Promise<{ chave: string }> }) {
  const empresa = await empresaPorChave((await params).chave);
  if (!empresa || !empresa.config.ia.ativa) notFound();
  const base = process.env.APP_URL ?? '';
  return (
    <main className="h-dvh bg-white">
      <ChatSite chave={empresa.chave_publica} empresa={empresa.nome} atendente={empresa.config.ia.nome} linkPrivacidade={`${base}/s/${empresa.slug}/privacidade`} flutuante={false} aberto incorporado />
    </main>
  );
}

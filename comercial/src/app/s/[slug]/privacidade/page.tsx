import Link from 'next/link';
import { notFound } from 'next/navigation';
import { empresaPorSlug } from '@/server/empresas';

export const metadata = { title: 'Privacidade' };

export default async function Privacidade({ params }: { params: Promise<{ slug: string }> }) {
  const empresa = await empresaPorSlug((await params).slug);
  if (!empresa) notFound();
  const s = empresa.config.site;
  return (
    <main className="mx-auto max-w-2xl bg-white px-4 py-10">
      <p className="text-sm"><Link className="underline" href={`/s/${empresa.slug}`}>← {empresa.nome}</Link></p>
      <h1 className="mt-3 text-3xl font-bold">Privacidade</h1>
      {s.privacidade ? (
        <div className="mt-4 whitespace-pre-wrap text-[17px] leading-relaxed">{s.privacidade}</div>
      ) : (
        <p className="mt-4 text-[17px]">A {empresa.nome} ainda não publicou o texto da sua política de privacidade.</p>
      )}
      <h2 className="mt-8 text-xl font-bold">Quem trata seus dados</h2>
      <p className="mt-3 text-[17px]">O controlador dos dados é a {s.razao_social || empresa.nome}{s.cnpj ? ` (CNPJ ${s.cnpj})` : ''}. A plataforma que guarda os dados e faz o atendimento é operada pela Growlift, em nome da empresa. O atendimento por assistente virtual usa um serviço de inteligência artificial de empresa terceira, que pode processar o texto da conversa em servidores fora do Brasil. As mensagens de WhatsApp passam pela plataforma da Meta.</p>
      <h2 className="mt-8 text-xl font-bold">O que este site guarda quando você pede um orçamento</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-[17px]">
        <li>Os dados que você escreve no formulário ou no chat: nome, telefone, cidade e a descrição do que precisa.</li>
        <li>Se você marcou a autorização, o texto que aceitou, a data e por onde aceitou, para falar com você pelo WhatsApp.</li>
        <li>De qual anúncio ou página você veio, quando o endereço traz essa informação.</li>
        <li>O histórico do atendimento: etapas, anotações e mensagens trocadas.</li>
      </ul>
      <p className="mt-3 text-[17px]">Usamos esses dados para responder e acompanhar o seu pedido. Não pedimos CPF, documentos, dados bancários nem endereço completo nesta etapa. Para parar de receber mensagens, responda SAIR.</p>
      <h2 className="mt-8 text-xl font-bold">Seus direitos</h2>
      <p className="mt-3 text-[17px]">Você pode pedir acesso, correção ou exclusão dos seus dados e revogar a autorização quando quiser (LGPD, art. 18). {(s.responsavel_dados || s.email) ? `Fale com: ${s.responsavel_dados || s.email}.` : 'A empresa ainda não informou o canal para esses pedidos.'}</p>
    </main>
  );
}

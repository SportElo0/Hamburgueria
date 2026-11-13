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
        <li>Se você marcou a autorização (ou apertou 1 no menu de uma ligação), o texto que aceitou, a data e por onde aceitou, para falar com você pelo WhatsApp.</li>
        <li>De qual anúncio ou página você veio, quando o endereço traz essa informação.</li>
        <li>O histórico do atendimento: etapas, anotações e mensagens trocadas.</li>
      </ul>
      <p className="mt-3 text-[17px]">Usamos esses dados para responder e acompanhar o seu pedido. Não pedimos CPF, documentos nem dados bancários, e o endereço completo só quando uma visita é marcada. Para parar de receber mensagens, responda SAIR.</p>
      <h2 className="mt-8 text-xl font-bold">Quando você marca uma visita</h2>
      <p className="mt-3 text-[17px]">Guardamos o dia e o horário da visita, o endereço e as observações combinadas com você. Esses dados aparecem na agenda da equipe e podem ser exibidos no Google Agenda de quem está na equipe (só o primeiro nome e o endereço), serviço de empresa terceira que pode guardar os dados em servidores fora do Brasil. O lembrete pelo WhatsApp um dia antes só é enviado se você respondeu SIM quando perguntamos, pediu à equipe ou autorizou no formulário; para parar, responda SAIR.</p>
      <h2 className="mt-8 text-xl font-bold">Quando você recebe uma proposta pelo link</h2>
      <p className="mt-3 text-[17px]">Guardamos quando o link foi aberto e quantas vezes, e a sua resposta. Se você aceitar, guardamos o nome digitado, a data e a hora, um código do seu acesso (não o endereço da internet em si) e o navegador, só para comprovar o aceite, enquanto durar a relação com a empresa e o prazo legal depois dela. Se recusar, guardamos o motivo que você escrever. Usamos isso para atender o seu pedido e formar o contrato, se você aceitar.</p>
      <h2 className="mt-8 text-xl font-bold">Quando você liga e ninguém atende</h2>
      <p className="mt-3 text-[17px]">Guardamos o número de quem ligou, a data e a hora da ligação e se você apertou 1 para receber nosso retorno pelo WhatsApp. Usamos isso para retornar a sua ligação. A mensagem pelo WhatsApp só é enviada se você apertou 1 naquela ligação ou já tinha autorizado antes; para parar, responda SAIR. As ligações passam por um serviço de telefonia contratado pela empresa, que atua em nome dela.</p>
      <h2 className="mt-8 text-xl font-bold">Por quanto tempo guardamos</h2>
      <p className="mt-3 text-[17px]">{empresa.config.dados.guarda_meses > 0 ? `Se você não fechar negócio, seus dados são apagados automaticamente depois de ${empresa.config.dados.guarda_meses} meses sem nenhum contato (pedido, conversa, ligação ou visita).` : 'Os dados de quem não fechou negócio são guardados até você pedir a exclusão.'} De quem é cliente, guardamos o necessário para o serviço, a garantia e as obrigações legais.</p>
      <h2 className="mt-8 text-xl font-bold">Seus direitos</h2>
      <p className="mt-3 text-[17px]">Você pode pedir acesso, correção ou exclusão dos seus dados e revogar a autorização quando quiser (LGPD, art. 18). {(s.responsavel_dados || s.email) ? `Fale com: ${s.responsavel_dados || s.email}.` : 'A empresa ainda não informou o canal para esses pedidos.'}</p>
    </main>
  );
}

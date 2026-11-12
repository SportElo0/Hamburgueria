import { notFound } from 'next/navigation';
import { FormularioPedido } from '@/componentes/formulario-pedido';
import { TEXTO_CONSENTIMENTO_WHATSAPP } from '@/server/config';
import { empresaPorChave } from '@/server/empresas';

export const metadata = { title: 'Pedir orçamento' };

/** The form alone, to be placed inside the company's existing site with an <iframe>. */
export default async function Incorporar({ params }: { params: Promise<{ chave: string }> }) {
  const empresa = await empresaPorChave((await params).chave);
  if (!empresa) notFound();
  const base = process.env.APP_URL ?? '';
  return (
    <main className="bg-white p-4">
      {empresa.demonstracao && <p className="mb-3 rounded-md bg-alerta-clara px-3 py-1.5 text-[13px] text-alerta">Formulário de demonstração · empresa fictícia</p>}
      <FormularioPedido chave={empresa.chave_publica} empresa={empresa.nome} campos={empresa.config.campos} textoConsentimento={TEXTO_CONSENTIMENTO_WHATSAPP(empresa.nome)} linkPrivacidade={`${base}/s/${empresa.slug}/privacidade`} origem="formulario_incorporado" />
    </main>
  );
}

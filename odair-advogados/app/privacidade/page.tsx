import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHead } from "@/components/page-head";
import { DraftNote, Pending } from "@/components/pending";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Como o site do escritório ${site.name} trata os dados enviados pelo formulário de contato.`,
  alternates: { canonical: "/privacidade" },
};

const sections = [
  {
    title: "Quais dados são coletados",
    body: [
      "O formulário de contato pede apenas nome, um e-mail ou telefone para retorno, a área de interesse (opcional) e uma mensagem breve.",
      "O site não pede documentos, números de processo nem dados sensíveis, e recomenda que eles não sejam enviados por aqui.",
    ],
  },
  {
    title: "Para que os dados são usados",
    body: [
      "Exclusivamente para responder ao contato recebido. Os dados não são usados para publicidade, não são vendidos e não são compartilhados com terceiros para outras finalidades.",
    ],
  },
  {
    title: "Armazenamento e segurança",
    body: [
      "Nesta versão de demonstração, o formulário apenas confere os campos e não envia nem armazena nenhuma informação.",
      "Quando o envio for ativado, os dados serão transmitidos por conexão segura e guardados somente pelo tempo necessário para o atendimento, com acesso restrito à equipe do escritório.",
    ],
  },
  {
    title: "Cookies e medição",
    body: [
      "O site não usa cookies de publicidade nem ferramentas de rastreamento. Se algum recurso de medição de audiência for adotado, esta política será atualizada antes.",
    ],
  },
  {
    title: "Seus direitos",
    body: [
      "Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode pedir a confirmação do tratamento, o acesso, a correção ou a exclusão dos seus dados, entre outros direitos.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <PageHead
        trail={[{ href: "/", label: "Início" }, { label: "Política de privacidade" }]}
        title="Política de privacidade"
        lead={<p>Como este site trata os dados enviados pelo formulário de contato, em linguagem simples.</p>}
      />
      <div className="bg-ivory">
        <div className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="max-w-[68ch]">
            <DraftNote>Minuta para revisão do escritório antes da publicação oficial.</DraftNote>
            <div className="mt-10 space-y-12">
              {sections.map((section) => (
                <section key={section.title} aria-labelledby={`pp-${section.title}`}>
                  <h2 id={`pp-${section.title}`} className="display text-[clamp(1.6rem,2.6vw,2.1rem)] text-navy">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed text-graphite">
                    {section.body.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
              <section aria-labelledby="pp-controlador">
                <h2 id="pp-controlador" className="display text-[clamp(1.6rem,2.6vw,2.1rem)] text-navy">
                  Contato sobre privacidade
                </h2>
                <dl className="mt-4 border-t border-navy text-[1rem]">
                  <div className="flex flex-col gap-1 border-b border-line-strong py-3.5 sm:flex-row sm:gap-6">
                    <dt className="w-40 flex-none text-muted">Responsável</dt>
                    <dd className="text-navy">{site.name}</dd>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-line-strong py-3.5 sm:flex-row sm:gap-6">
                    <dt className="w-40 flex-none text-muted">E-mail</dt>
                    <dd className="text-navy">{site.email ?? <Pending label="a confirmar" />}</dd>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-line-strong py-3.5 sm:flex-row sm:gap-6">
                    <dt className="w-40 flex-none text-muted">Encarregado (DPO)</dt>
                    <dd className="text-navy">
                      <Pending label="a definir" />
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

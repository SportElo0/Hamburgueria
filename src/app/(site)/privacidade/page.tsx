import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidade e uso de imagens",
  description: "Como a Mercantil trata dados de contato, fotos enviadas e simulações do Mercantil Vision.",
};

export default function PrivacidadePage() {
  const days = Number(process.env.VISION_RETENTION_DAYS ?? 90);
  return (
    <article className="on-paper pt-[calc(var(--nav-h)+4rem)] pb-28">
      <div className="wrap max-w-[48rem]">
        <h1 className="h-page">Privacidade e uso de imagens</h1>
        <p className="caption text-soft mt-4">Versão provisória, sujeita à revisão jurídica da Mercantil.</p>
        <div className="mt-12 space-y-10 text-[1.0625rem] leading-relaxed">
          <section>
            <h2 className="h-sub">Formulários de contato</h2>
            <p className="text-soft mt-3">
              Nome, WhatsApp e mensagem só são guardados quando você marca a autorização de contato. Eles são usados apenas
              para responder à sua solicitação e são apagados automaticamente após {days} dias, ou antes, a pedido.
            </p>
          </section>
          <section>
            <h2 className="h-sub">Mercantil Vision</h2>
            <p className="text-soft mt-3">
              Para gerar uma simulação, a foto que você envia é processada no servidor (os metadados da imagem, como
              localização, são removidos) e enviada ao provedor de inteligência artificial configurado (OpenAI) apenas para
              produzir a simulação. A Mercantil não guarda a foto nem o resultado depois da geração.
            </p>
            <p className="text-soft mt-3">
              A foto original e a simulação só são armazenadas se você enviar uma solicitação de avaliação e marcar a
              autorização específica para imagens. Nesse caso, ficam acessíveis apenas à Mercantil e são apagadas após {days} dias.
            </p>
            <p className="text-soft mt-3">
              Gerar uma simulação não exige nome nem telefone. As simulações são conceituais: não representam um trabalho
              executado, e o resultado real depende de avaliação técnica.
            </p>
          </section>
          <section>
            <h2 className="h-sub">Fotografias do site</h2>
            <p className="text-soft mt-3">
              Fotografias reais são identificadas com um quadrado cheio; ilustrações e simulações, com um quadrado vazado.
              Placas de veículos são ocultadas antes da publicação.
            </p>
          </section>
          <section>
            <h2 className="h-sub">Seus direitos</h2>
            <p className="text-soft mt-3">
              Você pode pedir a exclusão dos seus dados a qualquer momento pelos canais de contato da Mercantil.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}

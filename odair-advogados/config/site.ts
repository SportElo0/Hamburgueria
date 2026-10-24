/**
 * Dados institucionais do escritório. Tudo o que o site mostra sobre o
 * escritório sai daqui. Campos `null` estão PENDENTES: o site não inventa
 * nada e mostra "a confirmar" (ou esconde o botão) até o dado ser informado.
 *
 * Antes de publicar oficialmente: preencha os campos com dados confirmados
 * pelo Dr. Odair, mude `demo` para `false` e libere a indexação (README).
 */

export type Phone = { e164: string; display: string };

export type Address = {
  street: string;
  district?: string;
  city: string;
  state: string;
  zip?: string;
};

export const site = {
  name: "Odair Alves da Silva & Advogados",
  shortName: "Odair Alves da Silva Advogados",
  lawyer: "Dr. Odair Alves da Silva",
  /** Área geográfica informada pelo escritório. */
  region: "Estado de São Paulo",

  /** Inscrição na OAB. Ex.: "OAB/SP 000.000". Nunca publicar número fictício. */
  oab: null as string | null,
  /** Inscrição da sociedade de advogados na OAB, se houver. */
  oabSociety: null as string | null,

  phone: null as Phone | null,
  /** Número com DDI e DDD, só dígitos. Ex.: { number: "5511900000000", display: "(11) 90000-0000" }. */
  whatsapp: null as { number: string; display: string } | null,
  email: null as string | null,
  address: null as Address | null,
  /** Cidade da sede, quando confirmada (aparece no rodapé). */
  city: null as string | null,

  social: {
    instagram: null as string | null,
    linkedin: null as string | null,
  },

  /** Foto profissional autorizada do Dr. Odair. Enquanto `null`, o site usa o monograma. */
  photo: null as { src: string; alt: string } | null,

  /** Mensagem inicial neutra do WhatsApp (pedido do briefing). */
  whatsappMessage:
    "Olá, gostaria de obter informações sobre o atendimento do escritório Odair Alves da Silva & Advogados.",

  /**
   * Endereço que recebe o formulário (serviço de envio configurado no servidor).
   * Enquanto não existir, o formulário funciona em demonstração: confere os
   * campos no servidor e não envia nem guarda nada.
   */
  contactDelivery: null as null | "email",

  /** Demonstração comercial não oficial. */
  demo: true,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://odair-advogados.vercel.app",
};

export const brand = {
  /** Recortes do logotipo enviado (imagem). Substituir pelos arquivos vetoriais originais quando chegarem. */
  monogram: { gold: "/marca/monograma-dourado.png", navy: "/marca/monograma-marinho.png", width: 690, height: 722 },
  name: { gold: "/marca/nome-dourado.png", navy: "/marca/nome-marinho.png", width: 1358, height: 240 },
  lockup: { gold: "/marca/assinatura-dourado.png", navy: "/marca/assinatura-marinho.png", width: 1974, height: 722 },
};

export const nav = [
  { href: "/#inicio", id: "inicio", label: "Início" },
  { href: "/#escritorio", id: "escritorio", label: "O Escritório" },
  { href: "/#areas", id: "areas", label: "Áreas de Atuação" },
  { href: "/#abordagem", id: "abordagem", label: "Nossa Abordagem" },
  { href: "/#conteudos", id: "conteudos", label: "Conteúdos" },
  { href: "/#contato", id: "contato", label: "Contato" },
] as const;

export function whatsappUrl() {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsappMessage)}`;
}

/** Lista do que ainda depende do escritório (usada em `npm run check:config`). */
export function pendingFields() {
  const pending: string[] = [];
  if (!site.oab) pending.push("Número de inscrição na OAB (site.oab)");
  if (!site.phone) pending.push("Telefone (site.phone)");
  if (!site.whatsapp) pending.push("WhatsApp (site.whatsapp)");
  if (!site.email) pending.push("E-mail (site.email)");
  if (!site.address) pending.push("Endereço (site.address)");
  if (!site.city) pending.push("Cidade da sede (site.city)");
  if (!site.photo) pending.push("Foto profissional autorizada (site.photo)");
  if (!site.social.instagram && !site.social.linkedin) pending.push("Redes sociais (site.social)");
  if (!site.contactDelivery) pending.push("Serviço de envio do formulário (site.contactDelivery)");
  if (site.demo) pending.push("Aprovação dos textos pelo Dr. Odair e `demo: false`");
  return pending;
}

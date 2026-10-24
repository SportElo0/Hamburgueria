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
  whatsapp: { number: "5511997519752", display: "(11) 99751-9752" } as { number: string; display: string } | null,
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

  /**
   * Foto da abertura. HOJE É ILUSTRATIVA (gerada por IA, sem pessoas): não é o
   * escritório do Dr. Odair e aparece marcada como "imagem ilustrativa".
   * `remote` é baixado para `src` no build (scripts/baixar-foto.mjs) quando o
   * arquivo não existe. Para usar a foto real: coloque o arquivo em
   * public/fotos/, aponte `src` para ele, `remote: null` e `illustrative: false`.
   */
  heroPhoto: {
    src: "/fotos/escritorio-ilustrativo.png",
    remote:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FePbBNXAIWrl462iiz2a7ygFXt/hf_20261024_185836_e9d2dc6f-43f6-4204-bd9e-8f45caf24f1c.png",
    width: 1344,
    height: 768,
    illustrative: true,
  } as { src: string; remote: string | null; width: number; height: number; illustrative: boolean },

  /** Mensagem inicial neutra do WhatsApp (pedido do briefing). */
  whatsappMessage:
    "Olá, gostaria de obter informações sobre o atendimento do escritório Odair Alves da Silva & Advogados.",

  /**
   * Para onde vai o formulário. "whatsapp": o servidor confere os campos e o
   * navegador abre o WhatsApp do escritório com a mensagem pronta (nada é
   * guardado no site). `null`: demonstração, que confere e não envia nada.
   */
  contactDelivery: "whatsapp" as null | "whatsapp" | "email",

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

export function whatsappUrl(message: string = site.whatsappMessage) {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
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

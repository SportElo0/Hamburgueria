import { z } from 'zod';
import { CATEGORIAS, SEGMENTOS, type Categoria, type Segmento } from '../oportunidades/regras';

/**
 * Growlift Sales Agent, phase 1: the commercial CRM on top of Oportunidades. Pure rules only (no storage, no network),
 * so every decision here is covered by tests: the pipeline stages, what a contact must carry, the block list keys,
 * the simulated draft and the checks every draft passes before a person can approve it.
 *
 * Phase 1 sends nothing. "Aprovado" means a person read and approved the text; sending comes in phase 2, with the
 * daily cap below and the unsubscribe link in every message.
 */

/** The commercial WhatsApp. The panel never sends from it: the button only opens a conversation a person writes. */
export const WHATSAPP_COMERCIAL = '5511942279336';
export const EMAIL_COMERCIAL = 'contato@growlift.com.br';
/** Pilot limits agreed on 02/11/2026: at most 5 e-mails a day and 1 follow-up per business, always approved. */
export const LIMITE_EMAILS_DIA = 5;
export const MAX_ACOMPANHAMENTOS = 1;

export const ETAPAS = [
  { id: 'qualificar', nome: 'Aguardando qualificação', dica: 'Importado de Oportunidades: falta nome, e-mail comercial e fonte' },
  { id: 'novo', nome: 'Novo', dica: 'Contato completo, ainda sem texto aprovado' },
  { id: 'em-aprovacao', nome: 'Em aprovação', dica: 'Tem rascunho esperando uma pessoa ler' },
  { id: 'aprovado', nome: 'Aprovado', dica: 'Texto aprovado; o envio chega na fase 2' },
  { id: 'enviado', nome: 'Enviado', dica: 'E-mail enviado, esperando resposta' },
  { id: 'respondeu', nome: 'Respondeu', dica: 'Respondeu e ainda não foi qualificado' },
  { id: 'quente', nome: 'Quente', dica: 'Pediu preço, reunião ou contato: falar hoje' },
  { id: 'morno', nome: 'Morno', dica: 'Interesse, mas sem pressa' },
  { id: 'frio', nome: 'Frio', dica: 'Agora não; não insistir' },
  { id: 'cliente', nome: 'Virou cliente', dica: 'Fechou contrato' },
  { id: 'perdido', nome: 'Perdido', dica: 'Não seguiu; sem novos contatos' },
  { id: 'nao-contatar', nome: 'Não contatar', dica: 'Pediu para sair ou não quer contato; bloqueado' },
] as const;
export type Etapa = (typeof ETAPAS)[number]['id'];
export const ETAPA_IDS = ETAPAS.map((e) => e.id) as [Etapa, ...Etapa[]];
export const nomeEtapa = (id: Etapa) => ETAPAS.find((e) => e.id === id)?.nome ?? id;
/** Stages a person can pick by hand. "Em aprovação" and "Não contatar" come from the drafts and the block list. */
export const ETAPAS_MANUAIS: Etapa[] = ['novo', 'aprovado', 'enviado', 'respondeu', 'quente', 'morno', 'frio', 'cliente', 'perdido'];
/** Stages with no further outreach: no new drafts, no follow-up. */
export const ETAPAS_ENCERRADAS: Etapa[] = ['frio', 'cliente', 'perdido', 'nao-contatar'];

/** Where the team found the e-mail. Google data never counts as a source (Maps Platform terms). */
export const FONTES = [
  { id: 'site', nome: 'Site do próprio negócio' },
  { id: 'instagram', nome: 'Instagram do negócio' },
  { id: 'facebook', nome: 'Facebook do negócio' },
  { id: 'cartao', nome: 'Cartão, cardápio ou material do negócio' },
  { id: 'contato-direto', nome: 'O próprio negócio passou (conversa, formulário)' },
] as const;
export type FonteContato = (typeof FONTES)[number]['id'];
export const FONTE_IDS = FONTES.map((f) => f.id) as [FonteContato, ...FonteContato[]];
export const nomeFonte = (id: FonteContato) => FONTES.find((f) => f.id === id)?.nome ?? id;

export interface Evento {
  em: string;
  por: string;
  tipo: 'cadastro' | 'etapa' | 'rascunho' | 'aprovacao' | 'descarte' | 'nota' | 'resposta' | 'bloqueio' | 'whatsapp';
  texto: string;
}

export type TipoRascunho = 'primeiro' | 'acompanhamento';
export type StatusRascunho = 'para-aprovar' | 'aprovado' | 'descartado';
export interface Rascunho {
  id: string;
  tipo: TipoRascunho;
  assunto: string;
  corpo: string;
  /** Who wrote it: the simulator (no AI, no cost), the AI model, or edited by a person. */
  origem: 'simulado' | 'ia' | 'editado';
  modelo?: string;
  /** The facts the text was allowed to use, shown next to it so the reviewer can check. */
  fatos: string[];
  alertas: string[];
  status: StatusRascunho;
  criadoEm: string;
  criadoPor: string;
  decididoEm?: string;
  decididoPor?: string;
}

export interface Contato {
  id: string;
  /** Link to the Oportunidades lead (Google place ID), when it came from there. */
  placeId?: string;
  /**
   * Typed by the team from the business's own channels, never copied from Google. Empty ('') while an imported
   * contact waits for qualification: the Google terms only let us keep the place ID.
   */
  negocio: string;
  /** '' until the team finds a public business address (imported contacts start without one). */
  email: string;
  fonte: { tipo: FonteContato; url: string } | null;
  /** How the contact entered the CRM. */
  origem?: 'manual' | 'importado';
  segmento?: Segmento;
  categoria?: Categoria;
  /** What the panel's own check saw on the business's site (team data, not Google's). */
  sinais: string[];
  cidade: string;
  uf: string;
  etapa: Etapa;
  /** Phone the business itself gave and asked to be called on, with when and how it asked. */
  whatsapp?: { numero: string; pedidoEm: string; como: string };
  observacoes: string;
  rascunhos: Rascunho[];
  historico: Evento[];
  criadoEm: string;
  criadoPor: string;
  atualizadoEm: string;
}

const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .url('Cole o link de onde vocês acharam o e-mail.')
  .refine((u) => /^https:\/\//i.test(u), 'O link da fonte precisa começar com https://')
  .refine((u) => !/(^|\.)google\.[a-z.]+\/|goo\.gl|g\.page|maps\.app/i.test(u), 'O Google não vale como fonte do e-mail: use o site ou a rede social do próprio negócio.');

export const normalizarEmail = (e: string) => e.trim().toLowerCase();
export const dominioDe = (email: string) => normalizarEmail(email).split('@')[1] ?? '';
/** Webmail domains: blocking one of these would block everyone, so the block list only takes the full address. */
export const DOMINIOS_PUBLICOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'live.com', 'yahoo.com', 'yahoo.com.br', 'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'msn.com'];

const negocioSchema = z.string().trim().min(2, 'Informe o nome do negócio.').max(80);
const emailSchema = z.string().trim().toLowerCase().max(120).email('Confira o e-mail.');
const sempublico = (email: string) => !DOMINIOS_PUBLICOS.includes(email.split('@')[1] ?? '');
const MSG_PUBLICO =
  'E-mail de Gmail, Hotmail e parecidos costuma ser pessoal: use o endereço com o domínio do próprio negócio. Se o negócio só tem esse, fale com ele por outro canal.';

export const contatoSchema = z.object({
  placeId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{10,300}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  negocio: negocioSchema,
  email: emailSchema,
  fonteTipo: z.enum(FONTE_IDS, { message: 'Escolha onde acharam o e-mail.' }),
  fonteUrl: httpsUrl,
  cidade: z.string().trim().max(60).default(''),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-Z]{2})?$/, 'UF com duas letras.')
    .default(''),
  segmento: z
    .enum(SEGMENTOS.map((s) => s.id) as [Segmento, ...Segmento[]])
    .optional()
    .or(z.literal('').transform(() => undefined)),
  observacoes: z.string().trim().max(1000).default(''),
  conferido: z.literal(true, { message: 'Confirme que o e-mail é público e do próprio negócio.' }),
}).refine((d) => sempublico(d.email), { message: MSG_PUBLICO, path: ['email'] });
export type ContatoInput = z.input<typeof contatoSchema>;

/** Qualifying an imported contact: the same rules as a manual one (name, business e-mail, verifiable source). */
export const completarSchema = z
  .object({
    negocio: negocioSchema,
    email: emailSchema,
    fonteTipo: z.enum(FONTE_IDS, { message: 'Escolha onde acharam o e-mail.' }),
    fonteUrl: httpsUrl,
    conferido: z.literal(true, { message: 'Confirme que o e-mail é público e do próprio negócio.' }),
  })
  .refine((d) => sempublico(d.email), { message: MSG_PUBLICO, path: ['email'] });

/** Name, e-mail and source: without all three nothing can be written to the business. */
export const contatoCompleto = (c: Pick<Contato, 'negocio' | 'email' | 'fonte'>) => Boolean(c.negocio && c.email && !c.email.includes('*') && c.fonte);

/** What the screen shows while the team has not typed the name yet (never a name from Google). */
export function nomeExibicao(c: Pick<Contato, 'negocio' | 'segmento' | 'cidade'>) {
  if (c.negocio) return c.negocio;
  const seg = c.segmento ? SEGMENTOS.find((s) => s.id === c.segmento)?.nome : undefined;
  return `${seg ?? 'Negócio'}${c.cidade ? ` em ${c.cidade}` : ''} (sem nome ainda)`;
}

export interface Analise {
  prioridade: 'alta' | 'media' | 'baixa';
  plano: 'Start' | 'Grow';
  motivos: string[];
  falta: string[];
  /** Enough to prepare a draft now. */
  pronto: boolean;
}

/**
 * The lead review, by fixed rules over the team's own data (category, site check, hand verification, segment).
 * No AI and nothing guessed: what is unknown shows up in "falta".
 */
export function analisarContato(
  c: Pick<Contato, 'negocio' | 'email' | 'fonte' | 'segmento' | 'categoria' | 'sinais'>,
  verificacao?: { situacao: string; fontes: string[] },
): Analise {
  const grow = Boolean(c.segmento && SEGMENTOS_PEDIDO.has(c.segmento));
  const motivos: string[] = [];
  const falta: string[] = [];
  let pontos = 0;
  const confirmado = verificacao?.situacao === 'confirmado';
  switch (c.categoria) {
    case 'sem-site':
      if (confirmado) {
        motivos.push('Sem site, confirmado pela equipe em 2 fontes.');
        pontos += 3;
      } else {
        motivos.push('O Google não mostra site, mas a equipe ainda não confirmou em 2 fontes.');
        falta.push('Verificação manual (2 fontes) em Oportunidades');
        pontos += 1;
      }
      break;
    case 'so-rede-social':
      motivos.push('Aparece na internet só por rede social ou app.');
      pontos += 2;
      break;
    case 'site-com-problemas':
      motivos.push(`Site com problemas: ${c.sinais.slice(0, 2).join('; ') || 'ver a checagem'}.`);
      pontos += 2;
      break;
    case 'incerta':
      motivos.push('A checagem não conseguiu concluir; conferir à mão.');
      break;
    default:
      break;
  }
  if (grow) {
    motivos.push('Ramo de pedido e delivery: o plano Grow (pedido no site, sem comissão) faz sentido.');
    pontos += 1;
  }
  if (!c.negocio) falta.push('Nome do negócio (do site ou da rede dele)');
  if (!c.email || c.email.includes('*')) falta.push('E-mail comercial');
  if (!c.fonte) falta.push('Link da fonte do e-mail');
  return {
    prioridade: pontos >= 3 ? 'alta' : pontos >= 2 ? 'media' : 'baixa',
    plano: grow ? 'Grow' : 'Start',
    motivos,
    falta,
    pronto: contatoCompleto(c),
  };
}

export const edicaoRascunhoSchema = z.object({
  assunto: z.string().trim().min(3, 'Escreva o assunto.').max(120),
  corpo: z.string().trim().min(40, 'O texto está curto demais.').max(3000, 'O texto passou de 3.000 caracteres.'),
});

export const whatsappSchema = z.object({
  numero: z
    .string()
    .transform((s) => s.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
    .refine((d) => /^[1-9]{2}9\d{8}$/.test(d), 'Use um celular com DDD.'),
  como: z.string().trim().min(10, 'Conte como o cliente pediu (ex.: respondeu o e-mail de 03/11 pedindo para chamar no WhatsApp).').max(300),
});

/** Opens the commercial WhatsApp with a ready text the lead sends us: the lead starts the conversation. */
export function linkWhatsAppComercial(negocio: string) {
  const texto = `Olá! Recebi o e-mail da Growlift sobre o site de ${negocio} e quero conversar.`;
  return `https://wa.me/${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(texto)}`;
}

/** Opens a chat with the lead's own number, only after the lead asked for it. A person writes and sends. */
export const linkWhatsAppDoLead = (numero: string) => `https://wa.me/55${numero.replace(/\D/g, '')}`;

/** Words that mean "stop writing to me". Matched without accents; any hit blocks, with no AI in the loop. */
const PALAVRAS_SAIR = [
  'sair',
  'descadastr',
  'remover',
  'remova',
  'retire meu',
  'retirar meu',
  'nao quero receber',
  'nao tenho interesse',
  'sem interesse',
  'pare de',
  'parem de',
  'nao me mande',
  'nao mande mais',
  'nao envie',
  'unsubscribe',
  'stop',
  'spam',
  'cancelar',
  'cancele',
  'tirar meu',
  'tire meu',
  'excluir',
  'exclua',
  'nao quero',
  'nao me envie',
  'nao me escreva',
  'parar',
  'chega',
];
/** Words that may announce a complaint: they block like "sair" and also flag the contact for a person to look at. */
const PALAVRAS_RECLAMACAO = ['procon', 'advogad', 'processo', 'denuncia', 'lgpd', 'anpd', 'reclame aqui'];
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function pedeParaSair(texto: string) {
  const t = ` ${semAcento(texto).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ')} `;
  return PALAVRAS_SAIR.some((p) => (p.length <= 5 ? t.includes(` ${p} `) : t.includes(p))) || possivelReclamacao(texto);
}
export function possivelReclamacao(texto: string) {
  const t = semAcento(texto);
  return PALAVRAS_RECLAMACAO.some((p) => t.includes(p));
}

/** What Growlift sells, as published on growlift.com.br (checked 02/11/2026). The drafts may only use these. */
export const OFERTA = {
  start: 'Plano Start, R$ 247 por mês: site feito do zero, domínio no nome do negócio, hospedagem, botão de WhatsApp e Perfil no Google conferido todo mês.',
  grow: 'Plano Grow, R$ 597 por mês: tudo do Start mais pedido pelo próprio site, com Pix na hora, sem comissão.',
  condicoes:
    'Mensalidade fixa, sem comissão. Fidelidade de 6 meses no Start e 4 no Grow; a criação do site não tem custo para quem cumpre o prazo (cancelando antes, paga a parte proporcional da criação). Desistência em até 7 dias sem custo. Detalhes em growlift.com.br/termos.html.',
  diagnostico: 'Diagnóstico grátis: em até 2 dias úteis, um retrato de como o negócio aparece na internet e uma prévia do site novo.',
};
export const PRECOS_PERMITIDOS = ['247', '597'];
/** Segments where ordering on the site (Grow) is the stronger offer; the rest get Start. */
const SEGMENTOS_PEDIDO = new Set<string>(SEGMENTOS.filter((s) => s.grupo === 'Pedido e Pix no site').map((s) => s.id));

export interface Contexto {
  negocio: string;
  cidade: string;
  segmento?: Segmento;
  categoria?: Categoria;
  sinais: string[];
  tipo: TipoRascunho;
}

/** The facts a draft may rely on, built from the team's own data. Nothing here comes from Google. */
export function fatosDoContato(c: Contexto): string[] {
  const fatos: string[] = [];
  const seg = c.segmento ? SEGMENTOS.find((s) => s.id === c.segmento) : undefined;
  if (seg) fatos.push(`Ramo: ${seg.nome}${c.cidade ? `, em ${c.cidade}` : ''}.`);
  else if (c.cidade) fatos.push(`Cidade: ${c.cidade}.`);
  const cat = c.categoria ? CATEGORIAS.find((x) => x.id === c.categoria) : undefined;
  if (cat) fatos.push(`O que a equipe viu: ${cat.nome}.`);
  for (const s of c.sinais.slice(0, 3)) fatos.push(`Checagem do site: ${s}.`);
  fatos.push(c.segmento && SEGMENTOS_PEDIDO.has(c.segmento) ? OFERTA.grow : OFERTA.start);
  fatos.push(OFERTA.condicoes, OFERTA.diagnostico);
  return fatos;
}

const ABERTURA: Record<Categoria, string> = {
  'sem-site': 'procurei {negocio} na internet e não encontrei um site próprio nos canais públicos que consultei',
  'so-rede-social': 'vi que hoje {negocio} aparece na internet principalmente pelas redes sociais',
  'site-com-problemas': 'abri o site de {negocio} e notei um ponto a melhorar: {problema}',
  'site-proprio': 'vi o site de {negocio}',
  incerta: 'procurei {negocio} na internet',
};

/**
 * A plain, honest draft built from fixed sentences: no AI, no cost, same input gives the same text. It is what the
 * panel uses while the AI is off, and the baseline the AI drafts are compared with.
 */
export function rascunhoSimulado(c: Contexto): { assunto: string; corpo: string } {
  const sinal = c.sinais[0] ?? 'alguns detalhes técnicos';
  const problema = sinal[0].toLowerCase() + sinal.slice(1);
  const abertura = ABERTURA[c.categoria ?? 'incerta'].replace('{negocio}', c.negocio).replace('{problema}', problema);
  const pedido = c.segmento && SEGMENTOS_PEDIDO.has(c.segmento);
  if (c.tipo === 'acompanhamento') {
    return {
      assunto: `Re: ${c.negocio} na internet`,
      corpo: [
        'Olá, tudo bem?',
        `Escrevi há alguns dias sobre a presença de ${c.negocio} na internet. Se fizer sentido, a gente prepara um diagnóstico grátis, com uma prévia do site, em até 2 dias úteis e sem compromisso.`,
        'Se não for o momento, é só responder "sair" que não escrevo mais.',
        'Obrigado!',
      ].join('\n\n'),
    };
  }
  return {
    assunto: `${c.negocio} na internet`,
    corpo: [
      'Olá, tudo bem?',
      `Sou da Growlift, uma agência de São Paulo que faz sites para negócios locais. ${abertura[0].toUpperCase()}${abertura.slice(1)}.`,
      pedido
        ? 'A gente faz o site do zero e, no plano Grow (R$ 597 por mês, com fidelidade de 4 meses; condições em growlift.com.br/termos.html), o cliente pede pelo próprio site, com Pix na hora e sem comissão por pedido.'
        : 'A gente faz o site do zero, com domínio no nome do negócio, botão de WhatsApp e o Perfil no Google conferido todo mês, no plano Start (R$ 247 por mês, com fidelidade de 6 meses; condições em growlift.com.br/termos.html).',
      'Se quiser, preparo um diagnóstico grátis de como o negócio aparece na internet, com uma prévia ilustrativa de site, em até 2 dias úteis e sem compromisso. Basta responder este e-mail.',
      'Obrigado!',
    ].join('\n\n'),
  };
}

/** Phrases that promise results or invent proof. Any of them blocks approval until a person rewrites the text. */
const PROIBIDAS: [RegExp, string][] = [
  [/garant(o|imos|ido|ia)/i, 'Promete garantia ("garantimos").'],
  [/\b(aument|dobr|tripl|multiplic)\w*\s+((as|os|o|a|suas|seus|sua|seu)\s+){0,2}(vendas|faturamento|clientes|pedidos)/i, 'Promete aumento de vendas ou clientes.'],
  [/primeir[oa] (lugar|posi[cç][aã]o|p[aá]gina) do google|topo do google/i, 'Promete posição no Google (ninguém pode garantir).'],
  [/\b(nossos|v[aá]rios|centenas de|milhares de|mais de \d+) clientes\b/i, 'Cita clientes ou números de clientes.'],
  [/depoimento|case de sucesso/i, 'Cita depoimento ou case.'],
  [/[uú]ltim[ao]s? vagas?|s[oó] hoje|oferta exclusiva|promo[cç][aã]o rel[aâ]mpago/i, 'Pressão de urgência.'],
  [/\b(ifood|booking|airbnb)\b[^.]*\d+\s?%/i, 'Cita porcentagem de comissão de terceiros (conferir a fonte antes).'],
];

/**
 * Checks a draft before approval. Returns plain-language alerts; "bloqueia" ones must be fixed by editing.
 * The unsubscribe line and the signature are added when sending (phase 2), so the text itself must not fake them.
 */
export function conferirRascunho(assunto: string, corpo: string): { alertas: string[]; bloqueia: boolean } {
  const texto = `${assunto}\n${corpo}`;
  const alertas: string[] = [];
  let bloqueia = false;
  for (const [re, msg] of PROIBIDAS)
    if (re.test(texto)) {
      alertas.push(msg);
      bloqueia = true;
    }
  for (const m of texto.matchAll(/R\$\s?([\d.]+)/g))
    if (!PRECOS_PERMITIDOS.includes(m[1].replace(/\./g, ''))) {
      alertas.push(`Preço que não está no site: R$ ${m[1]}.`);
      bloqueia = true;
    }
  if (/\d+\s?%/.test(texto) && !bloqueia) alertas.push('Tem porcentagem: confira se vem de uma fonte que vocês podem mostrar.');
  if (/https?:\/\/|www\./i.test(corpo)) alertas.push('Tem link no texto: e-mail frio com link cai mais no spam. O link de descadastro já vai no rodapé.');
  if (/\[|\]|\{|\}/.test(texto)) {
    alertas.push('Sobrou um campo para preencher ([...] ou {...}).');
    bloqueia = true;
  }
  if (corpo.length > 1500) alertas.push('Texto longo: e-mail de primeiro contato funciona melhor com até uns 900 caracteres.');
  return { alertas, bloqueia };
}

/** The footer every sent e-mail will carry (phase 2). Shown under the draft so the reviewer sees the whole message. */
export function rodape(linkDescadastro: string, negocio = '{negócio}', fonte = '{fonte}') {
  return [
    '--',
    'Equipe Comercial | Growlift',
    EMAIL_COMERCIAL,
    'https://growlift.com.br',
    '',
    '69.611.450 LUCAS CORREA ENNSER · CNPJ 69.611.450/0001-17 · Rua Barão de Monte Mor, 55, Real Parque, São Paulo/SP',
    `Você recebeu este e-mail porque o endereço está publicado como contato comercial de ${negocio} (${fonte.toLowerCase()}). Para não receber mais: ${linkDescadastro} ou responda SAIR. Como tratamos dados: growlift.com.br/privacidade.html`,
  ].join('\n');
}

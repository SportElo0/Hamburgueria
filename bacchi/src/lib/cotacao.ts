// Quote request: the items a buyer picked in the catalogue, the contact form, and the message the sales team
// receives. Shared by the browser (list, review, WhatsApp/e-mail links) and the server (validation, e-mail).
import { z } from 'zod';
import { ACABAMENTOS, PRODUTOS, produto, opcoesEmbalagem, type Acabamento } from '@/data/catalogo';
import { EMPRESA } from '@/data/empresa';

export interface ItemCotacao {
  /** produto slug + modelo + acabamento + embalagem: the same choice adds up instead of repeating. */
  id: string;
  slug: string;
  modelo: string;
  acabamento?: Acabamento;
  embalagem: string;
  quantidade: number;
  observacao?: string;
}

export const idDoItem = (i: Pick<ItemCotacao, 'slug' | 'modelo' | 'acabamento' | 'embalagem'>) => [i.slug, i.modelo, i.acabamento ?? '', i.embalagem].join('|');

export const QUANTIDADE_MAX = 100000;
export const ITENS_MAX = 120;

const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'] as const;

/** An item is valid only if its product, model, finish and packaging exist in the catalogue. */
export const itemSchema = z
  .object({
    slug: z.string().max(60),
    modelo: z.string().max(60),
    acabamento: z.enum(Object.keys(ACABAMENTOS) as [Acabamento, ...Acabamento[]]).optional(),
    embalagem: z.string().max(80),
    quantidade: z.number().int().min(1).max(QUANTIDADE_MAX),
    observacao: z.string().max(200).optional(),
  })
  .superRefine((i, ctx) => {
    const p = produto(i.slug);
    const v = p?.variacoes.find((x) => x.modelo === i.modelo);
    if (!p || !v) return ctx.addIssue({ code: 'custom', message: 'Produto ou modelo fora do catálogo.' });
    if (i.acabamento && !(v.acabamentos ?? p.acabamentos).includes(i.acabamento as Acabamento)) ctx.addIssue({ code: 'custom', message: 'Acabamento indisponível para este modelo.' });
    if (!opcoesEmbalagem(p, v).includes(i.embalagem)) ctx.addIssue({ code: 'custom', message: 'Embalagem indisponível para este modelo.' });
  });

export const contatoSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(80),
  empresa: z.string().trim().min(2, 'Informe a empresa.').max(120),
  email: z.string().trim().email('E-mail inválido.').max(120),
  telefone: z
    .string()
    .trim()
    .max(30)
    .refine((t) => t.replace(/\D/g, '').length >= 10, 'Telefone com DDD.'),
  cidade: z.string().trim().min(2, 'Informe a cidade.').max(80),
  uf: z.enum(UFS, { message: 'Escolha o estado.' }),
  mensagem: z.string().trim().max(1000).optional(),
  aceite: z.literal(true, { message: 'É preciso autorizar o contato.' }),
});

export const pedidoSchema = z.object({
  itens: z.array(itemSchema).min(1, 'Adicione ao menos um produto.').max(ITENS_MAX),
  contato: contatoSchema,
  /** Honeypot: people never see this field; bots fill it. */
  site: z.string().max(0).optional(),
  /** Milliseconds the form stayed open; a submit in under 3 s is treated as a bot. */
  tempo: z.number().min(3000),
});

export type Contato = z.infer<typeof contatoSchema>;
export type Pedido = z.infer<typeof pedidoSchema>;
export const UF_LISTA = UFS;

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** One line per item, with every reference the team needs to quote it. */
export function linhaDoItem(i: Pick<ItemCotacao, 'slug' | 'modelo' | 'acabamento' | 'embalagem' | 'quantidade' | 'observacao'>, n: number): string {
  const p = produto(i.slug);
  const partes = [
    `${n}. ${p?.nome ?? i.slug} · ${p?.rotuloModelo ?? 'Modelo'} ${i.modelo}`,
    i.acabamento ? `Acabamento: ${ACABAMENTOS[i.acabamento]?.nome ?? i.acabamento}` : null,
    `Embalagem: ${i.embalagem}`,
    `Quantidade: ${fmt(i.quantidade)} ${i.quantidade === 1 ? 'embalagem' : 'embalagens'}`,
    i.observacao ? `Obs.: ${i.observacao}` : null,
  ];
  return partes.filter(Boolean).join(' · ');
}

export function textoDoPedido(itens: Pick<ItemCotacao, 'slug' | 'modelo' | 'acabamento' | 'embalagem' | 'quantidade' | 'observacao'>[], contato?: Partial<Omit<Contato, 'aceite'>>): string {
  const linhas = ['Solicitação de orçamento · site Bacchi', '', 'Itens:', ...itens.map((i, k) => linhaDoItem(i, k + 1))];
  if (contato) {
    linhas.push('', 'Contato:');
    if (contato.nome) linhas.push(`Nome: ${contato.nome}`);
    if (contato.empresa) linhas.push(`Empresa: ${contato.empresa}`);
    if (contato.email) linhas.push(`E-mail: ${contato.email}`);
    if (contato.telefone) linhas.push(`Telefone: ${contato.telefone}`);
    if (contato.cidade || contato.uf) linhas.push(`Local: ${[contato.cidade, contato.uf].filter(Boolean).join(' – ')}`);
    if (contato.mensagem) linhas.push('', `Mensagem: ${contato.mensagem}`);
  }
  return linhas.join('\n');
}

/** The short message the WhatsApp button sends: a greeting, one block per item, thanks. *bold* is WhatsApp's. */
export function mensagemWhatsApp(itens: Pick<ItemCotacao, 'slug' | 'modelo' | 'acabamento' | 'embalagem' | 'quantidade' | 'observacao'>[]): string {
  const blocos = itens.map((i) => {
    const p = produto(i.slug);
    const detalhe = [i.acabamento ? (ACABAMENTOS[i.acabamento]?.nome ?? i.acabamento) : null, i.embalagem, `${fmt(i.quantidade)} ${i.quantidade === 1 ? 'embalagem' : 'embalagens'}`];
    return [`• *${p?.nome ?? i.slug}* – ${p?.rotuloModelo ?? 'Modelo'} ${i.modelo}`, `   ${detalhe.filter(Boolean).join(' · ')}`, i.observacao ? `   Obs.: ${i.observacao}` : null].filter(Boolean).join('\n');
  });
  return ['Olá, Bacchi! Vim pelo site e gostaria de um orçamento:', '', ...blocos, '', 'Obrigado!'].join('\n');
}

export const linkWhatsAppPedido = (texto: string) => `${EMPRESA.whatsappLink}?text=${encodeURIComponent(texto)}`;
export const linkEmailPedido = (texto: string) => `mailto:${EMPRESA.email}?subject=${encodeURIComponent('Solicitação de orçamento · site Bacchi')}&body=${encodeURIComponent(texto)}`;

/** Total number of models across the catalogue (shown as a fact on the home page). */
export const TOTAL_MODELOS = PRODUTOS.reduce((s, p) => s + p.variacoes.length, 0);

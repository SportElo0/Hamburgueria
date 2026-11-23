/**
 * Growlift's services ("Serviços" tab of the team panel): one card per product, with a demo picture, a short
 * explanation and where it stands. Starts with the list the team talked about (23/11); they edit it from there.
 * Pure functions and data only. Pictures in /public/servicos are screens of our own demos with fictitious data.
 */

export const SITUACOES = ['pronto', 'falta-ligar', 'teste', 'ideia'] as const;
export type Situacao = (typeof SITUACOES)[number];
export const NOME_SITUACAO: Record<Situacao, string> = {
  pronto: 'Pronto para vender',
  'falta-ligar': 'Falta ligar algo',
  teste: 'Em teste',
  ideia: 'Ideia',
};

export interface Servico {
  id: string;
  nome: string;
  /** What it is, in one or two sentences. */
  resumo: string;
  situacao: Situacao;
  /** '' | a picture of the defaults (/servicos/x.webp) | an upload (midia/growlift-servicos/<id>.<ext>). */
  imagem: string;
  /** Link to a demonstration ('' when there is none). */
  demo: string;
  criadoEm: string;
}

export const MAX_SERVICOS = 100;
export const MAX_RESUMO = 300;
/** Uploaded pictures live here, served by /api/midia (folder name no store slug would take). */
export const PASTA_FOTOS = 'growlift-servicos';

const COMERCIAL = 'https://growlift-comercial.vercel.app';
const PAINEL = 'https://painel-lojas-sportelo.vercel.app';

const s = (id: string, nome: string, situacao: Situacao, resumo: string, demo = ''): Servico => ({ id, nome, situacao, resumo, imagem: `/servicos/${id}.webp`, demo, criadoEm: '2026-11-23' });

/**
 * Cards the team asked to add after the list was first saved (the saved list wins, so they are merged in once).
 * Once delivered, a card is the team's like any other: deleting it does not bring it back.
 */
function SERVICOS_ADICIONADOS_LISTA(): Servico[] {
  return [
    s('mesa-conectada', 'Página da mesa (QR e NFC)', 'ideia', 'Uma página que abre pelo QR ou por NFC na mesa: cardápio, cartão fidelidade com selos, Wi-Fi, Instagram e avaliação no Google num lugar só. Quem quiser deixa o contato para receber promoções, com aceite e opção de sair.'),
  ];
}
export const SERVICOS_ADICIONADOS: Servico[] = SERVICOS_ADICIONADOS_LISTA();

/** The saved list plus the added cards not delivered yet (and not already there). Pure: the caller stores `entregues`. */
export function comAdicionados(lista: Servico[], entregues: string[]): Servico[] {
  const novos = SERVICOS_ADICIONADOS.filter((a) => !entregues.includes(a.id) && !lista.some((x) => x.id === a.id));
  return [...lista, ...novos.map((n) => structuredClone(n))];
}

export const SERVICOS_INICIAIS: Servico[] = [
  s('site-ia', 'Site com chat de IA', 'pronto', 'Site da empresa com uma assistente que responde a qualquer hora, só com as informações do cliente, e entrega o pedido de orçamento ou reserva pronto para a equipe.', `${COMERCIAL}/s/pousada-demo`),
  s('google', 'Perfil no Google + SEO', 'pronto', 'A gente arruma o perfil no Google (categoria, horário, fotos reais, link) e o título das páginas do site, para a empresa aparecer certo nas buscas. Sem garantia de posição.', `${COMERCIAL}/demonstracao`),
  s('cardapio', 'Cardápio digital no QR', 'pronto', 'O cliente lê o QR na mesa, vê o cardápio com fotos, faz o pedido e paga a conta pelo Pix. Tem também reservas e fila de espera.', `${PAINEL}/cardapio-exemplo`),
  s('delivery', 'Delivery próprio com Pix', 'pronto', 'Pedidos pelo site da própria loja, com entrega ou retirada, taxa por bairro, Pix e cupom. A loja aceita na tela e o cliente acompanha o pedido.'),
  s('prato-3d', 'Prato em 3D no tamanho real', 'teste', 'No cardápio da mesa, o cliente gira o prato em 3D e pode ver pela câmera, em cima da mesa, do tamanho de verdade. Falta escanear um prato real.', `${PAINEL}/cardapio-exemplo`),
  s('atendente-ia', 'Atendente de IA no WhatsApp', 'falta-ligar', 'Atende no WhatsApp oficial do cliente: responde, monta pedido ou orçamento e agenda. Se não souber, passa para alguém da equipe. Falta ligar o WhatsApp de cada cliente.'),
  s('ligacao', 'Ligação perdida vira WhatsApp', 'falta-ligar', 'Quem liga e não é atendido aperta 1 e recebe uma mensagem no WhatsApp logo em seguida; a equipe ganha a tarefa de retornar. Falta ligar o serviço de telefonia.', `${COMERCIAL}/demonstracao`),
  s('retomada', 'Retomada de quem sumiu', 'pronto', 'Quando o cliente recebe o orçamento e não responde, sai uma mensagem de retomada e, depois, a equipe recebe uma tarefa. Só para quem autorizou mensagens.', `${COMERCIAL}/demonstracao`),
  s('avaliacoes', 'Avaliações no Google', 'pronto', 'Depois do serviço, o cliente recebe o convite para avaliar no Google. Todo mundo recebe o mesmo convite, sem filtro de nota.', `${COMERCIAL}/demonstracao`),
  s('crm-torpedo', 'App de clientes: CRM e Torpedo', 'pronto', 'A loja vê seus clientes, quem sumiu e quanto cada um gastou, e prepara com a IA a mensagem para trazer de volta quem parou de comprar.', `${PAINEL}/demo/fish-burguer`),
  s('paineis', 'Painéis de organização', 'pronto', 'Painel do dono com vendas, preços e custos de cada prato, mesas e relatório do mês, para decidir com números.'),
  s('link-bio', 'Link na bio com perguntas', 'ideia', 'No link da bio, o cliente responde 2 ou 3 perguntas e recebe a indicação do produto certo da empresa, com botão para pedir no WhatsApp.'),
  ...SERVICOS_ADICIONADOS_LISTA(),
];

const FOTO_ENVIADA = new RegExp(`^midia/${PASTA_FOTOS}/[a-z0-9]{6,40}\\.(jpg|png|webp|avif)$`);

/** A picture the card may show: one of the defaults or an upload to the services folder. */
export const imagemValida = (v: string) => v === '' || /^\/servicos\/[a-z0-9-]{1,40}\.webp$/.test(v) || FOTO_ENVIADA.test(v);
/** Where the browser loads the picture from. */
export const srcImagem = (v: string) => (v.startsWith('midia/') ? `/api/midia/${v.slice('midia/'.length)}` : v);

/** A demonstration link: https only (never javascript: or a data URL). */
export function demoValida(v: string): boolean {
  if (v === '') return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && v.length <= 300;
  } catch {
    return false;
  }
}

/** The kind of picture from its first bytes (the browser's type is not trusted). */
export function tipoDaImagem(b: Uint8Array): 'jpg' | 'png' | 'webp' | 'avif' | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  const txt = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));
  if (b.length >= 12 && txt(0, 4) === 'RIFF' && txt(8, 4) === 'WEBP') return 'webp';
  if (b.length >= 12 && txt(4, 4) === 'ftyp' && /^avi[fs]$/.test(txt(8, 4))) return 'avif';
  return null;
}

import { comLinhaSair, type Importado } from './importados';

/**
 * Demonstration of an "App sob medida" for a store that has not signed yet: the same screens, in the browser only,
 * with made-up customers (phones 12 90000-xxxx, which are not real lines) and a simulated AI. Nothing is saved, nothing
 * is sent, no API key is needed. The owner can still bring their real Anota Aí export: it is read and kept in their
 * own browser only.
 */

export interface Demo {
  slug: string;
  nome: string;
  cidade: string;
  /** Words of the menu the simulated AI recognises (first = example). */
  cardapio: string[];
}

export const DEMOS: Record<string, Demo> = {
  'fish-burguer': {
    slug: 'fish-burguer',
    nome: 'Fish Burguer',
    cidade: 'Barra do Una',
    cardapio: ['fish burguer', 'x-bacon', 'x-salada', 'x-tudo', 'smash', 'bacon', 'peixe', 'camarão', 'batata', 'porção', 'combo', 'açaí', 'milkshake', 'refrigerante', 'lanche'],
  },
};

const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Thais', 'Vinícius', 'Bianca', 'Caio', 'Débora', 'Enzo', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Juliana', 'Leonardo', 'Letícia', 'Matheus', 'Natália', 'Otávio', 'Paula', 'Renato', 'Sabrina', 'Tiago', 'Vanessa', 'Wagner'];
const SOBRENOMES = 'ABCDFGLMNOPRSTV';

/** Same list every time (seeded), shaped like a real burger place: many one-time customers, a loyal core. */
export function clientesDemo(n = 320): Importado[] {
  let x = 20261121;
  const rnd = () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
  const out: Importado[] = [];
  for (let i = 0; i < n; i++) {
    const nome = `${NOMES[Math.floor(rnd() * NOMES.length)]} ${SOBRENOMES[Math.floor(rnd() * SOBRENOMES.length)]}.`;
    const r = rnd();
    const orders = r < 0.45 ? 1 : r < 0.7 ? 2 + Math.floor(rnd() * 2) : r < 0.9 ? 4 + Math.floor(rnd() * 6) : 10 + Math.floor(rnd() * 30);
    const d = rnd();
    const inactiveDays = d < 0.2 ? Math.floor(rnd() * 20) : d < 0.6 ? 20 + Math.floor(rnd() * 100) : 120 + Math.floor(rnd() * 300);
    out.push({ phone: `1290000${String(1000 + i).slice(-4)}`, name: nome, orders, inactiveDays });
  }
  return out;
}

// ------------------------------------------------------------------ simulated AI

export interface FalaDemo {
  quem: 'dono' | 'ia';
  texto: string;
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function produtoDe(texto: string, cardapio: string[]) {
  const t = norm(texto);
  const achado = cardapio.find((c) => t.includes(norm(c)));
  if (!achado) return '';
  if (achado === 'bacon') return 'X-Bacon';
  return achado.replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
}

function precoDe(texto: string) {
  const m = texto.match(/r\$\s*(\d{1,4}(?:[,.]\d{2})?)/i) ?? texto.match(/(\d{1,4}(?:[,.]\d{2})?)\s*(?:reais|conto)/i) ?? texto.match(/(?:por|a|de)\s+(\d{1,3}(?:[,.]\d{2})?)\b/i);
  if (m) return `R$ ${m[1].replace('.', ',')}`;
  const pct = texto.match(/(\d{1,2})\s*%/);
  return pct ? `${pct[1]}% de desconto` : '';
}

function validadeDe(texto: string) {
  const t = norm(texto);
  const ate = texto.match(/at[eé]\s+(?:o\s+dia\s+)?(\d{1,2}\/\d{1,2})/i);
  if (ate) return `até ${ate[1]}`;
  if (/hoje e amanha/.test(t)) return 'hoje e amanhã';
  if (/fim de semana|final de semana|sabado e domingo/.test(t)) return 'neste fim de semana';
  if (/so hoje|somente hoje|apenas hoje|\bhoje\b/.test(t)) return 'hoje';
  if (/amanha/.test(t)) return 'amanhã';
  const dia = t.match(/\b(segunda|terca|quarta|quinta|sexta|sabado|domingo)\b/);
  if (dia) return `na ${dia[1].replace('terca', 'terça').replace('sabado', 'sábado')}`;
  if (/semana/.test(t)) return 'esta semana';
  return '';
}

function canalDe(texto: string) {
  const t = norm(texto);
  const d = /delivery|entrega|ifood|anota/.test(t);
  const b = /balcao|retirada|retirar|loja|salao|mesa/.test(t);
  if (/os dois|ambos|tudo/.test(t) || (d && b)) return 'no delivery e no balcão';
  if (d) return 'no delivery';
  if (b) return 'no balcão';
  return '';
}

/** A short, scripted helper that behaves like the real one: asks what is missing, never invents, then writes. */
export function iaSimulada(falas: FalaDemo[], demo: Demo): { resposta: string; mensagem: string | null } {
  const ultimaIa = falas.map((f) => f.quem).lastIndexOf('ia');
  if (ultimaIa >= 0 && /Mensagem preparada/.test(falas[ultimaIa].texto)) {
    return { resposta: 'Na versão de verdade eu ajusto do jeito que você pedir. Aqui na demonstração, mude direto no texto da mensagem ou toque em "Começar de novo".', mensagem: null };
  }
  const dono = falas.filter((f) => f.quem === 'dono').map((f) => f.texto);
  const tudo = dono.join(' \n ');
  const t = norm(tudo);

  if (/sem desconto|so chamar|chamar de volta|sumiu|sumiram|saudade/.test(t) && !precoDe(tudo)) {
    const mensagem = comLinhaSair(`Oi! Aqui é do ${demo.nome} 🍔 Faz um tempinho que a gente não te vê por aqui. Quando bater a vontade, é só pedir que a gente prepara do jeito que você gosta.`);
    return { resposta: 'Fiz uma mensagem de "saudade", sem desconto nenhum. Se quiser, posso colocar uma oferta: é só me dizer qual.', mensagem };
  }

  const combo = /combo/.test(t);
  const produto = produtoDe(tudo, demo.cardapio) || (combo ? 'Combo' : '');
  const preco = precoDe(tudo);
  const validade = validadeDe(tudo);
  const canal = canalDe(tudo);

  if (!produto) return { resposta: `Boa! Qual lanche ou produto você quer colocar na promoção? (ex.: ${demo.cardapio[1]})`, mensagem: null };
  if (combo && !/\b(com|\+|e)\b/.test(norm(dono[dono.length - 1] ?? '')) && dono.length < 2) return { resposta: 'Fechou! O que vem no combo e por quanto vai sair?', mensagem: null };
  if (!preco) return { resposta: `Show, ${produto} então. Por quanto ele vai sair na promoção (ou qual o desconto)?`, mensagem: null };
  if (!validade) return { resposta: 'Vale até quando? Só hoje, até amanhã, no fim de semana…', mensagem: null };
  if (!canal) return { resposta: 'Última coisa: é no delivery, no balcão ou nos dois?', mensagem: null };

  const quando = validade.charAt(0).toUpperCase() + validade.slice(1);
  const oferta = /desconto/.test(preco) ? `o ${produto} tem ${preco}` : `o ${produto} sai por ${preco}`;
  const mensagem = comLinhaSair(`Oi! Aqui é do ${demo.nome} 🍔 ${quando}, ${oferta} ${canal}. Bora matar a vontade?`);
  return { resposta: 'Pronto, deixei a mensagem aqui embaixo. Se quiser mudar alguma coisa, é só falar.', mensagem };
}

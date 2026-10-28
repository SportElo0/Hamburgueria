import { storeSchema, type Store } from '../schema';
import { DEFAULT_ORDERING, type Order, type PaymentMethod } from '../ordering';
import type { CostSheet } from './custos';

/**
 * Loja de demonstração do Growlift Intelligence, com DADOS FICTÍCIOS gerados por
 * sorteio com semente fixa (sempre os mesmos números). Serve para mostrar o painel
 * sem usar dados de clientes reais. Nunca é publicada: só existe como rascunho no painel.
 */

export const DEMO_SLUG = 'demo-inteligencia';
export const DEMO_NAME = 'Hamburgueria Exemplo (dados fictícios)';
export const isDemo = (slug: string) => slug === DEMO_SLUG;

/** Gerador pseudoaleatório com semente (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DemoItem {
  id: string;
  category: string;
  name: string;
  price: number;
  /** Peso relativo na escolha (popularidade). */
  weight: number;
}

const ITEMS: DemoItem[] = [
  { id: 'classico', category: 'burgers', name: 'Clássico', price: 3490, weight: 30 },
  { id: 'duplo-bacon', category: 'burgers', name: 'Duplo Bacon', price: 4290, weight: 24 },
  { id: 'smash-salada', category: 'burgers', name: 'Smash Salada', price: 3490, weight: 9 },
  { id: 'costela-defumada', category: 'burgers', name: 'Costela Defumada', price: 4990, weight: 5 },
  { id: 'veggie', category: 'burgers', name: 'Veggie de Grão-de-Bico', price: 3690, weight: 3 },
  { id: 'fritas', category: 'acompanhamentos', name: 'Fritas Média', price: 1890, weight: 22 },
  { id: 'onion-rings', category: 'acompanhamentos', name: 'Onion Rings', price: 2290, weight: 6 },
  { id: 'refri-lata', category: 'bebidas', name: 'Refrigerante Lata', price: 690, weight: 26 },
  { id: 'suco-natural', category: 'bebidas', name: 'Suco Natural', price: 1190, weight: 5 },
  { id: 'milkshake', category: 'sobremesas', name: 'Milkshake de Doce de Leite', price: 2190, weight: 4 },
  { id: 'brownie', category: 'sobremesas', name: 'Brownie', price: 1490, weight: 3 },
];

const CATEGORY_NAME: Record<string, string> = {
  burgers: 'Burgers',
  acompanhamentos: 'Acompanhamentos',
  bebidas: 'Bebidas',
  sobremesas: 'Sobremesas',
};

export function demoStore(): Store {
  const categories = Object.keys(CATEGORY_NAME).map((cat) => ({
    id: cat,
    name: CATEGORY_NAME[cat],
    description: '',
    items: ITEMS.filter((i) => i.category === cat).map((i) => ({
      id: i.id,
      name: i.name,
      description: '',
      price: i.price,
      priceLabel: '',
      image: '',
      imageAlt: '',
      available: true,
      featured: false,
      tags: [],
      options: [],
    })),
  }));
  return storeSchema.parse({
    slug: DEMO_SLUG,
    name: DEMO_NAME,
    segment: 'restaurante',
    siteUrl: '',
    contact: { whatsapp: '', instagram: '', email: '', phone: '' },
    units: [],
    notice: { active: false, text: '' },
    catalog: { categories },
    extra: { demo: true },
    ordering: { ...DEFAULT_ORDERING },
    account: {
      plan: 'parceiro',
      changeLimit: null,
      partnerUntil: '',
      monthlyFee: null,
      extraPrice: null,
      notes: 'Loja de demonstração do Growlift Intelligence. Todos os pedidos, clientes e custos são fictícios. Não publicar.',
    },
  });
}

/** Custos fictícios, coerentes com uma hamburgueria (insumos em centavos por unidade). */
export function demoCostSheet(): CostSheet {
  const ing = (id: string, name: string, unit: 'kg' | 'un' | 'l', costPerUnit: number) => ({ id, name, unit, costPerUnit });
  const ficha = (recipe: [string, number][], packaging: number | null = null) => ({
    mode: 'ficha' as const,
    unitCost: null,
    recipe: recipe.map(([ingredientId, quantity]) => ({ ingredientId, quantity })),
    packaging,
  });
  const manual = (unitCost: number, packaging: number | null = null) => ({ mode: 'manual' as const, unitCost, recipe: [], packaging });
  return {
    fees: { pix: 99, cartao: 349, dinheiro: 0 },
    feesConfirmed: true,
    packagingDefault: 120,
    ingredients: [
      ing('blend', 'Blend bovino', 'kg', 4890),
      ing('pao', 'Pão brioche', 'un', 140),
      ing('queijo', 'Queijo cheddar', 'kg', 5600),
      ing('bacon', 'Bacon', 'kg', 5200),
      ing('salada', 'Alface e tomate', 'kg', 1400),
      ing('molho', 'Molho da casa', 'kg', 2200),
      ing('costela', 'Costela desfiada', 'kg', 7800),
      ing('grao', 'Hambúrguer de grão-de-bico', 'un', 1350),
      ing('batata', 'Batata congelada', 'kg', 1890),
      ing('cebola', 'Onion rings congelado', 'kg', 3200),
    ],
    products: {
      classico: ficha([['blend', 0.15], ['pao', 1], ['queijo', 0.03], ['molho', 0.02], ['salada', 0.03]]),
      'duplo-bacon': ficha([['blend', 0.3], ['pao', 1], ['queijo', 0.06], ['bacon', 0.06], ['molho', 0.02]]),
      'smash-salada': ficha([['blend', 0.12], ['pao', 1], ['queijo', 0.03], ['salada', 0.06], ['molho', 0.02]]),
      'costela-defumada': ficha([['costela', 0.16], ['pao', 1], ['queijo', 0.04], ['molho', 0.03]]),
      veggie: ficha([['grao', 1], ['pao', 1], ['salada', 0.05], ['molho', 0.02]]),
      fritas: ficha([['batata', 0.2]], 90),
      'onion-rings': ficha([['cebola', 0.18]], 90),
      'refri-lata': manual(310, 0),
      'suco-natural': manual(380, 60),
      // Milkshake e brownie ficam sem custo de propósito: a demo mostra o aviso de custos faltando.
    },
  };
}

const TZ_OFFSET_HOURS = 3; // São Paulo, sem horário de verão

/**
 * Pedidos fictícios dos `days` dias até `today` (YYYY-MM-DD), um documento por dia.
 * Sexta e sábado vendem mais; o último mês tem ticket um pouco menor (menos bebidas),
 * para a demo mostrar uma comparação entre períodos.
 */
export function demoOrders(today: string, days: number, seed = 20261028): { day: string; orders: Order[] }[] {
  const rand = rng(seed);
  const pick = <T,>(list: T[], weightOf: (t: T) => number) => {
    const total = list.reduce((s, t) => s + weightOf(t), 0);
    let r = rand() * total;
    for (const t of list) {
      r -= weightOf(t);
      if (r <= 0) return t;
    }
    return list[list.length - 1];
  };
  const burgers = ITEMS.filter((i) => i.category === 'burgers');
  const sides = ITEMS.filter((i) => i.category !== 'burgers');
  const customers = Array.from({ length: 420 }, (_, i) => ({ name: `Cliente fictício ${i + 1}`, phone: `DEMO${String(i + 1).padStart(4, '0')}` }));
  const regulars = customers.slice(0, 60);

  const base = Date.parse(`${today}T12:00:00Z`);
  const out: { day: string; orders: Order[] }[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(base - d * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    const weekday = date.getUTCDay();
    const recent = d < 30;
    const volume = [14, 9, 11, 13, 17, 30, 32][weekday] + Math.floor(rand() * 6);
    const orders: Order[] = [];
    for (let n = 0; n < volume; n++) {
      const lines: Order['lines'] = [];
      const add = (item: DemoItem, quantity: number) => {
        const existing = lines.find((l) => l.productId === item.id);
        if (existing) {
          existing.quantity += quantity;
          existing.total += item.price * quantity;
          return;
        }
        lines.push({ productId: item.id, name: item.name, quantity, unit: item.price, total: item.price * quantity, options: [], notes: '' });
      };
      const people = rand() < 0.55 ? 1 : rand() < 0.75 ? 2 : 3;
      for (let p = 0; p < people; p++) add(pick(burgers, (i) => i.weight), 1);
      const extras = Math.floor(rand() * (people + 1.6));
      for (let e = 0; e < extras; e++) {
        const item = pick(sides, (i) => (recent && i.category === 'bebidas' ? i.weight * 0.55 : i.weight));
        add(item, 1);
      }
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const mode: Order['mode'] = rand() < 0.68 ? 'entrega' : 'retirada';
      const deliveryFee = mode === 'entrega' ? [500, 700, 900][Math.floor(rand() * 3)] : 0;
      const useCoupon = rand() < 0.07;
      const discount = useCoupon ? Math.round(subtotal * 0.1) : 0;
      const method: PaymentMethod = rand() < 0.52 ? 'pix' : rand() < 0.85 ? 'cartao' : 'dinheiro';
      const customer = rand() < 0.45 ? regulars[Math.floor(rand() * regulars.length)] : customers[Math.floor(rand() * customers.length)];
      const hour = pick([11, 12, 13, 18, 19, 20, 21, 22], (h) => ({ 11: 3, 12: 6, 13: 4, 18: 5, 19: 10, 20: 12, 21: 8, 22: 4 })[h] ?? 1);
      const created = new Date(Date.parse(`${day}T00:00:00Z`) + (hour + TZ_OFFSET_HOURS) * 3_600_000 + Math.floor(rand() * 3_600_000));
      const refused = rand() < 0.025;
      const status = refused ? 'recusado' : 'concluido';
      const id = `${day.replace(/-/g, '')}-${String(n).padStart(4, '0')}demo00`.slice(0, 19);
      orders.push({
        id,
        number: n + 1,
        tokenHash: '',
        createdAt: created.toISOString(),
        updatedAt: created.toISOString(),
        status,
        history: [{ status, at: created.toISOString(), by: 'demo' }],
        customer: { name: customer.name, phone: customer.phone, email: '' },
        mode,
        address: mode === 'entrega' ? { area: 'Bairro fictício', street: 'Rua fictícia', reference: '' } : null,
        payment: { method, status: method === 'pix' ? 'pago' : 'na-entrega', changeFor: null, pix: null, paidAt: method === 'pix' ? created.toISOString() : null },
        lines,
        subtotal,
        deliveryFee,
        feePending: false,
        discount,
        coupon: useCoupon ? 'BEMVINDO10' : '',
        total: subtotal - discount + deliveryFee,
        note: '',
        optIn: rand() < 0.4,
        reason: refused ? 'Demonstração' : '',
      });
    }
    out.push({ day, orders });
  }
  return out;
}

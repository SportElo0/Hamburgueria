// Downtown Burger menu, transcribed from the restaurant's printed menu.
// Prices are integer centavos (BRL). Edit prices, names and descriptions here; the UI reads only this file.
// Images are illustrative 3D renders (tools/studio), never official product photography.
import renders from './renders.json';

export type CategoryId = 'burgers' | 'entradas' | 'adicionais' | 'bebidas' | 'long-necks' | 'sobremesas';

export interface OptionChoice {
  id: string;
  label: string;
  /** Extra charge in centavos. 0 for included choices. */
  priceDelta: number;
  /** Optional image override when this choice is selected (e.g. milkshake flavour). */
  image?: string;
}

export interface OptionGroup {
  id: string;
  label: string;
  type: 'single' | 'multiple';
  required: boolean;
  /** Included in the price (shown as "incluso" and never charged). */
  included?: boolean;
  hint?: string;
  choices: OptionChoice[];
}

export interface Product {
  id: string;
  category: CategoryId;
  name: string;
  description?: string;
  price: number;
  image: string;
  imageAlt: string;
  /** Layered render id when an exploded view exists. */
  layers?: string;
  includes?: string[];
  options?: OptionGroup[];
  alcoholic?: boolean;
}

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export const categories: Category[] = [
  { id: 'burgers', label: 'Burgers', blurb: 'Blend bovino na chapa, pão macio e o que mais você pedir.' },
  { id: 'entradas', label: 'Entradas', blurb: 'Pra dividir. Ou não.' },
  { id: 'adicionais', label: 'Adicionais', blurb: 'Turbine qualquer burger na hora de personalizar.' },
  { id: 'bebidas', label: 'Bebidas', blurb: 'Geladas.' },
  { id: 'long-necks', label: 'Long Necks', blurb: 'Venda proibida para menores de 18 anos.' },
  { id: 'sobremesas', label: 'Sobremesas', blurb: 'Pra fechar com chave de ouro.' },
];

export const addons: OptionChoice[] = [
  { id: 'cheddar-cremoso', label: 'Cheddar cremoso', priceDelta: 500 },
  { id: 'cream-cheese', label: 'Cream cheese', priceDelta: 500 },
  { id: 'queijo-prato', label: 'Queijo prato', priceDelta: 500 },
  { id: 'maionese-artesanal', label: 'Maionese artesanal', priceDelta: 500 },
  { id: 'salada', label: 'Salada (alface, tomate e cebola)', priceDelta: 500 },
  { id: 'blend-160', label: 'Blend de carne 160 g', priceDelta: 2500 },
];

const extrasGroup: OptionGroup = {
  id: 'adicionais',
  label: 'Adicionais',
  type: 'multiple',
  required: false,
  hint: 'Opcional',
  choices: addons,
};

const burger = (id: keyof typeof renders.burgers) => ({
  image: renders.burgers[id].card,
  layers: id,
  options: [extrasGroup],
});

const prop = (id: keyof typeof renders.props) => renders.props[id].src;

export const products: Product[] = [
  // ── Burgers ──
  {
    id: 'downtown-classic',
    category: 'burgers',
    name: 'Downtown Classic',
    description: 'Pão brioche, blend bovino 180 g, queijo prato e maionese da casa.',
    price: 3990,
    imageAlt: 'Ilustração 3D do Downtown Classic: pão brioche, blend bovino, queijo prato e maionese.',
    ...burger('downtown-classic'),
  },
  {
    id: 'the-bacon-street',
    category: 'burgers',
    name: 'The Bacon Street',
    description:
      'Pão brioche, blend bovino 180 g, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.',
    price: 4490,
    imageAlt: 'Ilustração 3D do The Bacon Street com bacon, alface, tomate e cebola roxa.',
    ...burger('the-bacon-street'),
  },
  {
    id: 'australian-cheddar',
    category: 'burgers',
    name: 'Australian Cheddar',
    description: 'Pão australiano, blend bovino 180 g, queijo cheddar, bacon, cebola caramelizada e maionese da casa.',
    price: 5890,
    imageAlt: 'Ilustração 3D do Australian Cheddar no pão australiano com cheddar e cebola caramelizada.',
    ...burger('australian-cheddar'),
  },
  {
    id: 'kill-bill',
    category: 'burgers',
    name: 'Kill Bill',
    description:
      'Pão australiano, blend bovino 180 g, queijo cheddar, bacon, rúcula, tomate, cebola roxa e maionese da casa.',
    price: 5890,
    imageAlt: 'Ilustração 3D do Kill Bill no pão australiano com cheddar, bacon e rúcula.',
    ...burger('kill-bill'),
  },
  {
    id: 'golden-chicken',
    category: 'burgers',
    name: 'Golden Chicken',
    description: 'Pão brioche, sobrecoxa desossada empanada, queijo prato e coleslaw com maionese da casa.',
    price: 4990,
    imageAlt: 'Ilustração 3D do Golden Chicken com frango empanado e coleslaw.',
    ...burger('golden-chicken'),
  },
  {
    id: 'holyfield',
    category: 'burgers',
    name: 'Holyfield',
    description:
      'Pão brioche, dois blends bovinos de 130 g cada, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.',
    price: 6990,
    imageAlt: 'Ilustração 3D do Holyfield com dois blends bovinos.',
    ...burger('holyfield'),
  },
  {
    id: 'green-burger',
    category: 'burgers',
    name: 'Green Burger',
    description:
      'Pão brioche, burger à base de plantas, queijo prato, alface americana, tomate, cebola roxa e maionese da casa.',
    price: 5990,
    imageAlt: 'Ilustração 3D do Green Burger com burger à base de plantas.',
    ...burger('green-burger'),
  },
  {
    id: 'little-downtown',
    category: 'burgers',
    name: 'Little Downtown',
    description: 'Pão brioche, blend bovino 100 g e queijo prato. Acompanha batata frita e suco de uva ou laranja.',
    price: 3990,
    image: prop('little-downtown-laranja'),
    imageAlt: 'Ilustração 3D do Little Downtown com batata frita e suco.',
    layers: 'little-downtown',
    includes: ['Batata frita', 'Suco de uva ou laranja'],
    options: [
      {
        id: 'suco',
        label: 'Suco incluso',
        type: 'single',
        required: true,
        included: true,
        hint: 'Escolha 1 · sem custo',
        choices: [
          { id: 'laranja', label: 'Laranja', priceDelta: 0, image: prop('little-downtown-laranja') },
          { id: 'uva', label: 'Uva', priceDelta: 0, image: prop('little-downtown-uva') },
        ],
      },
      extrasGroup,
    ],
  },

  // ── Entradas ──
  {
    id: 'bacon-cheddar-fries',
    category: 'entradas',
    name: 'Bacon Cheddar Fries',
    description: 'Batata frita palito fininha (300 g), cheddar e bacon.',
    price: 3490,
    image: prop('bacon-cheddar-fries'),
    imageAlt: 'Ilustração 3D de batata frita fininha com cheddar e bacon na cestinha.',
  },
  {
    id: 'croc-canoa',
    category: 'entradas',
    name: 'Croc Canoa',
    description: 'Batata frita canoa (300 g), cream cheese, bacon e cebolinha.',
    price: 3990,
    image: prop('croc-canoa'),
    imageAlt: 'Ilustração 3D de batata canoa com cream cheese, bacon e cebolinha.',
  },
  {
    id: 'downtown-nuggets',
    category: 'entradas',
    name: 'Downtown Nuggets',
    description: '5 unidades de nuggets, acompanhadas de molho da casa.',
    price: 2490,
    image: prop('downtown-nuggets'),
    imageAlt: 'Ilustração 3D de cinco nuggets com molho da casa.',
  },
  {
    id: 'classic-fries',
    category: 'entradas',
    name: 'Classic Fries',
    description: 'Batata frita palito (300 g), acompanhada de molho da casa.',
    price: 2390,
    image: prop('classic-fries'),
    imageAlt: 'Ilustração 3D de batata frita palito na cestinha com molho.',
  },

  // ── Bebidas ──
  { id: 'agua', category: 'bebidas', name: 'Água', price: 600, image: prop('drink-agua'), imageAlt: 'Copo de água.' },
  { id: 'agua-com-gas', category: 'bebidas', name: 'Água com gás', price: 1000, image: prop('drink-agua-gas'), imageAlt: 'Copo de água com gás.' },
  { id: 'coca-ks', category: 'bebidas', name: 'Coca KS', price: 1200, image: prop('drink-cola'), imageAlt: 'Copo de refrigerante de cola.' },
  { id: 'coca-ks-zero', category: 'bebidas', name: 'Coca KS Zero', price: 1200, image: prop('drink-cola'), imageAlt: 'Copo de refrigerante de cola.' },
  { id: 'agua-tonica', category: 'bebidas', name: 'Água tônica', price: 1000, image: prop('drink-tonica'), imageAlt: 'Copo de água tônica.' },
  { id: 'tubaina', category: 'bebidas', name: 'Tubaína', price: 1200, image: prop('drink-tubaina'), imageAlt: 'Copo de tubaína.' },
  { id: 'schweppes', category: 'bebidas', name: 'Schweppes', price: 1200, image: prop('drink-citrus'), imageAlt: 'Copo de refrigerante gaseificado.' },
  { id: 'guarana', category: 'bebidas', name: 'Guaraná', price: 1000, image: prop('drink-guarana'), imageAlt: 'Copo de guaraná.' },
  {
    id: 'suco-laranja',
    category: 'bebidas',
    name: 'Suco natural One de laranja',
    price: 1200,
    image: prop('drink-laranja'),
    imageAlt: 'Copo de suco de laranja.',
  },
  { id: 'pink-lemonade', category: 'bebidas', name: 'Pink Lemonade', price: 1500, image: prop('drink-pink-lemonade'), imageAlt: 'Copo de pink lemonade.' },

  // ── Long necks ──
  ...(
    [
      ['heineken', 'Heineken', 1500],
      ['praya', 'Praya', 1500],
      ['praya-classica', 'Praya Clássica', 1500],
      ['amstel-ultra', 'Amstel Ultra', 1500],
      ['lagunitas-ipa', 'Lagunitas IPA', 1800],
      ['blue-moon', 'Blue Moon', 1800],
      ['eisenbahn', 'Eisenbahn', 1300],
    ] as const
  ).map(
    ([id, name, price]): Product => ({
      id,
      category: 'long-necks',
      name,
      price,
      image: prop('longneck'),
      imageAlt: 'Garrafa long neck genérica, sem rótulo.',
      alcoholic: true,
    }),
  ),

  // ── Sobremesas ──
  {
    id: 'brownie',
    category: 'sobremesas',
    name: 'Brownie de chocolate com sorvete de creme',
    price: 3490,
    image: prop('brownie'),
    imageAlt: 'Ilustração 3D de brownie de chocolate com bola de sorvete de creme.',
  },
  {
    id: 'milkshake',
    category: 'sobremesas',
    name: 'Milkshake',
    description: 'Morango ou Nutella ou baunilha.',
    price: 3490,
    image: prop('milkshake-morango'),
    imageAlt: 'Ilustração 3D de milkshake com chantilly e canudo.',
    options: [
      {
        id: 'sabor',
        label: 'Sabor',
        type: 'single',
        required: true,
        hint: 'Escolha 1',
        choices: [
          { id: 'morango', label: 'Morango', priceDelta: 0, image: prop('milkshake-morango') },
          { id: 'nutella', label: 'Nutella', priceDelta: 0, image: prop('milkshake-nutella') },
          { id: 'baunilha', label: 'Baunilha', priceDelta: 0, image: prop('milkshake-baunilha') },
        ],
      },
    ],
  },
];

export const productById = new Map(products.map((p) => [p.id, p]));

export const productsByCategory = (id: CategoryId) => products.filter((p) => p.category === id);

/** The burger that plays the lead in the cinematic story. */
export const HERO_PRODUCT_ID = 'the-bacon-street';
export const SIGNATURE_IDS = ['downtown-classic', 'the-bacon-street', 'australian-cheddar', 'kill-bill'] as const;

// Downtown Burger menu, transcribed from the restaurant's printed menu.
// Prices are integer centavos (BRL). Edit prices, names and descriptions here; the UI reads only this file.
// Product images are cut from a photo of the printed menu (tools/photos). The 3D renders
// (tools/studio) remain only for the layer-by-layer "por dentro" view of each burger.
import photos from './photos.json';
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

const photo = (id: keyof typeof photos.items) => photos.items[id].src;

const burger = (id: keyof typeof renders.burgers & keyof typeof photos.items) => ({
  image: photo(id),
  layers: id,
  options: [extrasGroup],
});

/** Shared art the printed menu uses for a whole section (one glass for drinks, one bottle for long necks). */
export const SECTION_ART = {
  bebidas: { src: photo('refrigerante'), alt: 'Ilustração do cardápio: copo de refrigerante com gelo.' },
  'long-necks': { src: photo('long-neck'), alt: 'Ilustração do cardápio: garrafa long neck.' },
} as const;

export const products: Product[] = [
  // ── Burgers ──
  {
    id: 'downtown-classic',
    category: 'burgers',
    name: 'Downtown Classic',
    description: 'Pão brioche, blend bovino 180 g, queijo prato e maionese da casa.',
    price: 3990,
    imageAlt: 'Downtown Classic, foto do cardápio.',
    ...burger('downtown-classic'),
  },
  {
    id: 'the-bacon-street',
    category: 'burgers',
    name: 'The Bacon Street',
    description:
      'Pão brioche, blend bovino 180 g, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.',
    price: 4490,
    imageAlt: 'The Bacon Street, foto do cardápio.',
    ...burger('the-bacon-street'),
  },
  {
    id: 'australian-cheddar',
    category: 'burgers',
    name: 'Australian Cheddar',
    description: 'Pão australiano, blend bovino 180 g, queijo cheddar, bacon, cebola caramelizada e maionese da casa.',
    price: 5890,
    imageAlt: 'Australian Cheddar, foto do cardápio.',
    ...burger('australian-cheddar'),
  },
  {
    id: 'kill-bill',
    category: 'burgers',
    name: 'Kill Bill',
    description:
      'Pão australiano, blend bovino 180 g, queijo cheddar, bacon, rúcula, tomate, cebola roxa e maionese da casa.',
    price: 5890,
    imageAlt: 'Kill Bill, foto do cardápio.',
    ...burger('kill-bill'),
  },
  {
    id: 'golden-chicken',
    category: 'burgers',
    name: 'Golden Chicken',
    description: 'Pão brioche, sobrecoxa desossada empanada, queijo prato e coleslaw com maionese da casa.',
    price: 4990,
    imageAlt: 'Golden Chicken, foto do cardápio.',
    ...burger('golden-chicken'),
  },
  {
    id: 'holyfield',
    category: 'burgers',
    name: 'Holyfield',
    description:
      'Pão brioche, dois blends bovinos de 130 g cada, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.',
    price: 6990,
    imageAlt: 'Holyfield, foto do cardápio.',
    ...burger('holyfield'),
  },
  {
    id: 'green-burger',
    category: 'burgers',
    name: 'Green Burger',
    description:
      'Pão brioche, burger à base de plantas, queijo prato, alface americana, tomate, cebola roxa e maionese da casa.',
    price: 5990,
    imageAlt: 'Green Burger, foto do cardápio.',
    ...burger('green-burger'),
  },
  {
    id: 'little-downtown',
    category: 'burgers',
    name: 'Little Downtown',
    description: 'Pão brioche, blend bovino 100 g e queijo prato. Acompanha batata frita e suco de uva ou laranja.',
    price: 3990,
    image: photo('little-downtown'),
    imageAlt: 'Little Downtown, foto do cardápio.',
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
          { id: 'laranja', label: 'Laranja', priceDelta: 0 },
          { id: 'uva', label: 'Uva', priceDelta: 0 },
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
    image: photo('bacon-cheddar-fries'),
    imageAlt: 'Bacon Cheddar Fries na cestinha, foto do cardápio.',
  },
  {
    id: 'croc-canoa',
    category: 'entradas',
    name: 'Croc Canoa',
    description: 'Batata frita canoa (300 g), cream cheese, bacon e cebolinha.',
    price: 3990,
    image: photo('croc-canoa'),
    imageAlt: 'Croc Canoa com cream cheese, bacon e cebolinha, foto do cardápio.',
  },
  {
    id: 'downtown-nuggets',
    category: 'entradas',
    name: 'Downtown Nuggets',
    description: '5 unidades de nuggets, acompanhadas de molho da casa.',
    price: 2490,
    image: photo('downtown-nuggets'),
    imageAlt: 'Downtown Nuggets com molho da casa, foto do cardápio.',
  },
  {
    id: 'classic-fries',
    category: 'entradas',
    name: 'Classic Fries',
    description: 'Batata frita palito (300 g), acompanhada de molho da casa.',
    price: 2390,
    image: photo('classic-fries'),
    imageAlt: 'Classic Fries na cestinha, foto do cardápio.',
  },

  // ── Bebidas ──
  { id: 'agua', category: 'bebidas', name: 'Água', price: 600, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'agua-com-gas', category: 'bebidas', name: 'Água com gás', price: 1000, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'coca-ks', category: 'bebidas', name: 'Coca KS', price: 1200, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'coca-ks-zero', category: 'bebidas', name: 'Coca KS Zero', price: 1200, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'agua-tonica', category: 'bebidas', name: 'Água tônica', price: 1000, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'tubaina', category: 'bebidas', name: 'Tubaína', price: 1200, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'schweppes', category: 'bebidas', name: 'Schweppes', price: 1200, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  { id: 'guarana', category: 'bebidas', name: 'Guaraná', price: 1000, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },
  {
    id: 'suco-laranja',
    category: 'bebidas',
    name: 'Suco natural One de laranja',
    price: 1200,
    image: SECTION_ART.bebidas.src,
    imageAlt: SECTION_ART.bebidas.alt,
  },
  { id: 'pink-lemonade', category: 'bebidas', name: 'Pink Lemonade', price: 1500, image: SECTION_ART.bebidas.src, imageAlt: SECTION_ART.bebidas.alt },

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
      image: SECTION_ART['long-necks'].src,
      imageAlt: SECTION_ART['long-necks'].alt,
      alcoholic: true,
    }),
  ),

  // ── Sobremesas ──
  {
    id: 'brownie',
    category: 'sobremesas',
    name: 'Brownie de chocolate com sorvete de creme',
    price: 3490,
    image: photo('brownie'),
    imageAlt: 'Brownie de chocolate com sorvete de creme e calda, foto do cardápio.',
  },
  {
    id: 'milkshake',
    category: 'sobremesas',
    name: 'Milkshake',
    description: 'Morango ou Nutella ou baunilha.',
    price: 3490,
    image: photo('milkshake'),
    imageAlt: 'Milkshake com chantilly e canudo, foto do cardápio.',
    options: [
      {
        id: 'sabor',
        label: 'Sabor',
        type: 'single',
        required: true,
        hint: 'Escolha 1',
        choices: [
          { id: 'morango', label: 'Morango', priceDelta: 0 },
          { id: 'nutella', label: 'Nutella', priceDelta: 0 },
          { id: 'baunilha', label: 'Baunilha', priceDelta: 0 },
        ],
      },
    ],
  },
];

export const productById = new Map(products.map((p) => [p.id, p]));

export const productsByCategory = (id: CategoryId) => products.filter((p) => p.category === id);

/** The burger that plays the lead in the cinematic story: the large burger printed on the menu. */
export const HERO_PRODUCT_ID = 'holyfield';
export const SIGNATURE_IDS = ['downtown-classic', 'holyfield', 'australian-cheddar', 'kill-bill'] as const;

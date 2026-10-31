// El Patron menu ("Cardápio El Burger Del Mal"), transcribed from the restaurant's own menu pages.
// Prices are integer centavos (BRL). Edit prices, names and descriptions here; the UI reads only this file.
// Burger photos are cut from those same pages (tools/photos). The 3D renders (tools/studio) drive the
// layer-by-layer "por dentro" view, and stand in as illustrations for the clássicos, which the menu
// prints without a photo.
import photos from './photos.json';
import renders from './renders.json';

export type CategoryId = 'chefoes' | 'especiais' | 'classicos' | 'porcoes' | 'adicionais' | 'bebidas' | 'sobremesas';

export interface OptionChoice {
  id: string;
  label: string;
  /** Extra charge in centavos. 0 for included choices. */
  priceDelta: number;
  /** Optional image override when this choice is selected. */
  image?: string;
}

export interface OptionGroup {
  id: string;
  label: string;
  type: 'single' | 'multiple';
  required: boolean;
  /** Included in the price (shown as "incluso" and never charged). */
  included?: boolean;
  /** The choice picks a version of the product (portion size): shown with its full price, first one preselected. */
  variant?: boolean;
  hint?: string;
  choices: OptionChoice[];
}

export interface Product {
  id: string;
  category: CategoryId;
  name: string;
  description?: string;
  price: number;
  /** Menu photo, when the printed menu has one. */
  image?: string;
  imageAlt?: string;
  /** Layered render id when an exploded view exists. */
  layers?: string;
  /** Marks printed beside the name on the menu: ★ or the chilli. */
  mark?: 'star' | 'spicy';
  options?: OptionGroup[];
}

export interface Category {
  id: CategoryId;
  /** Short label for the category rail. */
  label: string;
  /** Heading as printed on the menu. */
  title: string;
  blurb: string;
}

export const categories: Category[] = [
  { id: 'chefoes', label: 'Chefões', title: 'Os Chefões da Casa', blurb: 'Os pesos-pesados do cardápio.' },
  { id: 'especiais', label: 'Especiais', title: 'Burgers Especiais', blurb: 'Smash e hambúrgueres de 120 g.' },
  { id: 'classicos', label: 'Clássicos', title: 'Clássicos', blurb: 'No pão de brioche, sem rodeio.' },
  { id: 'porcoes', label: 'Porções', title: 'Porções', blurb: 'Pra dividir com a família.' },
  { id: 'adicionais', label: 'Adicionais', title: 'Adicionais', blurb: 'Turbine qualquer burger na hora de pedir.' },
  { id: 'bebidas', label: 'Bebidas', title: 'Bebidas', blurb: 'Pra acompanhar.' },
  { id: 'sobremesas', label: 'Sobremesas', title: 'Sobremesas', blurb: 'Pra fechar o pedido.' },
];

/** Categories sold as burgers: they take add-ons and appear in the add-on picker. */
export const BURGER_CATEGORIES: readonly CategoryId[] = ['chefoes', 'especiais', 'classicos'];

export const addons: OptionChoice[] = [
  { id: 'molho-verde', label: 'Molho verde', priceDelta: 299 },
  { id: 'molho-mostarda', label: 'Molho mostarda temperada', priceDelta: 299 },
  { id: 'molho-rose-bacon', label: 'Molho rose com bacon', priceDelta: 399 },
  { id: 'cheddar-cremoso', label: 'Cheddar cremoso', priceDelta: 399 },
  { id: 'queijo', label: 'Queijo', priceDelta: 499 },
  { id: 'bacon', label: 'Bacon', priceDelta: 699 },
  { id: 'hamburguer-120', label: 'Hambúrguer 120 g', priceDelta: 699 },
  { id: 'hamburguer-180', label: 'Hambúrguer 180 g', priceDelta: 999 },
  { id: 'hamburguer-180-recheado', label: 'Hambúrguer 180 g recheado com cheddar', priceDelta: 1299 },
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

type RenderId = keyof typeof renders.burgers;

const burger = (id: keyof typeof photos.items & RenderId, name: string) => ({
  id,
  name,
  image: photo(id),
  imageAlt: `${name}, foto do cardápio.`,
  layers: id,
  options: [extrasGroup],
});

/** Clássicos: no photo on the menu, so the 3D illustration of the same stack stands in. */
const classic = (id: RenderId, name: string) => ({
  id,
  name,
  image: renders.burgers[id].card,
  imageAlt: `${name}, ilustração das camadas.`,
  layers: id,
  options: [extrasGroup],
});

/** Small / large portion, priced as on the menu. */
const sizes = (small: number, large: number): OptionGroup[] => [
  {
    id: 'tamanho',
    label: 'Tamanho',
    type: 'single',
    required: true,
    variant: true,
    hint: 'Escolha 1',
    choices: [
      { id: 'pequena', label: 'Pequena', priceDelta: 0 },
      { id: 'grande', label: 'Grande', priceDelta: large - small },
    ],
  },
];

export const products: Product[] = [
  // ── Os chefões da casa ──
  {
    ...burger('el-patron', 'El Patron'),
    category: 'chefoes',
    mark: 'star',
    description:
      'Pão com gergelim, 2 suculentos e enormes hambúrgueres de 180 g cada de carne bovina, recheados com cheddar, queijo mussarela, longas tiras de bacon e molho barbecue.',
    price: 4799,
  },
  {
    ...burger('al-capone', 'Al Capone'),
    category: 'chefoes',
    mark: 'star',
    description: 'Pão australiano, hambúrguer de 180 g, queijo mussarela, muito bacon, cebola roxa e maionese temperada.',
    price: 3299,
  },
  {
    ...burger('ochoa', 'Ochoa'),
    category: 'chefoes',
    mark: 'star',
    description:
      'Pão australiano, hambúrguer de 180 g empanado e recheado com cheddar, cebola roxa refogada no molho inglês, molho rose e bacon triturado.',
    price: 2999,
  },
  {
    ...burger('el-chapo', 'El Chapo'),
    category: 'chefoes',
    mark: 'spicy',
    description:
      'Pão com gergelim, hambúrguer de 180 g recheado com cheddar cremoso, vinagrete muito picante, acompanha molho de maionese verde e bacon.',
    price: 3199,
  },
  {
    ...burger('abadia', 'Abadia'),
    category: 'chefoes',
    description: 'Pão australiano, filé de frango empanado, alface, tomate, presunto e queijo empanado e delicioso molho de hortelã.',
    price: 3199,
  },

  // ── Burgers especiais ──
  {
    ...burger('dimas', 'Dimas'),
    category: 'especiais',
    description: 'Pão com gergelim, 2 suculentos hambúrgueres smash de 120 g cada de carne bovina, queijo cheddar, cebola roxa, tomate e alface.',
    price: 3099,
  },
  {
    ...burger('velasquez', 'Velásquez'),
    category: 'especiais',
    description: 'Pão com gergelim, 3 hambúrgueres de 120 g, suculentas fatias de bacon, alface, tomate, queijo mussarela e maionese.',
    price: 3899,
  },
  {
    ...burger('nomura', 'Nomura'),
    category: 'especiais',
    description: 'Pão de brioche, hambúrguer de 120 g, pernil suculento e desfiado ao molho da casa e fatias de cheddar.',
    price: 2999,
  },
  {
    ...burger('lucchese', 'Lucchese'),
    category: 'especiais',
    description: 'Pão com gergelim, 2 hambúrgueres smash de 120 g cada, fatias de pepperoni, cheddar em fatias e molho billy jack.',
    price: 3399,
  },

  // ── Clássicos ──
  {
    ...classic('gacha', 'Gacha'),
    category: 'classicos',
    description: 'Pão de brioche, hambúrguer de 120 g, alface, tomate, queijo mussarela e maionese.',
    price: 1999,
  },
  {
    ...classic('blanco', 'Blanco'),
    category: 'classicos',
    description: 'Pão de brioche, filé de frango, fatias de bacon, alface, tomate, queijo mussarela e maionese.',
    price: 1999,
  },
  {
    ...classic('figueroa', 'Figueroa'),
    category: 'classicos',
    description: 'Pão de brioche, hambúrguer de 120 g, fatias de bacon, alface, tomate, queijo mussarela e maionese.',
    price: 2399,
  },
  {
    ...classic('guzman', 'Gúzman'),
    category: 'classicos',
    description: 'Pão de brioche, hambúrguer de 120 g, queijo mussarela e maionese.',
    price: 1799,
  },

  // ── Porções ──
  {
    id: 'batata-completa',
    category: 'porcoes',
    name: 'Batata frita completa',
    description: 'Cheddar, bacon, mostarda, ketchup, maionese e queijo derretido.',
    price: 1999,
    options: sizes(1999, 3299),
  },
  {
    id: 'batata-simples',
    category: 'porcoes',
    name: 'Batata frita simples',
    description: 'Mostarda, ketchup e maionese.',
    price: 1599,
    options: sizes(1599, 2099),
  },
  {
    id: 'rustica-completa',
    category: 'porcoes',
    name: 'Batata rústica completa',
    description: 'Cheddar, bacon, mostarda, ketchup, maionese e queijo derretido.',
    price: 1999,
    options: sizes(1999, 3399),
  },
  {
    id: 'rustica-simples',
    category: 'porcoes',
    name: 'Batata rústica simples',
    description: 'Mostarda, ketchup e maionese.',
    price: 1599,
    options: sizes(1599, 2199),
  },
  { id: 'chicken', category: 'porcoes', name: 'Chicken 500 g', description: 'Porções crocantes de chicken.', price: 3999 },
  {
    id: 'onion-rings',
    category: 'porcoes',
    name: 'Onion rings',
    description: 'Cebolas empanadas e crocantes.',
    price: 2599,
    options: sizes(2599, 3299),
  },

  // ── Bebidas ──
  { id: 'refri-lata', category: 'bebidas', name: 'Refrigerante lata', price: 699 },
  { id: 'refri-600', category: 'bebidas', name: 'Refrigerante 600 ml', price: 999 },
  { id: 'coca-2l', category: 'bebidas', name: 'Coca-Cola 2 L', price: 1799 },
  { id: 'refri-2l', category: 'bebidas', name: 'Demais refrigerantes 2 L', price: 1599 },
  { id: 'suco-polpa', category: 'bebidas', name: 'Suco de polpa', price: 799 },
  { id: 'agua', category: 'bebidas', name: 'Água 500 ml', price: 499 },

  // ── Sobremesas ──
  { id: 'sorvete-palito', category: 'sobremesas', name: 'Sorvete de palito', price: 400 },
  { id: 'sorvete-massa', category: 'sobremesas', name: 'Sorvete de massa', price: 800 },
];

export const productById = new Map(products.map((p) => [p.id, p]));

export const productsByCategory = (id: CategoryId) => products.filter((p) => p.category === id);

export const isBurger = (p: Product) => BURGER_CATEGORIES.includes(p.category);

/** The burger that leads the story: the house's namesake. */
export const HERO_PRODUCT_ID = 'el-patron';
/** The lineup in the story: the starred chefões and El Chapo, with the hero in the second slot. */
export const SIGNATURE_IDS = ['al-capone', 'el-patron', 'ochoa', 'el-chapo'] as const;

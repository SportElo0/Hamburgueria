// Burger stacks, bottom → top. Ingredients follow the El Patron menu ("Cardápio El Burger Del Mal").
import * as THREE from 'three';
import * as K from './kit.js';

const BUNS = {
  gergelim: { style: 'brioche', seeds: true, top: 'Pão com gergelim', bottom: 'Pão com gergelim' },
  australiano: { style: 'australiano', seeds: false, top: 'Pão australiano', bottom: 'Pão australiano' },
  brioche: { style: 'brioche', seeds: false, top: 'Pão de brioche', bottom: 'Pão de brioche' },
};

const sauce = (key, label, color, sheen, seed, R = 4.3) => ({ ...K.mayo({ label, color, sheen, seed, R }), key, sink: 0.08 });

const L = {
  bunBottom: (b) => ({ ...K.bunBottom({ style: BUNS[b].style, label: BUNS[b].bottom }), key: 'bun-bottom', sink: 0 }),
  bunTop: (b, seed) => ({ ...K.bunTop({ style: BUNS[b].style, seeds: BUNS[b].seeds, seed, label: BUNS[b].top }), key: 'bun-top', sink: 0.06 }),
  lettuce: () => ({ ...K.lettuce({ label: 'Alface' }), key: 'lettuce', label: 'Alface', sink: 0.12 }),
  tomato: () => ({ ...K.tomato(), key: 'tomato', sink: 0.06 }),
  onion: () => ({ ...K.redOnion(), key: 'onion', sink: 0.1 }),
  patty180: (seed, label = 'Hambúrguer 180 g') => ({ ...K.patty({ seed, label }), key: `patty-${seed}`, sink: 0.22 }),
  patty120: (seed, label = 'Hambúrguer 120 g') => ({ ...K.patty({ R: 4.7, H: 1.12, seed, label }), key: `patty-${seed}`, sink: 0.12 }),
  smash: (seed) => ({ ...K.patty({ R: 5.0, H: 0.72, seed, label: 'Hambúrguer smash 120 g' }), key: `patty-${seed}`, sink: 0.08 }),
  chickenFillet: () => ({ ...K.patty({ R: 5.0, H: 0.95, seed: 44, variant: 'chicken', label: 'Filé de frango' }), key: 'chicken', sink: 0.12 }),
  breaded: (key, label, opts) => ({ ...K.friedChicken({ label, ...opts }), key, sink: 0.18 }),
  cheese: (kind, key = 'cheese', dropR = 4.6, seed = 51) => ({ ...K.cheese({ kind, dropR, seed }), key, sink: -0.1 }),
  bacon: (strips = 3, seed = 61) => ({ ...K.bacon({ strips, seed }), key: 'bacon', sink: -0.02 }),
  bits: (key, label, opts) => ({ ...K.caramelizedOnion({ label, ...opts }), key, sink: 0.12 }),
  vinaigrette: () => ({ ...K.diced({ label: 'Vinagrete muito picante', colors: ['#c3220f', '#ece6c8', '#3f8a2a', '#e8590c'], weights: [0.45, 0.25, 0.18, 0.12] }), key: 'vinaigrette', sink: 0.12 }),
  pepperoni: () => ({ ...K.pepperoni(), key: 'pepperoni', sink: 0.04 }),
};

const crushedBacon = () => L.bits('bacon-bits', 'Bacon triturado', { colors: ['#6e1a0c', '#c0602e'], count: 220, step: 0.16, thick: 0.1, segs: 3, height: 0.34, seed: 117 });
const sauteedOnion = () => L.bits('onion-sauteed', 'Cebola roxa refogada', { colors: ['#4a1030', '#8a3a4a'], count: 120, seed: 113 });
const pulledPork = () => L.bits('pork', 'Pernil desfiado', { colors: ['#5a2a10', '#a8602a'], count: 260, step: 0.42, thick: 0.13, segs: 5, height: 0.9, seed: 119 });

export const RECIPES = {
  'el-patron': () => [
    L.bunBottom('gergelim'),
    sauce('bbq-base', 'Molho barbecue', '#5c1a08', '#c25a2a', 122),
    L.patty180(33, 'Hambúrguer 180 g recheado'),
    L.cheese('mussarela'),
    L.bacon(4, 62),
    L.patty180(34, 'Hambúrguer 180 g recheado'),
    sauce('bbq', 'Molho barbecue', '#5c1a08', '#c25a2a', 123, 5.0),
    L.bunTop('gergelim', 12),
  ],
  'al-capone': () => [
    L.bunBottom('australiano'),
    L.patty180(35),
    L.cheese('mussarela'),
    L.bacon(4, 63),
    L.onion(),
    sauce('mayo', 'Maionese temperada', '#efd9a2', '#fff1c8', 124),
    L.bunTop('australiano', 14),
  ],
  ochoa: () => [
    L.bunBottom('australiano'),
    sauce('rose', 'Molho rose', '#efa08c', '#ffd2c4', 125),
    L.breaded('patty', 'Hambúrguer 180 g empanado', { tone: 'dark', seed: 43 }),
    sauteedOnion(),
    crushedBacon(),
    L.bunTop('australiano', 15),
  ],
  'el-chapo': () => [
    L.bunBottom('gergelim'),
    L.vinaigrette(),
    L.patty180(36, 'Hambúrguer 180 g recheado'),
    sauce('green-mayo', 'Maionese verde', '#bfd38c', '#eef7cf', 126),
    L.bacon(3, 64),
    L.bunTop('gergelim', 16),
  ],
  abadia: () => [
    L.bunBottom('australiano'),
    sauce('mint', 'Molho de hortelã', '#cfe2b0', '#f1fae0', 127),
    L.breaded('chicken', 'Filé de frango empanado', { seed: 45 }),
    L.cheese('presunto', 'ham', 4.4, 52),
    L.breaded('cheese', 'Queijo empanado', { R: 4.4, H: 0.9, tone: 'pale', seed: 47 }),
    L.tomato(),
    L.lettuce(),
    L.bunTop('australiano', 17),
  ],
  dimas: () => [
    L.bunBottom('gergelim'),
    L.lettuce(),
    L.tomato(),
    L.smash(37),
    L.cheese('cheddar'),
    L.smash(38),
    L.onion(),
    L.bunTop('gergelim', 18),
  ],
  velasquez: () => [
    L.bunBottom('gergelim'),
    L.lettuce(),
    L.tomato(),
    L.patty120(39),
    L.cheese('mussarela'),
    L.patty120(40),
    L.bacon(3, 65),
    L.patty120(41),
    sauce('mayo', 'Maionese', '#f6eed4', '#fffbe8', 128),
    L.bunTop('gergelim', 19),
  ],
  nomura: () => [L.bunBottom('brioche'), L.patty120(42), L.cheese('cheddar', 'cheese', 4.5, 53), pulledPork(), L.bunTop('brioche', 20)],
  lucchese: () => [
    L.bunBottom('gergelim'),
    L.smash(46),
    L.cheese('cheddar', 'cheese', 4.6, 54),
    L.smash(47),
    L.pepperoni(),
    sauce('billy-jack', 'Molho billy jack', '#b0521c', '#f0a060', 129),
    L.bunTop('gergelim', 21),
  ],
  gacha: () => [L.bunBottom('brioche'), L.lettuce(), L.tomato(), L.patty120(48), L.cheese('mussarela'), sauce('mayo', 'Maionese', '#f6eed4', '#fffbe8', 130), L.bunTop('brioche', 22)],
  blanco: () => [
    L.bunBottom('brioche'), L.lettuce(), L.tomato(), L.chickenFillet(), L.bacon(3, 66), L.cheese('mussarela'), sauce('mayo', 'Maionese', '#f6eed4', '#fffbe8', 131), L.bunTop('brioche', 23),
  ],
  figueroa: () => [
    L.bunBottom('brioche'), L.lettuce(), L.tomato(), L.patty120(49), L.cheese('mussarela'), L.bacon(3, 67), sauce('mayo', 'Maionese', '#f6eed4', '#fffbe8', 132), L.bunTop('brioche', 24),
  ],
  guzman: () => [L.bunBottom('brioche'), L.patty120(50), L.cheese('mussarela'), sauce('mayo', 'Maionese', '#f6eed4', '#fffbe8', 133), L.bunTop('brioche', 25)],
};

export function buildStack(recipeId) {
  const defs = RECIPES[recipeId]();
  const root = new THREE.Group();
  let y = 0;
  const layers = defs.map((d) => {
    y -= d.sink;
    d.group.position.y += y;
    const entry = { key: d.key, label: d.label, group: d.group, y0: y, y1: y + d.height, radius: d.radius };
    y += d.height;
    root.add(d.group);
    return entry;
  });
  return { root, layers, height: y };
}

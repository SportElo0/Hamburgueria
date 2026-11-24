// Burger stacks, bottom → top. Ingredients follow the printed Downtown Burger menu exactly.
import * as THREE from 'three';
import * as K from './kit.js';

const L = {
  bunBottom: (bun) => ({ ...K.bunBottom({ style: bun }), key: 'bun-bottom', sink: 0 }),
  bunTop: (bun, seed) => ({ ...K.bunTop({ style: bun, seed }), key: 'bun-top', sink: 0.06 }),
  lettuce: () => ({ ...K.lettuce(), key: 'lettuce', sink: 0.12 }),
  arugula: () => ({ ...K.arugula(), key: 'arugula', sink: 0.05 }),
  patty180: (seed = 31) => ({ ...K.patty({ seed }), key: 'patty', sink: 0.22 }),
  patty130: (seed) => ({ ...K.patty({ R: 4.75, H: 1.12, seed, label: 'Blend bovino 130 g' }), key: `patty-${seed}`, sink: 0.12 }),
  patty100: () => ({ ...K.patty({ R: 4.3, H: 1.0, seed: 37, label: 'Blend bovino 100 g' }), key: 'patty', sink: 0.12 }),
  plant: () => ({ ...K.patty({ seed: 39, variant: 'plant', label: 'Burger à base de plantas' }), key: 'patty', sink: 0.22 }),
  chicken: () => ({ ...K.friedChicken(), key: 'chicken', sink: 0.18 }),
  prato: (dropR = 4.6) => ({ ...K.cheese({ kind: 'prato', dropR }), key: 'cheese', sink: -0.1 }),
  cheddar: (dropR = 4.6) => ({ ...K.cheese({ kind: 'cheddar', dropR }), key: 'cheese', sink: -0.1 }),
  bacon: () => ({ ...K.bacon(), key: 'bacon', sink: -0.02 }),
  tomato: () => ({ ...K.tomato(), key: 'tomato', sink: 0.06 }),
  onion: () => ({ ...K.redOnion(), key: 'onion', sink: 0.1 }),
  caramelized: () => ({ ...K.caramelizedOnion(), key: 'caramelized', sink: 0.15 }),
  mayo: () => ({ ...K.mayo(), key: 'mayo', sink: 0.08 }),
  coleslaw: () => ({ ...K.coleslaw(), key: 'coleslaw', sink: 0.1 }),
};

export const RECIPES = {
  'downtown-classic': () => [L.bunBottom('brioche'), L.patty180(), L.prato(), L.mayo(), L.bunTop('brioche', 12)],
  'the-bacon-street': () => [
    L.bunBottom('brioche'), L.lettuce(), L.patty180(), L.prato(), L.bacon(), L.tomato(), L.onion(), L.mayo(), L.bunTop('brioche', 11),
  ],
  'australian-cheddar': () => [
    L.bunBottom('australiano'), L.patty180(33), L.cheddar(), L.caramelized(), L.bacon(), L.mayo(), L.bunTop('australiano', 14),
  ],
  'kill-bill': () => [
    L.bunBottom('australiano'), L.patty180(34), L.cheddar(), L.bacon(), L.arugula(), L.tomato(), L.onion(), L.mayo(), L.bunTop('australiano', 15),
  ],
  'golden-chicken': () => [L.bunBottom('brioche'), L.chicken(), L.prato(4.9), L.coleslaw(), L.bunTop('brioche', 16)],
  holyfield: () => [
    L.bunBottom('brioche'), L.lettuce(), L.patty130(35), L.patty130(36), L.prato(4.4), L.bacon(), L.tomato(), L.onion(), L.mayo(), L.bunTop('brioche', 17),
  ],
  'green-burger': () => [
    L.bunBottom('brioche'), L.lettuce(), L.plant(), L.prato(), L.tomato(), L.onion(), L.mayo(), L.bunTop('brioche', 18),
  ],
  'little-downtown': () => [L.bunBottom('brioche'), L.patty100(), L.prato(4.0), L.bunTop('brioche', 19)],
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

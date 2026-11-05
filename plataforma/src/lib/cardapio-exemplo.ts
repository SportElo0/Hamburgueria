import { emptyStore, type Item, type Store } from './schema';

/**
 * A made-up restaurant for showing the QR menu and the 3D dish in sales visits: nothing here is a real
 * business, dish or price. The 3D file is the code-made test burger (public/3d/), not a scan.
 */
const item = (id: string, name: string, description: string, price: number, extra: Partial<Item> = {}): Item => ({
  id,
  name,
  description,
  price,
  priceLabel: '',
  image: '',
  imageAlt: '',
  available: true,
  featured: false,
  tags: [],
  options: [],
  ...extra,
});

export function cardapioExemplo(): Store {
  const store = emptyStore('exemplo', 'Hamburgueria Exemplo', 'restaurante');
  store.catalog.categories = [
    {
      id: 'burgers',
      name: 'Burgers',
      description: '',
      items: [
        item('classico', 'Clássico', 'Pão brioche, blend 160 g, queijo, alface e molho da casa. Toque na imagem para ver em 3D.', 3490, {
          modelo3d: { src: '/3d/hamburguer-exemplo.glb', larguraCm: 22, alturaCm: 8.2, profundidadeCm: 22 },
          options: [
            {
              id: 'ponto',
              name: 'Ponto da carne',
              type: 'single',
              required: true,
              choices: [
                { id: 'mal', label: 'Mal passado', priceDelta: 0 },
                { id: 'ponto', label: 'Ao ponto', priceDelta: 0 },
                { id: 'bem', label: 'Bem passado', priceDelta: 0 },
              ],
            },
            { id: 'extras', name: 'Extras', type: 'multiple', required: false, choices: [{ id: 'bacon', label: 'Bacon', priceDelta: 500 }, { id: 'ovo', label: 'Ovo', priceDelta: 300 }] },
          ],
        }),
        item('duplo', 'Duplo Bacon', 'Dois blends de 120 g, cheddar e bacon.', 4290),
        item('salada', 'Smash Salada', 'Smash 100 g, queijo, alface, tomate e cebola roxa.', 2990),
        item('veggie', 'Veggie', 'Hambúrguer de grão-de-bico, queijo e salada.', 3290, { tags: ['vegetariano'] }),
      ],
    },
    {
      id: 'acompanhamentos',
      name: 'Acompanhamentos',
      description: '',
      items: [item('fritas', 'Fritas', 'Porção individual.', 1890), item('aneis', 'Onion rings', 'Porção individual.', 2190, { available: false })],
    },
    {
      id: 'bebidas',
      name: 'Bebidas',
      description: '',
      items: [item('refri', 'Refrigerante lata', '350 ml.', 700), item('suco', 'Suco natural', '400 ml. Laranja ou limão.', 1100)],
    },
  ];
  store.ordering = { ...store.ordering, tables: { enabled: true, count: 10 }, conta: { servico: 10, couvert: 0 } };
  return store;
}

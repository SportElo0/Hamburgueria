import type renders from '@/content/renders.json';

type PropId = keyof typeof renders.props;

export const SCENES = [
  { id: 'intro', field: 'bg-scene-red', ghost: 'Downtown', title: 'Isso é Downtown' },
  { id: 'flavour', field: 'bg-scene-orange', ghost: 'Sabor', title: 'Feito pra dar fome' },
  { id: 'layers', field: 'bg-scene-green', ghost: 'Camadas', title: 'Qualidade em cada camada' },
  { id: 'signature', field: 'bg-scene-plum', ghost: 'Clássicos', title: 'Escolha seu favorito' },
  { id: 'inside', field: 'bg-scene-teal', ghost: 'Por dentro', title: 'Por dentro do sabor' },
] as const;

interface Floater {
  src: PropId;
  x: string;
  y: string;
  w: string;
  r: number;
  dur: number;
  blur?: boolean;
  /** Mobile position override; `hide` drops it under 768px. */
  m?: { x: string; y: string } | 'hide';
}

// Ingredients drifting in each field, kept to the edges so copy and burger stay clear.
export const FLOATERS: Floater[][] = [
  [
    { src: 'float-fry-a', x: '9%', y: '24%', w: 'clamp(70px, 9vw, 150px)', r: -24, dur: 7, m: { x: '4%', y: '30%' } },
    { src: 'float-fry-b', x: '82%', y: '18%', w: 'clamp(60px, 7vw, 120px)', r: 18, dur: 6.2, m: { x: '84%', y: '30%' } },
    { src: 'float-fry-a', x: '86%', y: '68%', w: 'clamp(80px, 10vw, 170px)', r: 40, dur: 8, blur: true, m: 'hide' },
    { src: 'float-sesame', x: '16%', y: '66%', w: 'clamp(40px, 5vw, 80px)', r: 0, dur: 5.5, m: { x: '8%', y: '60%' } },
    { src: 'float-fry-b', x: '3%', y: '78%', w: 'clamp(60px, 7vw, 110px)', r: -50, dur: 6.8, blur: true, m: 'hide' },
  ],
  [
    { src: 'float-bacon', x: '6%', y: '70%', w: 'clamp(90px, 12vw, 200px)', r: -12, dur: 7.2, m: { x: '4%', y: '76%' } },
    { src: 'float-cheese', x: '44%', y: '12%', w: 'clamp(60px, 7vw, 120px)', r: 16, dur: 6, m: 'hide' },
    { src: 'float-bacon', x: '86%', y: '12%', w: 'clamp(70px, 9vw, 150px)', r: 28, dur: 8, blur: true, m: { x: '82%', y: '34%' } },
    { src: 'float-cheese', x: '38%', y: '78%', w: 'clamp(50px, 6vw, 100px)', r: -20, dur: 6.6, blur: true, m: { x: '78%', y: '80%' } },
  ],
  [
    { src: 'float-tomato', x: '5%', y: '14%', w: 'clamp(80px, 10vw, 170px)', r: -10, dur: 7, m: { x: '2%', y: '30%' } },
    { src: 'float-lettuce', x: '52%', y: '70%', w: 'clamp(90px, 12vw, 190px)', r: 12, dur: 8, m: { x: '70%', y: '80%' } },
    { src: 'float-onion', x: '10%', y: '72%', w: 'clamp(70px, 8vw, 130px)', r: 0, dur: 6.4, m: { x: '6%', y: '78%' } },
    { src: 'float-arugula', x: '46%', y: '10%', w: 'clamp(70px, 8vw, 140px)', r: 20, dur: 7.6, blur: true, m: 'hide' },
    { src: 'float-tomato', x: '38%', y: '42%', w: 'clamp(40px, 4vw, 70px)', r: 30, dur: 5.8, blur: true, m: 'hide' },
  ],
  [
    { src: 'float-onion', x: '6%', y: '20%', w: 'clamp(60px, 7vw, 120px)', r: 10, dur: 7, m: { x: '4%', y: '34%' } },
    { src: 'float-onion', x: '88%', y: '26%', w: 'clamp(50px, 6vw, 100px)', r: -20, dur: 6, blur: true, m: { x: '84%', y: '30%' } },
    { src: 'float-sesame', x: '82%', y: '80%', w: 'clamp(40px, 5vw, 80px)', r: 0, dur: 5.5, m: 'hide' },
    { src: 'float-onion', x: '4%', y: '82%', w: 'clamp(70px, 8vw, 140px)', r: 30, dur: 8, m: 'hide' },
  ],
  [
    // On phones the exploded labels fill both sides, so these move to the corners by the CTA.
    { src: 'float-lettuce', x: '4%', y: '18%', w: 'clamp(80px, 10vw, 170px)', r: -14, dur: 7.4, m: 'hide' },
    { src: 'float-arugula', x: '86%', y: '14%', w: 'clamp(60px, 7vw, 120px)', r: 24, dur: 6.2, m: { x: '84%', y: '86%' } },
    { src: 'float-arugula', x: '8%', y: '76%', w: 'clamp(70px, 8vw, 130px)', r: -30, dur: 7, blur: true, m: { x: '6%', y: '84%' } },
    { src: 'float-lettuce', x: '86%', y: '82%', w: 'clamp(70px, 9vw, 150px)', r: 18, dur: 8, m: 'hide' },
  ],
];

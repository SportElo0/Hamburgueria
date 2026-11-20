// Technical drawing of a Bacchi clip from the catalogue's two measures (height × width, in mm).
// Two nested pointed loops, as in the catalogue's "illustration" row. Coordinates are in millimetres,
// so every clip drawn with the same scale keeps the true proportion between sizes.

export function caminhoClip(altura: number, largura: number): string {
  const W = largura, H = altura;
  const p = [
    [0.86 * W, 0.84 * H], // inner right leg, free end
    [0.86 * W, 0.6 * H],
    [0.5 * W, 0.42 * H], // inner tip
    [0.14 * W, 0.6 * H],
    [0.14 * W, H], // down to the bottom bend
    [W, H],
    [W, 0.3 * H],
    [0.5 * W, 0], // outer tip
    [0, 0.3 * H],
    [0, 0.82 * H], // outer left leg, free end
  ];
  return p.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
}

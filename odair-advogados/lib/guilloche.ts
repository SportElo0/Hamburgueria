/**
 * Guilhochê gerado por fórmula, como nos documentos autenticados: curvas
 * polares sobrepostas com fase deslocada formam a trama. Tudo é calculado no
 * servidor e entregue como caminhos SVG (nenhuma imagem).
 */

export type RosetteSpec = {
  /** Quantidade de lóbulos da onda principal. */
  lobes: number;
  /** Multiplicador da onda secundária (cria o entrelaçado). */
  wobble: number;
  /** Anéis concêntricos. */
  rings: number;
  /** Cópias defasadas de cada anel (densidade da trama). */
  copies: number;
  /** Desloca as fases para cada área ter um desenho próprio. */
  seed: number;
};

const TAU = Math.PI * 2;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Anéis da roseta no viewBox -100..100. Cada anel volta como uma lista de
 * caminhos (um por cópia), para a gravação poder acontecer anel a anel.
 */
export function rosette(spec: RosetteSpec, { inner = 0.42, outer = 0.96, steps = 540 } = {}) {
  const rings: string[][] = [];
  const span = outer - inner;
  for (let i = 0; i < spec.rings; i++) {
    const t = spec.rings === 1 ? 1 : i / (spec.rings - 1);
    const base = (inner + span * t) * 100;
    // Onda lisa com amplitude modulada: as cópias defasadas se entrelaçam
    // numa trama contínua, sem bicos, como no guilhochê gravado.
    const n = spec.lobes + i * 4;
    const a = 4.2 + t * 1.6;
    const paths: string[] = [];
    for (let j = 0; j < spec.copies; j++) {
      const phase = (j / spec.copies) * Math.PI + spec.seed * (i + 1);
      let d = "";
      for (let k = 0; k <= steps; k++) {
        const th = (k / steps) * TAU;
        const mod = 1 + 0.35 * Math.sin(spec.wobble * th + spec.seed * 7);
        const r = base + a * mod * Math.sin(n * th + phase);
        const x = round(r * Math.cos(th));
        const y = round(r * Math.sin(th));
        d += k === 0 ? `M${x} ${y}` : `L${x} ${y}`;
      }
      paths.push(`${d}Z`);
    }
    rings.push(paths);
  }
  return rings;
}

/** Faixa guilhochê horizontal (divisores e rodapé), no viewBox 0..width x 0..height. */
export function band({
  width = 1200,
  height = 48,
  copies = 7,
  wave = 96,
  steps = 600,
  seed = 0,
}: {
  width?: number;
  height?: number;
  copies?: number;
  wave?: number;
  steps?: number;
  seed?: number;
} = {}) {
  const mid = height / 2;
  const a = height * 0.3;
  const b = height * 0.12;
  const paths: string[] = [];
  for (let j = 0; j < copies; j++) {
    const phase = (j / copies) * TAU + seed;
    let d = "";
    for (let k = 0; k <= steps; k++) {
      const x = (k / steps) * width;
      const y = mid + a * Math.sin((x / wave) * TAU + phase) + b * Math.sin((x / (wave * 0.37)) * TAU - phase * 2);
      d += k === 0 ? `M${round(x)} ${round(y)}` : `L${round(x)} ${round(y)}`;
    }
    paths.push(d);
  }
  return paths;
}

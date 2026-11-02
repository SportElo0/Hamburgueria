/**
 * Which deployment may change data. Vercel sets VERCEL=1 on every deployment and VERCEL_ENV to production, preview or
 * development. Today the Preview and Development environments carry the production database (POSTGRES_URL), so only
 * Production writes; previews and `vercel dev` read the real data but never change it.
 * Off Vercel (local runs and tests, which use files under .data/ or a temp folder) nothing changes.
 */
export const gravacaoPermitida = () => !process.env.VERCEL || process.env.VERCEL_ENV === 'production';

export class SomenteLeituraError extends Error {
  constructor() {
    super('Esta é uma versão de prévia: dá para ver, mas nada é salvo aqui.');
  }
}

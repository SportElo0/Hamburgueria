/** Runs once before the tests: a clean test database with every migration applied. */
export default async function preparar() {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://growlift:growlift@localhost:5432/growlift_test';
  process.env.BETTER_AUTH_SECRET = 'segredo-apenas-para-testes-0123456789abcdef';
  process.env.AMBIENTE = 'desenvolvimento';
  if (!/test/.test(process.env.DATABASE_URL)) throw new Error('Os testes só rodam em um banco com "test" no nome.');
  const { migrar } = await import('../scripts/migrar');
  await migrar(true);
  const { fecharPool } = await import('../src/server/db');
  await fecharPool();
}

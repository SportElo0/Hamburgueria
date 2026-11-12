import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'node',
    // One database for all files: run them one after another.
    fileParallelism: false,
    globalSetup: './test/preparar.ts',
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://growlift:growlift@localhost:5432/growlift_test',
      BETTER_AUTH_SECRET: 'segredo-apenas-para-testes-0123456789abcdef',
      CHAVE_CREDENCIAIS: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
      APP_URL: 'http://localhost:3100',
      AMBIENTE: 'desenvolvimento',
      IA_ANTHROPIC_API_KEY: '',
      WHATSAPP_APP_SECRET: 'segredo-do-app-de-teste',
      WHATSAPP_VERIFY_TOKEN: 'token-de-verificacao-de-teste',
    },
  },
});

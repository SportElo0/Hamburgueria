import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { auth } from '@/server/auth';
import { contextoDe, VISITANTE_DEMO, type Ctx } from '@/server/contexto';
import { fecharPool, q, um } from '@/server/db';
import { EMPRESA_DEMO, garantirVisitante } from '@/server/demonstracao';
import { convidar, empresaPorId, salvarConfig } from '@/server/empresas';
import { gerarChaveGoogle } from '@/server/google-ads';
import { excluirContato, exportarContatos, listar, mudarEtapa } from '@/server/oportunidades';
import { receberPedido } from '@/server/pedidos';
import { enviarProposta } from '@/server/propostas';
import { avisoDeTeste } from '@/server/push';
import { meta, novaEmpresa, pedido } from './apoio';

vi.mock('next/server', () => ({ after: () => {} }));

let visitante: Ctx;
let empresaId: string;
const guardado = process.env.AMBIENTE;

beforeAll(async () => {
  // The open demonstration lives in the demo company (slug lumivale-demo).
  const ja = await um<{ id: string }>('select id from empresas where slug = $1', [EMPRESA_DEMO]);
  if (ja) empresaId = ja.id;
  else {
    const e = await novaEmpresa('Lumivale Teste');
    await q('update empresas set slug = $2, demonstracao = true where id = $1', [e.empresa.id, EMPRESA_DEMO]);
    empresaId = e.empresa.id;
  }
  const v = await garantirVisitante();
  expect(v?.email).toBe(VISITANTE_DEMO);
  const u = await um<{ id: string; name: string }>('select id, name from "user" where email = $1', [VISITANTE_DEMO]);
  visitante = (await contextoDe(u!.id, u!.name, VISITANTE_DEMO)).ctx!;
  await receberPedido((await empresaPorId(empresaId))!, pedido(), meta());
});
afterAll(async () => {
  if (guardado === undefined) delete process.env.AMBIENTE;
  else process.env.AMBIENTE = guardado;
  await fecharPool();
});

describe('demonstração aberta (entrar sem senha)', () => {
  it('o visitante é administrador da empresa de demonstração e fica marcado como visitante', () => {
    expect(visitante.empresaId).toBe(empresaId);
    expect(visitante.papel).toBe('admin');
    expect(visitante.visitante).toBe(true);
  });

  it('criar o visitante de novo não duplica nada, e a senha derivada abre a sessão', async () => {
    const v = (await garantirVisitante())!;
    expect(await um<{ n: number }>('select count(*)::int as n from "user" where email = $1', [VISITANTE_DEMO])).toEqual({ n: 1 });
    const r = await auth().api.signInEmail({ body: { email: v.email, password: v.senha } });
    expect(r.user.email).toBe(VISITANTE_DEMO);
    await expect(auth().api.signInEmail({ body: { email: v.email, password: 'demonstracao-2026' } })).rejects.toThrow();
  });

  it('vê e mexe no funil, mas ajustes, convites, chaves, exportação e exclusão ficam bloqueados', async () => {
    const ops = await listar(visitante);
    expect(ops.length).toBeGreaterThan(0);
    await mudarEtapa(visitante, ops[0].id, { etapa: 'atendimento' });
    const bloqueado = /demonstração aberta/;
    await expect(convidar(visitante, { email: 'alguem@teste.local', papel: 'vendedor' })).rejects.toThrow(bloqueado);
    await expect(salvarConfig(visitante, 'site', {})).rejects.toThrow(bloqueado);
    await expect(gerarChaveGoogle(visitante)).rejects.toThrow(bloqueado);
    await expect(exportarContatos(visitante)).rejects.toThrow(bloqueado);
    await expect(excluirContato(visitante, ops[0].contato_id)).rejects.toThrow(bloqueado);
    await expect(enviarProposta(visitante, '00000000-0000-4000-8000-000000000000')).rejects.toThrow(bloqueado);
    await expect(avisoDeTeste(visitante)).rejects.toThrow(bloqueado);
  });

  it('um login comum da mesma empresa não fica marcado como visitante', async () => {
    const u = await um<{ id: string }>('select id from "user" where email = $1', [VISITANTE_DEMO]);
    expect((await contextoDe(u!.id, 'Outro', 'admin@lumivale.demo')).ctx?.visitante).toBeUndefined();
  });

  it('em produção a demonstração aberta não existe', async () => {
    process.env.AMBIENTE = 'producao';
    expect(await garantirVisitante()).toBeNull();
  });
});

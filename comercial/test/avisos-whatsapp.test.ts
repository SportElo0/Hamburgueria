import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { simulador } from '@/server/canais/simulador';
import { confirmarPelaMensagem, desligarAvisoWhatsApp, enviarAvisosWhatsApp, ligarAvisoWhatsApp, meuAvisoWhatsApp } from '@/server/avisos-whatsapp';
import { receberWhatsApp } from '@/server/conversas';
import { alterarMembro } from '@/server/empresas';
import { fecharPool, q } from '@/server/db';
import { salvarWhatsApp } from '@/server/integracoes';
import { receberPedido } from '@/server/pedidos';
import { contar, meta, novaEmpresa, pedido, telefone, unico, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
const telAdmin = telefone();
const telVendedor = telefone();
const enviadosPara = (tel: string) => simulador().enviados.filter((e) => e.para === `55${tel}`);

beforeAll(async () => {
  A = await novaEmpresa('Solar Avisos');
  B = await novaEmpresa('Solar Avisos B');
  await salvarWhatsApp(A.admin, { modo: 'simulador', modelo_aviso_equipe: 'aviso_equipe' });
  await salvarWhatsApp(B.admin, { modo: 'simulador' });
});
afterAll(fecharPool);

describe('avisos importantes no WhatsApp de quem pediu', () => {
  it('só liga com o aceite, no próprio celular, pelo próprio login', async () => {
    await expect(ligarAvisoWhatsApp(A.admin, telAdmin, false)).rejects.toThrow(/aceita/);
    await expect(ligarAvisoWhatsApp(A.admin, '1133334444', true)).rejects.toThrow(/celular/);
    await expect(ligarAvisoWhatsApp({ ...A.admin, acessoAdmin: 'suporte' }, telAdmin, true)).rejects.toThrow(/próprio login/);
    const codigo = await ligarAvisoWhatsApp(A.admin, `(${telAdmin.slice(0, 2)}) ${telAdmin.slice(2)}`, true);
    const meu = await meuAvisoWhatsApp(A.admin);
    expect(meu?.telefone).toBe(`55${telAdmin}`);
    expect(meu?.confirmado_em).toBeNull();
    // not confirmed yet: nothing goes out
    await enviarAvisosWhatsApp();
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo) values ($1, null, 'Novo pedido: antes', '/painel', 'tarefa:atender_pedido')`, [A.empresa.id]);
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telAdmin)).toHaveLength(0);
    // wrong code, or the code from another number, or in another company: no
    expect(await confirmarPelaMensagem(A.empresa.id, `55${telAdmin}`, 'AVISOS 000000')).toBe(codigo === '000000');
    expect(await confirmarPelaMensagem(A.empresa.id, `55${telefone()}`, `AVISOS ${codigo}`)).toBe(false);
    expect(await confirmarPelaMensagem(B.empresa.id, `55${telAdmin}`, `AVISOS ${codigo}`)).toBe(false);
    // the person sends "AVISOS <code>" from that number to the company's WhatsApp: confirmed, and no customer conversation is created
    const r = await receberWhatsApp(A.empresa.id, { de: `55${telAdmin}`, nome: 'Admin', texto: `avisos ${codigo}`, idProvedor: `wamid.${unico()}`, quando: new Date() });
    expect(r).toEqual({ duplicada: false });
    expect((await meuAvisoWhatsApp(A.admin))?.confirmado_em).toBeTruthy();
    expect(await contar('contatos where empresa_id = $1 and telefone = $2', [A.empresa.id, `55${telAdmin}`])).toBe(0);
    const texto = (await q<{ texto_aceite: string }>('select texto_aceite from avisos_whatsapp where user_id = $1', [A.admin.userId]))[0].texto_aceite;
    expect(texto).toContain('pelo número da Solar Avisos');
    expect(texto).not.toMatch(/automátic|robô/i);
  });

  it('pedido novo vai para o WhatsApp do dono, só com o assunto e o link, pelo modelo aprovado', async () => {
    await enviarAvisosWhatsApp(); // clears anything pending from before
    await receberPedido(A.empresa, pedido({ nome: 'Marina Segredo' }), meta());
    expect(await enviarAvisosWhatsApp()).toBeGreaterThanOrEqual(1);
    const ms = enviadosPara(telAdmin);
    expect(ms.at(-1)!.modelo).toBe('aviso_equipe');
    expect(ms.at(-1)!.corpo).toContain('Solar Avisos | Novo pedido |');
    expect(ms.at(-1)!.corpo).toMatch(/\/painel\//);
    expect(ms.at(-1)!.corpo).not.toContain('Marina');
    // the same notification never goes twice
    const antes = enviadosPara(telAdmin).length;
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telAdmin)).toHaveLength(antes);
  });

  it('avisos para a empresa vão só para administradores; aviso comum não vai; avaliação baixa vai', async () => {
    const cod = await ligarAvisoWhatsApp(A.vendedor, telVendedor, true);
    expect(await confirmarPelaMensagem(A.empresa.id, `55${telVendedor}`, `AVISOS ${cod}`)).toBe(true);
    await enviarAvisosWhatsApp();
    const antesV = enviadosPara(telVendedor).length;
    const antesA = enviadosPara(telAdmin).length;
    // a common notification (assignment) is not sent by WhatsApp
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link) values ($1, $2, 'Uma oportunidade foi atribuída a você', '/painel')`, [A.empresa.id, A.vendedor.userId]);
    // an important one for the whole company (no recipient): admins only
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo) values ($1, null, 'Retornar a ligação: (11) 9', '/painel/tarefas', 'tarefa:retornar_ligacao')`, [A.empresa.id]);
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telVendedor)).toHaveLength(antesV);
    expect(enviadosPara(telAdmin)).toHaveLength(antesA + 1);
    expect(enviadosPara(telAdmin).at(-1)!.corpo).toContain('| Retornar a ligação |');
    // an important one addressed to the salesperson reaches them
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo) values ($1, $2, 'Avaliação com nota 1 de 5: Fulano', '/painel', 'tarefa:avaliacao_baixa')`, [A.empresa.id, A.vendedor.userId]);
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telVendedor).at(-1)!.corpo).toContain('| Avaliação com nota 1 de 5 |');
    expect(enviadosPara(telVendedor).at(-1)!.corpo).not.toContain('Fulano');
  });

  it('sem o modelo aprovado nada sai; aviso velho (mais de 1 hora) não sai; desligar para tudo', async () => {
    const telB = telefone();
    await confirmarPelaMensagem(B.empresa.id, `55${telB}`, `AVISOS ${await ligarAvisoWhatsApp(B.admin, telB, true)}`);
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo) values ($1, null, 'Novo pedido: X', '/painel', 'tarefa:atender_pedido')`, [B.empresa.id]);
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telB)).toHaveLength(0);

    const antes = enviadosPara(telAdmin).length;
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo, criado_em) values ($1, null, 'Novo pedido: velho', '/painel', 'tarefa:atender_pedido', now() - interval '2 hours')`, [A.empresa.id]);
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telAdmin)).toHaveLength(antes);

    await desligarAvisoWhatsApp(A.admin);
    expect(await meuAvisoWhatsApp(A.admin)).toBeNull();
    await q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo) values ($1, null, 'Novo pedido: Y', '/painel', 'tarefa:atender_pedido')`, [A.empresa.id]);
    await enviarAvisosWhatsApp();
    expect(enviadosPara(telAdmin)).toHaveLength(antes);
  });

  it('quem sai da empresa tem o número apagado', async () => {
    const C = await novaEmpresa('Solar Saída');
    await ligarAvisoWhatsApp(C.vendedor, telefone(), true);
    expect(await meuAvisoWhatsApp(C.vendedor)).toBeTruthy();
    await alterarMembro(C.admin, C.vendedor.userId, { ativo: false });
    expect(await meuAvisoWhatsApp(C.vendedor)).toBeNull();
  });
});

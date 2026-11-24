import { afterAll, describe, expect, it } from 'vitest';
import { contextoDe } from '@/server/contexto';
import { fecharPool, um } from '@/server/db';
import { empresaPorId } from '@/server/empresas';
import { CAMPOS_GROWLIFT, CHAVE_SITE_GROWLIFT, CONHECIMENTO_GROWLIFT, RASCUNHO_1_GROWLIFT, atualizarGrowlift, prepararPrimeiroAcesso } from '@/server/primeiro-acesso';
import { empresaPorChave } from '@/server/empresas';
import { q } from '@/server/db';
import { receberPedido } from '@/server/pedidos';
import { pegar, executar } from '@/server/fila';
import { executores } from '@/server/trabalhos';
import { usarRascunhoDeTeste } from '@/server/rascunho-growlift';
import { SEGMENTOS } from '@/server/config';
import { Conhecimento } from '@/server/config';
import { novaEmpresa, unico } from './apoio';

afterAll(fecharPool);

describe('primeiro acesso a um banco de produção novo', () => {
  it('sem as variáveis não faz nada; com administrador já existente também não', async () => {
    expect(await prepararPrimeiroAcesso({})).toMatch(/não configurado/);
    await novaEmpresa('Outra Empresa'); // creates a Growlift admin, like a database already in use
    expect(await prepararPrimeiroAcesso({ PRIMEIRO_ADMIN_EMAIL: `a${unico()}@growlift.test`, PRIMEIRO_ADMIN_SENHA: 'senha-longa-de-teste' })).toMatch(/já existe administrador/);
  });

  it('cria o login da equipe Growlift e a empresa Growlift falando como marca; repetir não duplica', async () => {
    const email = `equipe${unico()}@growlift.test`;
    const env = { PRIMEIRO_ADMIN_EMAIL: email, PRIMEIRO_ADMIN_NOME: 'Equipe Growlift', PRIMEIRO_ADMIN_SENHA: 'senha-curta' };
    expect(await prepararPrimeiroAcesso({ ...env, PRIMEIRO_ADMIN_SENHA: 'curta' }, { somenteSeVazio: false })).toMatch(/10 caracteres/);
    const r = await prepararPrimeiroAcesso({ ...env, PRIMEIRO_ADMIN_SENHA: 'uma-senha-nova-de-teste' }, { somenteSeVazio: false });
    expect(r).toMatch(/criad/);
    expect(r).not.toContain(email);
    const u = (await um<{ id: string }>('select id from "user" where email = $1', [email]))!;
    const { ctx, adminPlataforma } = await contextoDe(u.id, 'Equipe Growlift', email);
    expect(adminPlataforma).toBe(true);
    const e = (await empresaPorId(ctx!.empresaId))!;
    expect(e.nome).toBe('Growlift');
    expect(e.config.ia.falar_como_marca).toBe(true);
    const k = (await um<{ dados: unknown }>('select dados from conhecimento where empresa_id = $1 and versao = 1', [e.id]))!.dados;
    expect(Conhecimento.parse(k).faq).toHaveLength(CONHECIMENTO_GROWLIFT.faq.length);
    expect(await prepararPrimeiroAcesso({ ...env, PRIMEIRO_ADMIN_SENHA: 'uma-senha-nova-de-teste' }, { somenteSeVazio: false })).toMatch(/já existe um login/);
  });

  it('deixa a empresa Growlift pronta para o site uma vez e depois não desfaz o que a equipe mudou', async () => {
    // The production database of 24/11/2026: company created with the first draft and the segment's default fields.
    const e = await novaEmpresa('Growlift Teste');
    const aposentar = `update empresas set slug = 'x-' || id, chave_publica = 'pk_' || replace(id::text, '-', '')`;
    await q(`${aposentar} where slug = 'growlift'`);
    await q(`update empresas set slug = 'growlift', config = config || $2::jsonb where id = $1`, [e.empresa.id, JSON.stringify({ campos: SEGMENTOS['servicos-gerais'].campos })]);
    await q('delete from conhecimento where empresa_id = $1', [e.empresa.id]);
    await q('insert into conhecimento (empresa_id, versao, dados) values ($1, 1, $2)', [e.empresa.id, JSON.stringify(RASCUNHO_1_GROWLIFT)]);

    expect(await atualizarGrowlift()).toMatch(/chave do site.*perguntas.*conhecimento versão 2/);
    const g = (await empresaPorChave(CHAVE_SITE_GROWLIFT))!;
    expect(g.id).toBe(e.empresa.id);
    expect(g.config.campos.map((c) => c.id)).toEqual(CAMPOS_GROWLIFT.map((c) => c.id));
    expect(g.config.site.link_privacidade).toBe('https://growlift.com.br/privacidade.html');
    expect(g.config.site.cnpj).toBe('69.611.450/0001-17');
    expect(g.config.dados.guarda_meses).toBe(12);
    const k = (await um<{ dados: unknown }>('select dados from conhecimento where empresa_id = $1 and versao = 2', [e.empresa.id]))!.dados;
    expect(Conhecimento.parse(k).faq.length).toBe(CONHECIMENTO_GROWLIFT.faq.length);
    expect(Conhecimento.safeParse(CONHECIMENTO_GROWLIFT).success).toBe(true);
    expect(JSON.stringify(CONHECIMENTO_GROWLIFT)).not.toMatch(/R\$/); // no price until it is on the site

    // What growlift.com.br sends when someone asks for the diagnostic: a request with an alert for the team, no WhatsApp.
    const pedido = {
      nome: 'Barbearia do Teste', telefone: '11912345678', cidade: 'Campinas, SP', preferencia_contato: 'WhatsApp', aceite_whatsapp: false,
      necessidade: 'Pediu o diagnóstico grátis pelo site.', chave_idempotencia: `site-${unico()}`, site_url: '',
      extras: { ramo: 'Serviços (ar-condicionado, limpeza, reforma…)', dor: 'Perco ligação quando estou atendendo', volume: 'De 10 a 50', quem_responde: 'Eu mesmo', presenca: '@barbeariateste' },
    };
    const r = await receberPedido(g, pedido, { origem: 'api', ipHash: `ip-${unico()}` });
    expect('descartado' in r).toBe(false);
    const n = await um<{ titulo: string; tipo: string }>(`select titulo, tipo from notificacoes where empresa_id = $1 order by criado_em desc limit 1`, [e.empresa.id]);
    expect(n).toMatchObject({ titulo: 'Novo pedido: Barbearia do Teste (Campinas, SP) pediu orçamento', tipo: 'tarefa:atender_pedido' });
    expect(await um('select 1 from consentimentos where empresa_id = $1', [e.empresa.id])).toBeNull();
    expect(await um(`select 1 from trabalhos where empresa_id = $1 and tipo = 'confirmacao_pedido'`, [e.empresa.id])).toBeNull();

    // The AI draft: only the answers go to the model (no phone, no business name); the draft lands in the task.
    const rodar = async () => {
      const id = (await um<{ id: string }>(`select id from trabalhos where empresa_id = $1 and tipo = 'rascunho_pedido' order by criado_em desc limit 1`, [e.empresa.id]))!.id;
      await q(`update trabalhos set executar_em = now() where id = $1`, [id]);
      return executar((await pegar(id))!, executores);
    };
    let enviado = '';
    usarRascunhoDeTeste(async (_s, u) => {
      enviado = u;
      return { resumo: 'Climatização em Campinas que perde ligação no serviço.', solucoes: ['ligacao', 'aviso', 'inventado' as 'ia'], mensagem: 'Oi! Aqui é o [seu nome], da Growlift. Recebi o diagnóstico da [empresa].' };
    });
    expect((await rodar()).tipo).toBe('concluido');
    usarRascunhoDeTeste(null);
    expect(enviado).toContain('Perco ligação');
    expect(enviado).not.toContain('11912345678');
    expect(enviado).not.toContain('Barbearia do Teste');
    const det = (await um<{ detalhe: string }>(`select detalhe from tarefas where empresa_id = $1 and chave = $2`, [e.empresa.id, `atender:${(r as { oportunidadeId: string }).oportunidadeId}`]))!.detalhe;
    expect(det).toContain('Resumo da IA: Climatização');
    expect(det).toContain('Sugestões: Ligação perdida vira conversa; Aviso no celular');
    expect(det).toContain('Recebi o diagnóstico da Barbearia do Teste.');
    expect(det).not.toContain('inventado');

    // The team edits the knowledge and shortens the retention; the next builds keep it.
    await q('insert into conhecimento (empresa_id, versao, dados) values ($1, 3, $2)', [e.empresa.id, JSON.stringify({ ...CONHECIMENTO_GROWLIFT, horarios: 'Seg a sex, 9h às 18h' })]);
    await q(`update empresas set config = jsonb_set(config, '{dados,guarda_meses}', '6') where id = $1`, [e.empresa.id]);
    expect(await atualizarGrowlift()).toBe('growlift: nada a atualizar');
    expect((await empresaPorId(e.empresa.id))!.config.dados.guarda_meses).toBe(6);
    // Longer than the site's policy promises (or never deleting) goes back to 12 months.
    for (const meses of [24, 0]) {
      await q(`update empresas set config = jsonb_set(config, '{dados,guarda_meses}', $2::jsonb) where id = $1`, [e.empresa.id, String(meses)]);
      expect(await atualizarGrowlift()).toMatch(/guarda de 12 meses/);
      expect((await empresaPorId(e.empresa.id))!.config.dados.guarda_meses).toBe(12);
    }
    expect((await um<{ n: number }>('select count(*)::int as n from conhecimento where empresa_id = $1', [e.empresa.id]))!.n).toBe(3);
    await q(`${aposentar} where id = $1`, [e.empresa.id]);
  });
});

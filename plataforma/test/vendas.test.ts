import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { listarLeads } from '@/lib/oportunidades/dados';
import {
  ETAPAS,
  LIMITE_EMAILS_DIA,
  MAX_ACOMPANHAMENTOS,
  conferirRascunho,
  fatosDoContato,
  linkWhatsAppComercial,
  pedeParaSair,
  possivelReclamacao,
  rascunhoSimulado,
  rodape,
} from '@/lib/vendas/regras';
import {
  anotar,
  aprovarRascunho,
  bloqueado,
  bloquearContato,
  bloquearManual,
  contagemPorEtapa,
  contatoPorId,
  criarContato,
  descadastrar,
  descartarRascunho,
  desbloquear,
  editarRascunho,
  filaDeAprovacao,
  gerarRascunho,
  gravacaoPermitida,
  lerToken,
  listarBloqueio,
  listarContatos,
  mudarEtapa,
  registrarResposta,
  registrarWhatsapp,
  tokenDescadastro,
} from '@/lib/vendas/dados';
import { MODELO_PADRAO, iaLigada, type Cliente } from '@/lib/vendas/ia';

/** Every test runs on a throwaway folder: never the real database, never the network. */
const PLACE = 'PlaceVendas00001';
const base = {
  negocio: 'Padaria Exemplo',
  email: 'contato@padariaexemplo.com.br',
  fonteTipo: 'site',
  fonteUrl: 'https://padariaexemplo.com.br/contato',
  cidade: 'Ilhabela',
  uf: 'SP',
  segmento: 'padarias',
  conferido: true,
};

async function semearLead(situacao = 'boa', categoria = 'site-com-problemas', verificado = false) {
  await storage().writeJSON('oportunidades/lugares.json', {
    [PLACE]: {
      placeId: PLACE,
      cidade: 'Ilhabela',
      uf: 'SP',
      bairro: '',
      segmento: 'padarias',
      categoria,
      categoriaRevisada: false,
      sinais: ['Sem HTTPS (cadeado)'],
      checadoEm: '2026-11-01T12:00:00.000Z',
      verificacao: verificado ? { situacao: 'confirmado', fontes: ['instagram', 'busca-google'], links: '' } : { situacao: 'pendente', fontes: [], links: '' },
      observacoes: '',
      situacao,
      criadoEm: '2026-11-01T12:00:00.000Z',
      pesquisaId: 'p1',
    },
  });
}

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'vendas-')));
  vi.stubEnv('SESSION_SECRET', 'segredo-de-teste-com-mais-de-32-caracteres!!');
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('VENDAS_IA', '');
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  // Any network call fails the test: phase 1 sends nothing and calls nothing.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('rede proibida nos testes');
    }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('regras', () => {
  it('limites do piloto e etapas', () => {
    expect(LIMITE_EMAILS_DIA).toBe(5);
    expect(MAX_ACOMPANHAMENTOS).toBe(1);
    expect(ETAPAS.map((e) => e.id)).toContain('nao-contatar');
  });

  it('reconhece pedidos para sair sem IA', () => {
    for (const t of ['SAIR', 'Por favor, me descadastre', 'Não tenho interesse, obrigado', 'parem de mandar e-mail', 'Remover', 'stop'])
      expect(pedeParaSair(t), t).toBe(true);
    for (const t of ['Quero saber o preço', 'Pode me ligar amanhã?', 'Saímos às 18h, mas tenho interesse', 'Stopped? não', 'vamos sair do iFood'])
      expect(pedeParaSair(t), t).toBe(t === 'vamos sair do iFood');
  });

  it('o rascunho simulado só usa fatos do contato e passa na conferência', () => {
    const ctx = { negocio: 'Padaria Exemplo', cidade: 'Ilhabela', segmento: 'padarias' as const, categoria: 'site-com-problemas' as const, sinais: ['Sem HTTPS (cadeado)'], tipo: 'primeiro' as const };
    const r = rascunhoSimulado(ctx);
    expect(r.corpo).toContain('Padaria Exemplo');
    expect(r.corpo).toContain('sem HTTPS (cadeado)');
    expect(r.corpo).not.toMatch(/\bdo Padaria/);
    expect(r.corpo).toContain('R$ 597');
    expect(conferirRascunho(r.assunto, r.corpo)).toEqual({ alertas: [], bloqueia: false });
    expect(rascunhoSimulado({ ...ctx, segmento: undefined, categoria: 'sem-site' }).corpo).toContain('R$ 247');
    const acomp = rascunhoSimulado({ ...ctx, tipo: 'acompanhamento' });
    expect(acomp.corpo).toMatch(/"sair"/);
    expect(conferirRascunho(acomp.assunto, acomp.corpo).bloqueia).toBe(false);
    expect(fatosDoContato(ctx).join(' ')).toContain('Padarias, em Ilhabela');
  });

  it('a conferência barra promessa, preço inventado e campo vazio', () => {
    expect(conferirRascunho('Oi', 'Garantimos o primeiro lugar do Google.').bloqueia).toBe(true);
    expect(conferirRascunho('Oi', 'Vamos dobrar as suas vendas.').bloqueia).toBe(true);
    expect(conferirRascunho('Oi', 'Plano por R$ 199 por mês.').alertas.join()).toContain('R$ 199');
    expect(conferirRascunho('Oi', 'Plano por R$ 597 por mês.').bloqueia).toBe(false);
    expect(conferirRascunho('Oi', 'Mais de 200 clientes confiam.').bloqueia).toBe(true);
    expect(conferirRascunho('Oi {nome}', 'Texto').bloqueia).toBe(true);
    expect(conferirRascunho('Oi', 'Veja www.exemplo.com').alertas.join()).toContain('link');
  });

  it('links de WhatsApp e rodapé', () => {
    expect(linkWhatsAppComercial('Padaria & Cia')).toBe('https://wa.me/5511942279336?text=' + encodeURIComponent('Olá! Recebi o e-mail da Growlift sobre o site de Padaria & Cia e quero conversar.'));
    expect(rodape('https://x/descadastro?t=1')).toContain('CNPJ 69.611.450/0001-17');
  });
});

describe('contatos', () => {
  it('cadastra com fonte verificável e traz os dados da equipe da Oportunidade', async () => {
    await semearLead();
    const c = await criarContato({ ...base, placeId: PLACE }, 'ana@growlift');
    expect(c).toMatchObject({ etapa: 'novo', categoria: 'site-com-problemas', sinais: ['Sem HTTPS (cadeado)'], fonte: { tipo: 'site' } });
    expect(c.historico[0].texto).toContain('https://padariaexemplo.com.br/contato');
    expect(await listarContatos()).toHaveLength(1);
  });

  it('recusa sem fonte, fonte do Google, sem confirmar e repetido', async () => {
    await expect(criarContato({ ...base, fonteUrl: '' }, 'ana')).rejects.toThrow(/link/);
    await expect(criarContato({ ...base, fonteUrl: 'http://padaria.com' }, 'ana')).rejects.toThrow(/https/);
    await expect(criarContato({ ...base, fonteUrl: 'https://maps.app.goo.gl/abc' }, 'ana')).rejects.toThrow(/Google/);
    await expect(criarContato({ ...base, fonteUrl: 'https://www.google.com/maps/place/x' }, 'ana')).rejects.toThrow(/Google/);
    await expect(criarContato({ ...base, conferido: false }, 'ana')).rejects.toThrow(/público/);
    await criarContato(base, 'ana');
    await expect(criarContato({ ...base, negocio: 'Outra' }, 'ana')).rejects.toThrow(/Já existe/);
  });

  it('recusa negócio marcado como Não contatar em Oportunidades', async () => {
    await semearLead('nao-contatar');
    await expect(criarContato({ ...base, placeId: PLACE }, 'ana')).rejects.toThrow(/Não contatar/);
  });

  it('funil: etapa manual, anotação, histórico e contagem', async () => {
    const c = await criarContato(base, 'ana');
    await mudarEtapa(c.id, 'quente', 'bia');
    await anotar(c.id, 'Pediu proposta do Grow', 'bia');
    const x = (await contatoPorId(c.id))!;
    expect(x.etapa).toBe('quente');
    expect(x.historico.map((e) => e.tipo)).toEqual(['cadastro', 'etapa', 'nota']);
    expect(contagemPorEtapa(await listarContatos()).quente).toBe(1);
    await expect(mudarEtapa(c.id, 'nao-contatar', 'bia')).rejects.toThrow(/inválida/);
  });
});

describe('rascunhos e aprovação', () => {
  it('sem IA ligada usa o simulador, sem rede e sem custo', async () => {
    expect(iaLigada()).toBe(false);
    const c = await criarContato(base, 'ana');
    const x = await gerarRascunho(c.id, 'primeiro', 'ana');
    expect(x.etapa).toBe('em-aprovacao');
    expect(x.rascunhos[0]).toMatchObject({ origem: 'simulado', status: 'para-aprovar', tipo: 'primeiro' });
    expect(x.rascunhos[0].fatos.length).toBeGreaterThan(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(filaDeAprovacao(await listarContatos())).toHaveLength(1);
  });

  it('com a IA (cliente falso) usa o modelo econômico e o texto passa pela conferência', async () => {
    const parse = vi.fn(async (req: { model: string }) => ({
      stop_reason: 'end_turn',
      model: req.model,
      parsed_output: { assunto: 'Padaria Exemplo', corpo: 'Olá! Garantimos dobrar as suas vendas em 30 dias com o nosso site.' },
    }));
    const cliente = { messages: { parse } } as unknown as Cliente;
    const c = await criarContato(base, 'ana');
    const x = await gerarRascunho(c.id, 'primeiro', 'ana', { cliente });
    expect(parse).toHaveBeenCalledOnce();
    expect(parse.mock.calls[0][0].model).toBe(MODELO_PADRAO);
    expect(MODELO_PADRAO).toBe('claude-haiku-5-5');
    expect(x.rascunhos[0]).toMatchObject({ origem: 'ia', modelo: 'claude-haiku-5-5' });
    expect(x.rascunhos[0].alertas.length).toBeGreaterThan(0);
    await expect(aprovarRascunho(c.id, x.rascunhos[0].id, 'ana')).rejects.toThrow(/Corrija/);
  });

  it('se a IA falhar ou recusar, cai no simulador e avisa', async () => {
    const cliente = { messages: { parse: vi.fn(async () => ({ stop_reason: 'refusal', parsed_output: null })) } } as unknown as Cliente;
    const c = await criarContato(base, 'ana');
    const x = await gerarRascunho(c.id, 'primeiro', 'ana', { cliente });
    expect(x.rascunhos[0].origem).toBe('simulado');
    expect(x.rascunhos[0].alertas[0]).toMatch(/simulador/);
  });

  it('editar, aprovar, um rascunho por vez e no máximo 1 acompanhamento', async () => {
    const c = await criarContato(base, 'ana');
    let x = await gerarRascunho(c.id, 'primeiro', 'ana');
    await expect(gerarRascunho(c.id, 'primeiro', 'ana')).rejects.toThrow(/esperando aprovação/);
    await expect(gerarRascunho(c.id, 'acompanhamento', 'ana')).rejects.toThrow(/esperando aprovação/);
    const rid = x.rascunhos[0].id;
    x = await editarRascunho(c.id, rid, { assunto: 'Site da Padaria Exemplo', corpo: x.rascunhos[0].corpo + '\n\nAbraço.' }, 'bia');
    expect(x.rascunhos[0].origem).toBe('editado');
    x = await aprovarRascunho(c.id, rid, 'bia');
    expect(x.rascunhos[0]).toMatchObject({ status: 'aprovado', decididoPor: 'bia' });
    expect(x.etapa).toBe('aprovado');
    await expect(aprovarRascunho(c.id, rid, 'bia')).rejects.toThrow(/já foi decidido/);
    await expect(gerarRascunho(c.id, 'primeiro', 'ana')).rejects.toThrow(/acompanhamento/);
    x = await gerarRascunho(c.id, 'acompanhamento', 'ana');
    x = await aprovarRascunho(c.id, x.rascunhos[1].id, 'bia');
    await expect(gerarRascunho(c.id, 'acompanhamento', 'ana')).rejects.toThrow(/No máximo 1/);
  });

  it('descartar volta a etapa e libera um novo rascunho', async () => {
    const c = await criarContato(base, 'ana');
    const x = await gerarRascunho(c.id, 'primeiro', 'ana');
    const y = await descartarRascunho(c.id, x.rascunhos[0].id, 'ana');
    expect(y.etapa).toBe('novo');
    expect((await gerarRascunho(c.id, 'primeiro', 'ana')).rascunhos).toHaveLength(2);
  });

  it('acompanhamento não vai para quem já respondeu', async () => {
    const c = await criarContato(base, 'ana');
    const x = await gerarRascunho(c.id, 'primeiro', 'ana');
    await aprovarRascunho(c.id, x.rascunhos[0].id, 'ana');
    await registrarResposta(c.id, 'Tenho interesse, qual o preço?', 'ana');
    expect((await contatoPorId(c.id))!.etapa).toBe('respondeu');
    await expect(gerarRascunho(c.id, 'acompanhamento', 'ana')).rejects.toThrow(/já respondeu/);
  });
});

describe('bloqueio e descadastro', () => {
  it('resposta "sair" bloqueia na hora, apaga o e-mail visível e marca Não contatar em Oportunidades', async () => {
    await semearLead();
    const c = await criarContato({ ...base, placeId: PLACE }, 'ana');
    await gerarRascunho(c.id, 'primeiro', 'ana');
    await registrarResposta(c.id, 'Por favor, me descadastre.', 'ana');
    const x = (await contatoPorId(c.id))!;
    expect(x.etapa).toBe('nao-contatar');
    expect(x.email).toBe('co*****@padariaexemplo.com.br');
    expect(x.rascunhos[0].status).toBe('descartado');
    expect(await bloqueado({ email: base.email })).toBeTruthy();
    expect((await listarLeads())[0].situacao).toBe('nao-contatar');
    await expect(gerarRascunho(c.id, 'primeiro', 'ana')).rejects.toThrow(/Não contatar/);
    await expect(criarContato({ ...base, negocio: 'Padaria de novo' }, 'ana')).rejects.toThrow(/bloqueio/);
    const lista = await listarBloqueio();
    expect(JSON.stringify(lista)).not.toContain(base.email);
    await expect(desbloquear(lista[0].chave, 'ana')).rejects.toThrow(/não pode ser desfeito/);
  });

  it('link de descadastro assinado: só funciona com a assinatura certa e é idempotente', async () => {
    const c = await criarContato(base, 'ana');
    const t = tokenDescadastro(c.id);
    expect(await descadastrar(t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A'))).toBe('invalido');
    expect(await descadastrar('lixo')).toBe('invalido');
    expect(await descadastrar(t)).toBe('feito');
    expect(await descadastrar(t)).toBe('feito');
    expect((await contatoPorId(c.id))!.etapa).toBe('nao-contatar');
    expect((await listarBloqueio())[0].origem).toBe('descadastro');
  });

  it('bloqueio manual por domínio pega quem já está no CRM; domínio público não', async () => {
    const c = await criarContato(base, 'ana');
    await expect(bloquearManual({ valor: 'gmail.com' }, 'ana')).rejects.toThrow(/público/);
    const r = await bloquearManual({ valor: 'padariaexemplo.com.br', motivo: 'Pediu por telefone' }, 'ana');
    expect(r.contatos).toBe(1);
    expect((await contatoPorId(c.id))!.etapa).toBe('nao-contatar');
    expect(await bloqueado({ email: 'outro@padariaexemplo.com.br' })).toBeTruthy();
    const b = (await listarBloqueio()).find((x) => x.tipo === 'dominio')!;
    await desbloquear(b.chave, 'ana');
    expect(await bloqueado({ email: 'outro@padariaexemplo.com.br' })).toBeFalsy();
  });

  it('bloquear descarta o rascunho pendente e nada mais pode ser aprovado', async () => {
    const c = await criarContato(base, 'ana');
    const x = await gerarRascunho(c.id, 'primeiro', 'ana');
    await bloquearContato(c.id, 'Teste', 'equipe', 'ana');
    expect((await contatoPorId(c.id))!.rascunhos[0].status).toBe('descartado');
    await expect(aprovarRascunho(c.id, x.rascunhos[0].id, 'ana')).rejects.toThrow(/bloqueio|decidido/);
  });
});

describe('WhatsApp e ambiente', () => {
  it('número do lead só depois de ele responder pedindo, com o registro de como pediu', async () => {
    const c = await criarContato(base, 'ana');
    await expect(registrarWhatsapp(c.id, { numero: '11 98888-7777', como: 'Respondeu pedindo ligação' }, 'ana')).rejects.toThrow(/Só depois/);
    await registrarResposta(c.id, 'Pode me chamar no WhatsApp 11 98888-7777', 'ana');
    await expect(registrarWhatsapp(c.id, { numero: '1133334444', como: 'Respondeu pedindo contato' }, 'ana')).rejects.toThrow(/celular/);
    const x = await registrarWhatsapp(c.id, { numero: '+55 (11) 98888-7777', como: 'Respondeu o e-mail pedindo contato pelo WhatsApp' }, 'ana');
    expect(x.whatsapp).toMatchObject({ numero: '11988887777' });
    expect(x.historico.at(-1)!.tipo).toBe('whatsapp');
  });

  it('na prévia da Vercel nada é gravado (o banco ainda é o de produção)', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(gravacaoPermitida()).toBe(false);
    await expect(criarContato(base, 'ana')).rejects.toThrow(/prévia/);
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(gravacaoPermitida()).toBe(true);
  });
});

describe('ajustes das revisões', () => {
  it('recusa e-mail de domínio público (costuma ser pessoal)', async () => {
    await expect(criarContato({ ...base, email: 'padaria@gmail.com' }, 'ana')).rejects.toThrow(/Gmail/);
  });

  it('"sem site" só vai para o texto depois da verificação manual', async () => {
    await semearLead('boa', 'sem-site', false);
    expect((await criarContato({ ...base, placeId: PLACE }, 'ana')).categoria).toBe('incerta');
  });

  it('"sem site" verificado continua', async () => {
    await semearLead('boa', 'sem-site', true);
    expect((await criarContato({ ...base, placeId: PLACE }, 'ana')).categoria).toBe('sem-site');
  });

  it('possível reclamação bloqueia e avisa', async () => {
    expect(possivelReclamacao('Vou reclamar no Procon')).toBe(true);
    expect(pedeParaSair('Isso fere a LGPD')).toBe(true);
    const c = await criarContato(base, 'ana');
    await registrarResposta(c.id, 'Vou chamar meu advogado.', 'ana');
    const x = (await contatoPorId(c.id))!;
    expect(x.etapa).toBe('nao-contatar');
    expect(x.historico.at(-1)!.texto).toMatch(/ATENÇÃO/);
  });

  it('no descadastro, respostas, notas e observações são apagadas', async () => {
    const c = await criarContato({ ...base, observacoes: 'Dono se chama Fulano' }, 'ana');
    await anotar(c.id, 'Fulano atende de manhã', 'ana');
    await registrarResposta(c.id, 'Fulano aqui, telefone 11 98888-7777. Pode ligar.', 'ana');
    await descadastrar(tokenDescadastro(c.id));
    const x = (await contatoPorId(c.id))!;
    expect(JSON.stringify(x)).not.toMatch(/Fulano|98888/);
    expect(x.observacoes).toBe('');
  });

  it('sem SESSION_SECRET o link é só inválido (a página não quebra)', () => {
    vi.stubEnv('SESSION_SECRET', '');
    expect(lerToken('abcdefghij.' + 'a'.repeat(32))).toBeNull();
  });

  it('rodapé diz a fonte, o endereço e a política', () => {
    const r = rodape('https://x/d', 'Padaria Exemplo', 'Instagram do negócio');
    expect(r).toContain('contato comercial de Padaria Exemplo (instagram do negócio)');
    expect(r).toContain('Rua Barão de Monte Mor, 55');
    expect(r).toContain('growlift.com.br/privacidade.html');
  });
});

import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MAX_PROBLEMA, SERVICOS_ADICIONADOS, SERVICOS_INICIAIS, SITUACOES, comAdicionados, demoValida, imagemValida, problemaDe, srcImagem, tipoDaImagem, type Servico } from '@/lib/servicos';
import { EXEMPLOS_PROBLEMA, buscarServicos, normalizar } from '@/lib/servicos-busca';

describe('serviços da Growlift', () => {
  it('starts with valid cards, each with its picture on disk', () => {
    const ids = SERVICOS_INICIAIS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SERVICOS_INICIAIS) {
      expect(s.nome.length).toBeGreaterThan(3);
      expect(s.resumo.length).toBeLessThanOrEqual(300);
      expect(SITUACOES).toContain(s.situacao);
      expect(imagemValida(s.imagem)).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', s.imagem))).toBe(true);
      expect(demoValida(s.demo)).toBe(true);
      // every card says which client problem it solves (the search reads it first)
      expect(s.problema?.length ?? 0).toBeGreaterThan(20);
      expect(s.problema!.length).toBeLessThanOrEqual(MAX_PROBLEMA);
    }
    expect(SERVICOS_INICIAIS.length).toBeLessThanOrEqual(100);
  });

  it('merges a card added later once, and never brings back one the team deleted', () => {
    expect(SERVICOS_INICIAIS.some((s) => s.id === 'mesa-conectada')).toBe(true);
    const adicionados = SERVICOS_ADICIONADOS.map((s) => s.id);
    expect(adicionados.slice(0, 2)).toEqual(['mesa-conectada', 'catalogo-lojista']);
    // the 25 ideas of 24/11 come after them, all as ideas
    expect(adicionados).toHaveLength(27);
    expect(SERVICOS_ADICIONADOS.slice(2).every((s) => s.situacao === 'ideia' && s.criadoEm === '2026-11-24')).toBe(true);
    const salva = SERVICOS_INICIAIS.filter((s) => !adicionados.includes(s.id)).slice(0, 3);
    // saved before the cards existed: they show up, in order
    expect(comAdicionados(salva, []).map((s) => s.id)).toEqual([...salva.map((s) => s.id), ...adicionados]);
    // already in the saved list: not duplicated
    expect(comAdicionados([...salva, SERVICOS_ADICIONADOS[0]], []).filter((s) => s.id === 'mesa-conectada')).toHaveLength(1);
    // delivered and then deleted by the team: stays deleted
    expect(comAdicionados(salva, ['mesa-conectada']).some((s) => s.id === 'mesa-conectada')).toBe(false);
  });

  it('accepts only its own pictures and https demo links', () => {
    expect(imagemValida('')).toBe(true);
    expect(imagemValida('midia/growlift-servicos/abc123def456.webp')).toBe(true);
    expect(imagemValida('midia/outra-loja/abc123def456.webp')).toBe(false);
    expect(imagemValida('https://exemplo.com/foto.jpg')).toBe(false);
    expect(imagemValida('/servicos/../x.webp')).toBe(false);
    expect(srcImagem('midia/growlift-servicos/abc123.png')).toBe('/api/midia/growlift-servicos/abc123.png');
    expect(srcImagem('/servicos/google.webp')).toBe('/servicos/google.webp');
    expect(demoValida('https://growlift-comercial.vercel.app/demonstracao')).toBe(true);
    expect(demoValida('javascript:alert(1)')).toBe(false);
    expect(demoValida('http://exemplo.com')).toBe(false);
    expect(demoValida('https://usuario:senha@exemplo.com')).toBe(false);
  });

  it('tells the picture type from its bytes, not from the name', () => {
    expect(tipoDaImagem(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg');
    expect(tipoDaImagem(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(tipoDaImagem(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('webp');
    expect(tipoDaImagem(new TextEncoder().encode('\0\0\0\x1cftypavif'))).toBe('avif');
    expect(tipoDaImagem(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
  });

  it('falls back to our default problem for a card saved before the field existed, but keeps one the team cleared', () => {
    const antigo = { ...SERVICOS_INICIAIS.find((s) => s.id === 'retomada')! } as Servico;
    delete antigo.problema;
    expect(problemaDe(antigo)).toMatch(/orçamento/);
    expect(problemaDe({ ...antigo, problema: '' })).toBe('');
    expect(problemaDe({ ...antigo, id: 'feito-pela-equipe' })).toBe('');
  });
});

describe('busca por problema do cliente', () => {
  const ids = (q: string) => buscarServicos(SERVICOS_INICIAIS, q).map((a) => a.servico.id);

  it('finds the service for the problem in the client\'s own words, accents and case ignored', () => {
    expect(ids('Demora para responder no WhatsApp')[0]).toBe('atendente-ia');
    expect(ids('cliente demora pra ser respondido no zap').slice(0, 3)).toEqual(expect.arrayContaining(['atendente-ia', 'sdr-whatsapp', 'caixa-unica']));
    expect(ids('Cliente pede orçamento e some')[0]).toBe('retomada');
    expect(ids('CLIENTE PEDE ORCAMENTO E SOME')[0]).toBe('retomada');
    expect(ids('muita gente devendo')[0]).toBe('agente-cobranca');
    expect(ids('calote')).toContain('agente-cobranca');
    expect(ids('difícil contratar')[0]).toBe('recrutamento-ia');
    expect(ids('currículo')[0]).toBe('recrutamento-ia');
    expect(ids('não aparece no google').slice(0, 2)).toEqual(expect.arrayContaining(['google', 'auditoria-seo']));
    expect(ids('ninguém tem tempo de postar')).toContain('redes-sociais-ia');
    expect(ids('reunião sem combinado')[0]).toBe('ata-reuniao');
    expect(ids('ligação perdida')[0]).toBe('ligacao');
    expect(ids('cliente cancela')[0]).toBe('portal-cliente');
    expect(ids('não sei quanto lucro')[0]).toBe('paineis');
    expect(ids('catálogo de roupas')[0]).toBe('catalogo-lojista');
    expect(ids('proposta demora')[0]).toBe('proposta-assinatura');
  });

  it('keeps the list short and says nothing for filler or unknown words', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
    expect(ids('o que a gente faz')).toEqual([]);
    expect(ids('xyzabc')).toEqual([]);
    expect(ids('Demora para responder no WhatsApp').length).toBeLessThanOrEqual(8);
    expect(ids('muita gente devendo')).not.toContain('cardapio');
  });

  it('every example under the box finds something', () => {
    for (const ex of EXEMPLOS_PROBLEMA) expect(ids(ex).length, ex).toBeGreaterThan(0);
  });

  it('reads the problem the team wrote on a new card', () => {
    const novo: Servico = { id: 'x1', nome: 'Totem de autoatendimento', resumo: 'Tela na loja.', problema: 'Fila enorme no caixa na hora do almoço.', situacao: 'ideia', imagem: '', demo: '', criadoEm: '2026-11-24' };
    expect(buscarServicos([...SERVICOS_INICIAIS, novo], 'fila no almoço')[0].servico.id).toBe('x1');
    expect(normalizar('Ação Pública')).toBe('acao publica');
  });
});

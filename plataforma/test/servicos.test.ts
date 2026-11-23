import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICOS_INICIAIS, SITUACOES, demoValida, imagemValida, srcImagem, tipoDaImagem } from '@/lib/servicos';

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
    }
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
});

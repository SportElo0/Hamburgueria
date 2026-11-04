import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { CadastroError, aprovarCadastro, criarCadastro, getCadastro, listarCadastros, recusarCadastro, validarCadastro } from '@/lib/cadastros';
import { authenticateOperator, listOperators, operatorActive, upsertOperator } from '@/lib/operators';
import { createStore, getDraft, getPublished } from '@/lib/stores';
import { canUse, homeOf } from '@/lib/session';

const png = () => new File([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], 'logo.png', { type: 'image/png' });
const base = { restaurante: 'Cantina da Praça', dono: 'Ana Lima', email: 'Ana@Exemplo.com', whatsapp: '(12) 99876-5432', senha: 'senha-forte-1', logo: null as File | null };

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'cadastro-')));
});

describe('cadastro de restaurante', () => {
  it('cria o login pendente, que só vê a tela de espera', async () => {
    const r = await criarCadastro({ ...base, logo: png() });
    expect(r).toEqual({ slug: 'cantina-da-praca', email: 'ana@exemplo.com', nome: 'Ana Lima' });
    const c = (await getCadastro('cantina-da-praca'))!;
    expect(c).toMatchObject({ status: 'pendente', whatsapp: '12998765432', restaurante: 'Cantina da Praça' });
    expect(c.logo).toMatch(/^midia\/cantina-da-praca\/[0-9a-f]+\.png$/);
    expect(await storage().readFile(c.logo)).not.toBeNull();
    const op = (await authenticateOperator('ana@exemplo.com', 'senha-forte-1'))!;
    expect(op).toMatchObject({ slug: 'cantina-da-praca', funcao: 'dono', pendente: true });
    expect(await operatorActive('ana@exemplo.com', 'cantina-da-praca', Date.now() + 1)).toEqual({ funcao: 'dono', pendente: true });
    const session = { role: 'loja' as const, slug: 'cantina-da-praca', funcao: 'dono' as const, pendente: true };
    expect(canUse(session, 'cantina-da-praca')).toBe(false);
    expect(homeOf(session)).toBe('/cadastro/aguardando');
    expect(await getDraft('cantina-da-praca')).toBeNull();
  });

  it('não repete endereço nem e-mail', async () => {
    await createStore({ slug: 'cantina-da-praca', name: 'Outra', segment: 'restaurante' }, 'equipe');
    expect((await criarCadastro(base)).slug).toBe('cantina-da-praca-2');
    expect((await criarCadastro({ ...base, email: 'b@exemplo.com' })).slug).toBe('cantina-da-praca-3');
    await expect(criarCadastro({ ...base, restaurante: 'Outro' })).rejects.toThrow(/esse e-mail/);
    await upsertOperator('loja-x', { email: 'caixa@x.com', name: 'Caixa', funcao: 'cozinha' }, 'equipe');
    await expect(criarCadastro({ ...base, email: 'caixa@x.com' })).rejects.toThrow(/esse e-mail/);
  });

  it('valida o formulário', () => {
    const bad = (o: Partial<typeof base>) => () => validarCadastro({ ...base, ...o });
    expect(bad({ restaurante: 'x' })).toThrow(CadastroError);
    expect(bad({ restaurante: '!!!' })).toThrow(/letras/);
    expect(bad({ email: 'sem-arroba' })).toThrow(/e-mail/);
    expect(bad({ whatsapp: '1234' })).toThrow(/DDD/);
    expect(bad({ senha: 'curta' })).toThrow(/8/);
    expect(bad({ logo: new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }) })).toThrow(/JPG/);
    expect(bad({ logo: new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' }) })).toThrow(/2 MB/);
    expect(validarCadastro({ ...base, whatsapp: '+55 12 99876-5432' }).whatsapp).toBe('12998765432');
  });

  it('aprovar cria a loja com a logo, sem publicar, e libera o painel do dono', async () => {
    await criarCadastro({ ...base, logo: png() });
    await aprovarCadastro('cantina-da-praca', 'Lucas');
    const draft = (await getDraft('cantina-da-praca'))!;
    expect(draft.data.store).toMatchObject({ name: 'Cantina da Praça', segment: 'restaurante' });
    expect(draft.data.store.extra.logo).toMatch(/^\/api\/midia\/cantina-da-praca\/[0-9a-f]+\.png$/);
    expect(draft.data.store.contact.whatsapp).toBe(''); // o WhatsApp do dono não vai para nenhum site
    expect(await getPublished('cantina-da-praca')).toBeNull();
    expect(await operatorActive('ana@exemplo.com', 'cantina-da-praca', Date.now() + 1)).toEqual({ funcao: 'dono', pendente: false });
    expect(await listOperators('cantina-da-praca')).toEqual([expect.objectContaining({ email: 'ana@exemplo.com', funcao: 'dono' })]);
    expect((await getCadastro('cantina-da-praca'))?.status).toBe('aprovado');
    await expect(aprovarCadastro('cantina-da-praca', 'Lucas')).rejects.toThrow(/não está mais esperando/);
    await expect(recusarCadastro('cantina-da-praca')).rejects.toThrow(/não está mais esperando/);
  });

  it('recusar apaga cadastro, login e logo', async () => {
    await criarCadastro({ ...base, logo: png() });
    const logo = (await getCadastro('cantina-da-praca'))!.logo;
    await recusarCadastro('cantina-da-praca');
    expect(await getCadastro('cantina-da-praca')).toBeNull();
    expect(await authenticateOperator('ana@exemplo.com', 'senha-forte-1')).toBeNull();
    expect(await storage().readFile(logo)).toBeNull();
    expect(await listarCadastros()).toEqual([]);
    // O mesmo e-mail pode se cadastrar de novo depois.
    expect((await criarCadastro(base)).slug).toBe('cantina-da-praca');
  });

  it('a logo precisa ser imagem de verdade, não só dizer que é', async () => {
    const fake = new File(['<html><script>alert(1)</script></html>'], 'logo.png', { type: 'image/png' });
    await expect(criarCadastro({ ...base, logo: fake })).rejects.toThrow(/JPG, PNG ou WebP/);
    expect(await getCadastro('cantina-da-praca')).toBeNull();
    // Um JPEG enviado como "png" é guardado como JPEG.
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2])], 'logo.png', { type: 'image/png' });
    await criarCadastro({ ...base, logo: jpeg });
    expect((await getCadastro('cantina-da-praca'))!.logo).toMatch(/\.jpg$/);
  });

  it('nova senha dada pela equipe não aprova o cadastro sozinha', async () => {
    await criarCadastro(base);
    await upsertOperator('cantina-da-praca', { email: 'ana@exemplo.com', name: 'Ana', funcao: 'dono' }, 'equipe');
    expect((await operatorActive('ana@exemplo.com', 'cantina-da-praca', Date.now() + 1))?.pendente).toBe(true);
  });
});

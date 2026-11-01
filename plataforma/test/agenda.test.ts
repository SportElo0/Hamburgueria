import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { agendaView, approve, publishNow, runAgenda, unschedule } from '@/lib/agenda';
import { signedContentUrl, verifyContentLink } from '@/lib/link-publico';
import { getStatuses } from '@/lib/conteudos';

const ORIGIN = 'https://painel.example';
const T0 = new Date('2026-11-02T12:00:00-03:00');
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

function kit() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-kit-'));
  const files = ['05-reels/11-dois-amigos.mp4', '05-reels/11-dois-amigos-capa.png', '04-posts-fixados/3-servicos/01.png', '04-posts-fixados/3-servicos/02.png'];
  for (const f of files) {
    fs.mkdirSync(path.join(dir, 'arquivos', path.dirname(f)), { recursive: true });
    fs.writeFileSync(path.join(dir, 'arquivos', f), 'x');
  }
  const manifest = {
    generatedAt: '',
    folders: [
      { slug: '05-reels', title: 'Reels', blurb: '', sectionStatus: true, groups: [{ id: '05-reels', title: 'Vídeos', files: [{ path: files[0], name: '11.mp4', type: 'video/mp4', size: 1, width: 0, height: 0, format: '', thumb: files[1], cover: files[1], doNotPublish: false }] }], docs: [{ file: '05-reels/roteiros.md', title: 'Roteiros', intro: '', sections: [{ id: '11-dois-amigos', title: '11', html: '' }] }] },
      { slug: '04-posts-fixados', title: 'Posts', blurb: '', sectionStatus: false, groups: [{ id: '04-posts-fixados/3-servicos', title: 'Serviços', files: files.slice(2).map((p) => ({ path: p, name: 'x.png', type: 'image/png', size: 1, width: 0, height: 0, format: '', thumb: p, doNotPublish: false })) }], docs: [] },
    ],
  };
  const agenda = {
    itens: [
      { id: '2026-11-02-reel-11', titulo: 'Reel 11', tipo: 'reel', arquivos: [files[0]], capa: files[1], legenda: 'Comenta GOOGLE #restaurante', quando: '2026-11-02T15:00:00-03:00', ia: true, palavra: 'GOOGLE', chave: '05-reels/roteiros.md#11-dois-amigos' },
      { id: '2026-11-02-carrossel-servicos', titulo: 'Serviços', tipo: 'carrossel', arquivos: files.slice(2), capa: null, legenda: 'Serviços', quando: '2026-11-02T10:00:00-03:00', ia: false, chave: '04-posts-fixados/3-servicos' },
    ],
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, 'agenda.json'), JSON.stringify(agenda));
  return dir;
}

/** A tiny fake of the Instagram Graph API: containers start IN_PROGRESS and finish after `ticks` status checks. */
function fakeInstagram(opts: { ticks?: number; fail?: string } = {}) {
  const calls: { method: string; path: string; body: Record<string, string> }[] = [];
  const containers = new Map<string, number>();
  let n = 100;
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    const body = Object.fromEntries(new URLSearchParams(String(init.body ?? '')));
    calls.push({ method, path: url.pathname, body });
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
    if (url.pathname === '/refresh_access_token') return json({ access_token: 'novo-token', expires_in: 5_184_000 });
    if (url.pathname.endsWith('/me')) return json({ id: 'app-1', user_id: '17841400000000', username: 'growlift.ai' });
    if (method === 'POST' && url.pathname.endsWith('/17841400000000/media')) {
      if (opts.fail) return json({ error: { message: opts.fail, code: 9004 } }, 400);
      const id = `c${n++}`;
      containers.set(id, 0);
      return json({ id });
    }
    if (method === 'POST' && url.pathname.endsWith('/17841400000000/media_publish')) return json({ id: `m${body.creation_id}` });
    const id = url.pathname.split('/').pop()!;
    if (url.searchParams.get('fields') === 'status_code,status') {
      const seen = (containers.get(id) ?? 0) + 1;
      containers.set(id, seen);
      return json({ status_code: seen > (opts.ticks ?? 0) ? 'FINISHED' : 'IN_PROGRESS' });
    }
    if (url.searchParams.get('fields') === 'permalink') return json({ permalink: `https://www.instagram.com/reel/${id}/` });
    return json({ error: { message: 'rota desconhecida' } }, 404);
  });
  return calls;
}

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-')));
  vi.stubEnv('CONTEUDOS_GERADOS_DIR', kit());
  vi.stubEnv('INSTAGRAM_TOKEN', 'token-de-teste');
  vi.stubEnv('INSTAGRAM_API_URL', 'https://ig.test/v26.0');
  vi.stubEnv('INSTAGRAM_REFRESH_URL', 'https://ig.test/refresh_access_token');
  vi.stubEnv('SESSION_SECRET', 'segredo-local-de-teste-com-32-caracteres-ok');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('agenda do Instagram', () => {
  it('nada sai sem aprovação', async () => {
    const calls = fakeInstagram();
    expect((await agendaView()).map((i) => i.status)).toEqual(['rascunho', 'rascunho']);
    const r = await runAgenda(ORIGIN, at(600));
    expect(r.started).toEqual([]);
    expect(calls.filter((c) => c.method === 'POST')).toEqual([]);
  });

  it('aprovado: espera a hora, cria o Reel com capa e rótulo de IA, publica e marca como postado', async () => {
    const calls = fakeInstagram({ ticks: 1 });
    await approve('2026-11-02-reel-11', { legenda: 'Comenta GOOGLE', quando: '2026-11-02T15:00:00-03:00', ia: true }, 'Lucas', T0);
    expect((await runAgenda(ORIGIN, at(60))).started).toEqual([]); // 13h: not yet
    expect((await runAgenda(ORIGIN, at(180))).started).toEqual(['2026-11-02-reel-11']);
    const create = calls.find((c) => c.method === 'POST' && c.path.endsWith('/17841400000000/media'))!;
    expect(create.body).toMatchObject({ media_type: 'REELS', caption: 'Comenta GOOGLE', share_to_feed: 'true', is_ai_generated: 'true' });
    expect(create.body.video_url).toContain('/api/conteudos/publico/05-reels/11-dois-amigos.mp4?e=');
    expect(create.body.cover_url).toContain('jpg=1');
    expect((await runAgenda(ORIGIN, at(182))).posted).toEqual([]); // still processing
    expect((await runAgenda(ORIGIN, at(184))).posted).toEqual(['2026-11-02-reel-11']);
    const item = (await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!;
    expect(item.status).toBe('postado');
    expect(item.state?.permalink).toMatch(/^https:\/\/www\.instagram\.com\/reel\//);
    expect((await getStatuses())['05-reels/roteiros.md#11-dois-amigos']?.status).toBe('postado');
    // Runs again: never publishes twice.
    await runAgenda(ORIGIN, at(200));
    expect(calls.filter((c) => c.path.endsWith('/media_publish')).length).toBe(1);
  });

  it('carrossel: cria cada foto em JPEG sem legenda e o carrossel com a legenda', async () => {
    const calls = fakeInstagram();
    await approve('2026-11-02-carrossel-servicos', { legenda: 'Serviços', quando: '2026-11-02T12:30:00-03:00', ia: false }, 'Lucas', T0);
    await runAgenda(ORIGIN, at(31));
    const creates = calls.filter((c) => c.method === 'POST' && c.path.endsWith('/17841400000000/media'));
    expect(creates.length).toBe(3);
    expect(creates[0].body).toMatchObject({ is_carousel_item: 'true' });
    expect(creates[0].body.caption).toBeUndefined();
    expect(creates[0].body.image_url).toContain('jpg=1');
    expect(creates[2].body).toMatchObject({ media_type: 'CAROUSEL', children: 'c100,c101', caption: 'Serviços' });
    await runAgenda(ORIGIN, at(32));
    expect((await agendaView()).find((i) => i.id === '2026-11-02-carrossel-servicos')!.status).toBe('postado');
  });

  it('erro do Instagram aparece no post e dá para tentar de novo', async () => {
    fakeInstagram({ fail: 'Formato de vídeo não suportado' });
    await approve('2026-11-02-reel-11', { legenda: 'Oi', quando: '2026-11-02T12:10:00-03:00', ia: false }, 'Lucas', T0);
    expect((await runAgenda(ORIGIN, at(11))).failed).toEqual(['2026-11-02-reel-11']);
    const item = (await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!;
    expect(item).toMatchObject({ status: 'erro' });
    expect(item.state?.error).toContain('Formato de vídeo');
    fakeInstagram();
    await publishNow('2026-11-02-reel-11', 'Lucas', at(20));
    expect((await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!.status).toBe('agendado');
  });

  it('se o publicador ficou parado, não publica horas depois sozinho', async () => {
    const calls = fakeInstagram();
    await approve('2026-11-02-reel-11', { legenda: 'Oi', quando: '2026-11-02T12:10:00-03:00', ia: false }, 'Lucas', T0);
    await runAgenda(ORIGIN, at(10 + 4 * 60));
    expect((await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!.status).toBe('atrasado');
    expect(calls.filter((c) => c.method === 'POST' && c.path.endsWith('/media')).length).toBe(0);
  });

  it('valida legenda e horário, e cancelar volta para aprovação', async () => {
    fakeInstagram();
    await expect(approve('2026-11-02-reel-11', { legenda: '', quando: '2026-11-02T15:00:00-03:00', ia: false }, 'L', T0)).rejects.toThrow('legenda');
    await expect(approve('2026-11-02-reel-11', { legenda: 'x'.repeat(2201), quando: '2026-11-02T15:00:00-03:00', ia: false }, 'L', T0)).rejects.toThrow('2200');
    await expect(approve('2026-11-02-reel-11', { legenda: Array.from({ length: 31 }, (_, i) => `#t${i}`).join(' '), quando: '2026-11-02T15:00:00-03:00', ia: false }, 'L', T0)).rejects.toThrow('30 hashtags');
    await expect(approve('2026-11-02-reel-11', { legenda: 'ok', quando: '2026-11-02T09:00:00-03:00', ia: false }, 'L', T0)).rejects.toThrow('já passou');
    await expect(approve('nao-existe', { legenda: 'ok', quando: '2026-11-02T15:00:00-03:00', ia: false }, 'L', T0)).rejects.toThrow('não encontrado');
    await approve('2026-11-02-reel-11', { legenda: 'ok', quando: '2026-11-02T15:00:00-03:00', ia: false }, 'L', T0);
    await unschedule('2026-11-02-reel-11');
    expect((await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!.status).toBe('rascunho');
  });

  it('sem o Instagram conectado, o publicador não faz nada', async () => {
    vi.stubEnv('INSTAGRAM_TOKEN', '');
    const calls = fakeInstagram();
    await approve('2026-11-02-reel-11', { legenda: 'ok', quando: '2026-11-02T12:10:00-03:00', ia: false }, 'L', T0);
    expect((await runAgenda(ORIGIN, at(11))).skipped).toBe('instagram-nao-conectado');
    expect(calls).toEqual([]);
  });

  it('preview ou cópia fora da produção nunca publica', async () => {
    const calls = fakeInstagram();
    vi.stubEnv('VERCEL_ENV', 'preview');
    await approve('2026-11-02-reel-11', { legenda: 'ok', quando: '2026-11-02T12:10:00-03:00', ia: false }, 'L', T0);
    expect((await runAgenda(ORIGIN, at(11))).skipped).toBe('nao-e-producao');
    vi.stubEnv('VERCEL_ENV', 'production');
    expect((await runAgenda(ORIGIN, at(11))).skipped).toBe('falta-painel-url');
    expect(calls.filter((c) => c.method === 'POST')).toEqual([]);
  });

  it('publicação que parou no meio vira erro para conferir, sem publicar de novo sozinha', async () => {
    const calls = fakeInstagram();
    await approve('2026-11-02-reel-11', { legenda: 'ok', quando: '2026-11-02T12:10:00-03:00', ia: false }, 'L', T0);
    await runAgenda(ORIGIN, at(11));
    // Simulate a run that took the publish step and died.
    const doc = await storage().readJSON<Record<string, { postedAt?: string }>>('instagram/agenda.json');
    doc!.data['2026-11-02-reel-11'].postedAt = at(12).toISOString();
    await storage().writeJSON('instagram/agenda.json', doc!.data, doc!.etag);
    await runAgenda(ORIGIN, at(13));
    expect((await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!.status).toBe('processando');
    await runAgenda(ORIGIN, at(30));
    const item = (await agendaView()).find((i) => i.id === '2026-11-02-reel-11')!;
    expect(item.status).toBe('erro');
    expect(item.state?.error).toContain('Confira no Instagram');
    expect(calls.filter((c) => c.path.endsWith('/media_publish')).length).toBe(0);
  });

  it('renova o token uma vez por semana e guarda o novo', async () => {
    const calls = fakeInstagram();
    await runAgenda(ORIGIN, T0);
    await runAgenda(ORIGIN, at(60));
    expect(calls.filter((c) => c.path === '/refresh_access_token').length).toBe(1);
    expect((await storage().readJSON<{ token: string }>('instagram/token.json'))?.data.token).toBe('novo-token');
    await runAgenda(ORIGIN, at(8 * 24 * 60));
    expect(calls.filter((c) => c.path === '/refresh_access_token').length).toBe(2);
  });
});

describe('token do Facebook (EAA)', () => {
  /** Fake of graph.facebook.com for a token that only knows its Page: /me has no user_id, /me/accounts has the account. */
  function fakeFacebook(opts: { pages?: boolean } = {}) {
    const hosts = new Set<string>();
    const paths: string[] = [];
    vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit = {}) => {
      const url = new URL(String(input));
      hosts.add(url.host);
      paths.push(`${init.method ?? 'GET'} ${url.pathname}`);
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
      if (url.pathname.endsWith('/me/accounts')) return json({ data: opts.pages === false ? [] : [{ id: 'pg1', instagram_business_account: { id: '17841400000001', username: 'growlift.ai' } }] });
      // The Facebook API has no user_id field on /me (that is the error the first version hit).
      if (url.pathname.endsWith('/me')) return url.searchParams.get('fields')?.includes('user_id') ? json({ error: { message: '(#100) Tried accessing nonexisting field (user_id)' } }, 400) : json({ id: '99', name: 'Automação Growlift' });
      if (url.pathname.endsWith('/17841400000002')) return json({ username: 'growlift.ai' });
      if (url.pathname.endsWith('/content_publishing_limit')) return json({ data: [{ quota_usage: 2, config: { quota_total: 100 } }] });
      return json({ error: { message: 'Invalid OAuth access token - Cannot parse access token' } }, 400);
    });
    return { hosts, paths };
  }

  beforeEach(() => {
    vi.stubEnv('INSTAGRAM_TOKEN', 'EAAtokendeteste');
    vi.stubEnv('INSTAGRAM_API_URL', '');
  });

  it('usa o endereço do Facebook e acha a conta pela Página, sem tentar renovar', async () => {
    const { hosts, paths } = fakeFacebook();
    const { account, publishingUsage } = await import('@/lib/instagram');
    expect(await account()).toEqual({ userId: '17841400000001', username: 'growlift.ai' });
    expect([...hosts]).toEqual(['graph.facebook.com']);
    expect(paths).not.toContain('GET /v26.0/me');
    expect(await publishingUsage()).toEqual({ used: 2, total: 100 });
    await runAgenda(ORIGIN, T0);
    expect(paths.some((p) => p.includes('refresh'))).toBe(false);
  });

  it('com o número da conta na Vercel (INSTAGRAM_USER_ID), usa ele e confere o token', async () => {
    vi.stubEnv('INSTAGRAM_USER_ID', '17841400000002');
    const { paths } = fakeFacebook({ pages: false });
    const { account } = await import('@/lib/instagram');
    expect(await account()).toEqual({ userId: '17841400000002', username: 'growlift.ai' });
    expect(paths).toEqual(['GET /v26.0/17841400000002']);
  });

  it('sem Página e sem número da conta, explica o que fazer', async () => {
    fakeFacebook({ pages: false });
    const { account } = await import('@/lib/instagram');
    await expect(account()).rejects.toThrow('INSTAGRAM_USER_ID');
  });

  it('quando o Facebook recusa a busca, a mensagem traz o motivo', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: { message: '(#200) Requires pages_show_list permission' } }), { status: 403 }));
    const { account } = await import('@/lib/instagram');
    await expect(account()).rejects.toThrow('pages_show_list');
  });

  it('número da conta inválido é recusado', async () => {
    vi.stubEnv('INSTAGRAM_USER_ID', 'abc');
    fakeFacebook();
    const { account } = await import('@/lib/instagram');
    await expect(account()).rejects.toThrow('inválido');
  });
});

describe('link público assinado', () => {
  it('vale só para aquele arquivo, formato e prazo', () => {
    vi.stubEnv('SESSION_SECRET', 'segredo-local-de-teste-com-32-caracteres-ok');
    const now = T0.getTime();
    const u = new URL(signedContentUrl(ORIGIN, '05-reels/11-dois-amigos.mp4', { ttlMinutes: 60 }, now));
    const e = u.searchParams.get('e'), s = u.searchParams.get('s');
    expect(verifyContentLink('05-reels/11-dois-amigos.mp4', e, s, false, now)).toBe(true);
    expect(verifyContentLink('05-reels/12-cardapio-completo.mp4', e, s, false, now)).toBe(false);
    expect(verifyContentLink('05-reels/11-dois-amigos.mp4', e, s, true, now)).toBe(false);
    expect(verifyContentLink('05-reels/11-dois-amigos.mp4', e, s, false, now + 61 * 60_000)).toBe(false);
    expect(verifyContentLink('05-reels/11-dois-amigos.mp4', e, 'falsa', false, now)).toBe(false);
  });
});

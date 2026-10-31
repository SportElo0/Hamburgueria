import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, type Store, type StoreRecord } from '@/lib/schema';
import { DEFAULT_ORDERING, DEFAULT_RESERVATIONS, type ReservationSettings } from '@/lib/ordering';
import {
  ReservationError,
  availability,
  bookableDays,
  cancelByCustomer,
  cancelByStore,
  createReservation,
  effectiveStatus,
  getReservation,
  heldNow,
  markArrived,
  markFinished,
  markNoShow,
  reservationsOfDay,
  simulateDeposit,
  settleReservationFromMercadoPago,
  slotTimes,
} from '@/lib/reservas';
import { setMercadoPagoToken } from '@/lib/pix';
import { closeTable, floor, seatTable, seatingHistory } from '@/lib/mesas';
import { publicFloor } from '@/lib/movimento';
import { occupancy, stayStats } from '@/lib/salao';
import type { SeatingRecord } from '@/lib/mesas';

const SLUG = 'el-patron-burger';
const ORIGIN = 'https://painel.example';
// Thursday 5 Nov 2026, noon in São Paulo.
const NOON = new Date('2026-11-05T12:00:00-03:00');
const DAY = '2026-11-05';
const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00-03:00`);

const SELLER = { name: 'Restaurante Teste Ltda', cnpj: '12.345.678/0001-90', address: 'Rua Teste, 1, São Paulo/SP', privacyContact: 'privacidade@teste.local', keepMonths: 6 };

function store(r: Partial<ReservationSettings> = {}, demoStore = true): Store {
  const seed = seedStores().find((s) => s.slug === SLUG)!;
  return storeSchema.parse({
    ...seed,
    // Practice Pix only holds tables on a demonstration store.
    extra: { ...seed.extra, demo: demoStore },
    ordering: {
      ...DEFAULT_ORDERING,
      enabled: true,
      tables: { enabled: true, count: 6 },
      reservations: { ...DEFAULT_RESERVATIONS, enabled: true, days: [0, 1, 2, 3, 4, 5, 6], from: '19:00', to: '21:00', perSlot: 1, depositPerPerson: 2000, depositMode: 'pessoa', seller: SELLER, ...r },
    },
  });
}
async function publish(s: Store) {
  const record: StoreRecord = { store: s, updatedAt: NOON.toISOString(), updatedBy: 'teste', publishedAt: NOON.toISOString() };
  await storage().writeJSON(`lojas/${SLUG}/rascunho.json`, record);
  await storage().writeJSON(`lojas/${SLUG}/publicado.json`, record);
}
const input = (extra: Record<string, unknown> = {}) => ({ date: DAY, time: '19:00', people: 2, name: 'Ana Souza', phone: '(11) 98888-7777', email: '', accepted: true, ...extra });

beforeEach(async () => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'reservas-')));
  await publish(store());
});

describe('horários', () => {
  it('lista os horários do dia e fecha 1 hora antes', () => {
    const s = store().ordering.reservations;
    expect(slotTimes(s, DAY, NOON)).toEqual(['19:00', '19:30', '20:00', '20:30', '21:00']);
    expect(slotTimes(s, DAY, at('18:30'))).toEqual(['19:30', '20:00', '20:30', '21:00']);
    expect(bookableDays(s, NOON)[0]).toBe(DAY);
    expect(bookableDays({ ...s, days: [5] }, NOON)[0]).toBe('2026-11-06');
  });
});

describe('reserva com sinal', () => {
  it('cobra o sinal por pessoa, segura o horário e confirma quando paga', async () => {
    const r = await createReservation(SLUG, input(), '1.1.1.1', ORIGIN, NOON);
    expect(r.reservation.status).toBe('aguardando-pix');
    expect(r.reservation.deposit).toBe(4000);
    expect(r.reservation.pix?.demo).toBe(true);
    expect((await availability(SLUG, DAY, NOON)).find((x) => x.time === '19:00')!.left).toBe(0);
    await expect(createReservation(SLUG, input(), '2.2.2.2', ORIGIN, NOON)).rejects.toThrow(/lotar/);
    const paid = await simulateDeposit(SLUG, r.id, r.token, NOON);
    expect(paid!.status).toBe('confirmada');
    // The page never shows the phone.
    expect(JSON.stringify(paid)).not.toContain('98888');
  });

  it('Pix não pago expira e libera o horário', async () => {
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    const later = new Date(NOON.getTime() + 31 * 60_000);
    expect(effectiveStatus((await getReservation(SLUG, r.id))!, later)).toBe('expirada');
    expect((await availability(SLUG, DAY, later)).find((x) => x.time === '19:00')!.left).toBe(1);
  });

  it('sem sinal, confirma na hora', async () => {
    await publish(store({ depositPerPerson: 0 }));
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    expect(r.reservation.status).toBe('confirmada');
    expect(r.reservation.pix).toBeNull();
  });

  it('recusa sem aceitar as regras, pessoas demais e horário fora da lista', async () => {
    await expect(createReservation(SLUG, input({ accepted: false }), '', ORIGIN, NOON)).rejects.toBeInstanceOf(ReservationError);
    await expect(createReservation(SLUG, input({ people: 9 }), '', ORIGIN, NOON)).rejects.toThrow(/até 8/);
    await expect(createReservation(SLUG, input({ time: '18:00' }), '', ORIGIN, NOON)).rejects.toThrow(/disponível/);
    await publish(store({ enabled: false }));
    await expect(createReservation(SLUG, input(), '', ORIGIN, NOON)).rejects.toThrow(/não está recebendo/);
  });

  it('não liga sem os dados do restaurante, nem com Pix de mentira numa loja de verdade', async () => {
    await publish(store({ seller: { ...SELLER, cnpj: '' } }));
    await expect(createReservation(SLUG, input(), '', ORIGIN, NOON)).rejects.toThrow(/não está recebendo/);
    await publish(store({}, false));
    await expect(createReservation(SLUG, input(), '', ORIGIN, NOON)).rejects.toThrow(/ainda não está recebendo/);
    await publish(store({ depositPerPerson: 0 }, false));
    expect((await createReservation(SLUG, input(), '', ORIGIN, NOON)).reservation.status).toBe('confirmada');
  });

  it('padrão: sinal fixo de R$ 15 por reserva, qualquer que seja o número de pessoas', async () => {
    await publish(store({ depositPerPerson: DEFAULT_RESERVATIONS.depositPerPerson, depositMode: DEFAULT_RESERVATIONS.depositMode }));
    const r = await createReservation(SLUG, input({ people: 6 }), '', ORIGIN, NOON);
    expect(r.reservation.deposit).toBe(1500);
  });

  it('o sinal tem teto de R$ 100 por pessoa', () => {
    expect(() => store({ depositPerPerson: 20_000 })).toThrow();
  });

  it('guarda o aceite e as regras daquele momento', async () => {
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    const saved = (await getReservation(SLUG, r.id))!;
    expect(saved.acceptedAt).toBe(NOON.toISOString());
    expect(saved.rules).toMatchObject({ cancelHours: 3, toleranceMinutes: 15, depositPerPerson: 2000, withdrawalDays: 7 });
  });

  it('não deixa abrir com o token errado', async () => {
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    expect(await simulateDeposit(SLUG, r.id, 'x'.repeat(32), NOON)).toBeNull();
    expect(await cancelByCustomer(SLUG, r.id, 'x'.repeat(32), NOON)).toBeNull();
  });
});

describe('cancelar', () => {
  it('dentro dos 7 dias do pagamento devolve até o horário (arrependimento)', async () => {
    const a = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, a.id, a.token, NOON);
    expect(await cancelByCustomer(SLUG, a.id, a.token, at('18:50'))).toMatchObject({ status: 'cancelada', refunded: true });
  });

  it('reserva feita há mais de 7 dias: no prazo devolve, depois do prazo o sinal fica', async () => {
    const day = '2026-11-20';
    await publish(store({ daysAhead: 30 }));
    const a = await createReservation(SLUG, input({ date: day }), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, a.id, a.token, NOON);
    expect(await cancelByCustomer(SLUG, a.id, a.token, new Date(`${day}T15:00:00-03:00`))).toMatchObject({ refunded: true });
    const b = await createReservation(SLUG, input({ date: day, time: '20:00' }), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, b.id, b.token, NOON);
    // The screen still said "you get it back", but the deadline passed: ask again.
    await expect(cancelByCustomer(SLUG, b.id, b.token, new Date(`${day}T18:30:00-03:00`), true)).rejects.toThrow(/acabou enquanto/);
    expect(await cancelByCustomer(SLUG, b.id, b.token, new Date(`${day}T18:30:00-03:00`), false)).toMatchObject({ status: 'cancelada', refunded: false });
  });

  it('cancelar não deixa "chegou" depois', async () => {
    const a = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, a.id, a.token, NOON);
    await cancelByStore(SLUG, a.id, 'caixa', at('18:00'));
    await expect(markArrived(SLUG, a.id, 2, 'caixa', at('19:00'))).rejects.toThrow(/confirmada/);
  });

  it('o restaurante cancela e sempre devolve', async () => {
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, r.id, r.token, NOON);
    const done = await cancelByStore(SLUG, r.id, 'caixa', at('19:05'));
    expect(done).toMatchObject({ status: 'cancelada', refunded: true });
  });
});

describe('no salão', () => {
  it('"não veio" só depois da tolerância', async () => {
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, r.id, r.token, NOON);
    await expect(markNoShow(SLUG, r.id, 'caixa', at('19:10'))).rejects.toThrow(/tolerância/);
    expect((await markNoShow(SLUG, r.id, 'caixa', at('19:16'))).status).toBe('nao-veio');
  });

  it('chegou: senta na mesa com o sinal descontado, e o tempo entra no histórico', async () => {
    const r = await createReservation(SLUG, input(), '', ORIGIN, NOON);
    await simulateDeposit(SLUG, r.id, r.token, NOON);
    expect(heldNow(await reservationsOfDay(SLUG, DAY, at('18:45')), at('18:45'))).toBe(1);
    const { credit } = await markArrived(SLUG, r.id, 3, 'caixa', at('19:02'));
    expect(credit).toBe(4000);
    await seatTable(SLUG, 3, { people: 2, reservationId: r.id, credit }, at('19:02'));
    const t = (await floor(SLUG, at('19:30'))).find((x) => x.number === 3)!;
    expect(t).toMatchObject({ people: 2, credit: 4000, confirmed: true, reservationId: r.id });

    const closed = await closeTable(SLUG, 3, 'cartao', 'caixa', at('20:32'));
    await markFinished(SLUG, closed.reservationId!, at('20:32'));
    const hist = await seatingHistory(SLUG, 30, at('21:00'));
    expect(hist).toHaveLength(1);
    expect(hist[0]).toMatchObject({ number: 3, minutes: 90, people: 2, credit: 4000, reserved: true });
    expect((await getReservation(SLUG, r.id))!.status).toBe('concluida');
  });

  it('o garçom senta sem QR, e a página pública mostra só livre/ocupada', async () => {
    await seatTable(SLUG, 1, { people: 4 }, at('19:00'));
    await seatTable(SLUG, 2, { people: null }, at('19:00'));
    const pub = (await publicFloor(SLUG, at('19:30')))!;
    expect(pub).toMatchObject({ total: 6, busy: 2, free: 4, level: 'tranquilo' });
    expect(pub.tables.filter((x) => x.taken).map((x) => x.number)).toEqual([1, 2]);
    expect(JSON.stringify(pub)).not.toMatch(/code|devices|people/);
  });
});

describe('contas do tempo', () => {
  const rec = (minutes: number, drinks: number, total: number, extra: Partial<SeatingRecord> = {}): SeatingRecord => ({
    id: Math.random().toString(36),
    number: 1,
    openedAt: '2026-11-05T22:00:00.000Z',
    closedAt: '2026-11-05T23:00:00.000Z',
    minutes,
    people: 2,
    orders: 1,
    total,
    drinks,
    credit: 0,
    reserved: false,
    ...extra,
  });

  it('separa quem pediu drink, ignora conta esquecida e calcula a mediana', () => {
    const s = stayStats([rec(90, 2, 18000), rec(70, 1, 14000), rec(40, 0, 8000), rec(50, 0, 9000), rec(2, 0, 0), rec(900, 0, 5000)]);
    expect(s.count).toBe(4);
    expect(s.ignored).toBe(2);
    expect(s.drinks).toMatchObject({ count: 2, avgMinutes: 80, avgTicket: 16000 });
    expect(s.noDrinks).toMatchObject({ count: 2, avgMinutes: 45, avgTicket: 8500 });
    expect(s.median).toBe(60);
    expect(s.min).toBe(40);
    expect(s.max).toBe(90);
    expect(s.byWeekday[0].name).toBe('Quinta');
    expect(s.reliable).toBe(false);
  });

  it('nível do salão', () => {
    expect(occupancy(10, 2, 0).level).toBe('tranquilo');
    expect(occupancy(10, 4, 1).level).toBe('movimentado');
    expect(occupancy(10, 8, 1)).toMatchObject({ level: 'cheio', free: 1 });
    expect(occupancy(4, 3, 3)).toMatchObject({ busy: 4, free: 0, level: 'cheio' });
  });
});

describe('Pix real (Mercado Pago simulado)', () => {
  afterEach(() => vi.unstubAllGlobals());

  function mercadoPago(paidAmount: number) {
    const calls: { method: string; url: string }[] = [];
    let reference = '';
    vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET';
      calls.push({ method, url });
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (method === 'POST' && url.endsWith('/v1/payments')) {
        reference = JSON.parse(String(init.body)).external_reference;
        return json({ id: 555, point_of_interaction: { transaction_data: { qr_code: 'PIX-REAL', qr_code_base64: 'AAAA' } } });
      }
      if (method === 'GET') return json({ status: 'approved', transaction_amount: paidAmount / 100, external_reference: reference });
      return json({});
    });
    return calls;
  }

  async function realStore() {
    const s = store();
    s.ordering.pixMode = 'mercadopago';
    await publish(s);
    await setMercadoPagoToken(SLUG, 'TOKEN-DE-TESTE');
  }

  it('Pix pago depois de cancelar é devolvido sozinho', async () => {
    await realStore();
    const calls = mercadoPago(4000);
    const r = await createReservation(SLUG, input({ email: 'ana@teste.local' }), '', ORIGIN, NOON);
    await cancelByCustomer(SLUG, r.id, r.token, NOON);
    expect(calls.some((c) => c.method === 'PUT')).toBe(true); // the open Pix is cancelled at the provider
    expect(await settleReservationFromMercadoPago(SLUG, '555')).toBe(false);
    const saved = (await getReservation(SLUG, r.id))!;
    expect(saved).toMatchObject({ status: 'cancelada', refunded: true });
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/refunds'))).toBe(true);
  });

  it('Pix pago com valor menor que o sinal é devolvido e não confirma', async () => {
    await realStore();
    mercadoPago(1000);
    const r = await createReservation(SLUG, input({ email: 'ana@teste.local' }), '', ORIGIN, NOON);
    expect(await settleReservationFromMercadoPago(SLUG, '555')).toBe(false);
    expect((await getReservation(SLUG, r.id))!).toMatchObject({ status: 'cancelada', refunded: true });
  });

  it('Pix certo confirma', async () => {
    await realStore();
    mercadoPago(4000);
    const r = await createReservation(SLUG, input({ email: 'ana@teste.local' }), '', ORIGIN, NOON);
    expect(await settleReservationFromMercadoPago(SLUG, '555')).toBe(true);
    expect((await getReservation(SLUG, r.id))!.status).toBe('confirmada');
  });
});

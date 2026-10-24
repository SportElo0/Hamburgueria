import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createDiagnosisRequest, DiagnosisError, listDiagnosisRequests, setDiagnosisStatus } from '@/lib/diagnostics';

const ok = { business: 'Barbearia do Léo', segment: 'Barbearia', city: 'Diadema', whatsapp: '(11) 98888-7777', presence: '@barbeariadoleo', wishes: 'Quero agendamento', consent: true };

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'diag-')));
});

describe('pedidos de diagnóstico', () => {
  it('guarda o pedido com o telefone limpo e lista do mais novo ao mais antigo', async () => {
    const a = await createDiagnosisRequest(ok, 'https://growlift.com.br');
    const b = await createDiagnosisRequest({ ...ok, business: 'Doces da Ana', whatsapp: '+55 11 97777-6666' }, '');
    expect(a.whatsapp).toBe('11988887777');
    expect(b.whatsapp).toBe('11977776666');
    expect(a.status).toBe('novo');
    const list = await listDiagnosisRequests(2);
    expect(list.map((r) => r.business)).toEqual(['Doces da Ana', 'Barbearia do Léo']);
  });

  it('exige autorização, nome e WhatsApp válido, e barra robôs', async () => {
    await expect(createDiagnosisRequest({ ...ok, consent: false }, '')).rejects.toThrow(/autorização/);
    await expect(createDiagnosisRequest({ ...ok, business: '' }, '')).rejects.toThrow(DiagnosisError);
    await expect(createDiagnosisRequest({ ...ok, whatsapp: '123' }, '')).rejects.toThrow(/WhatsApp/);
    await expect(createDiagnosisRequest({ ...ok, website: 'spam' }, '')).rejects.toThrow(DiagnosisError);
    expect(await listDiagnosisRequests(2)).toHaveLength(0);
  });

  it('muda a situação do pedido', async () => {
    const a = await createDiagnosisRequest(ok, '');
    await setDiagnosisStatus(a.id, 'enviado');
    expect((await listDiagnosisRequests(2))[0].status).toBe('enviado');
  });
});

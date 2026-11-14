import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { horariosLivres, marcarVisita, remarcarPeloCliente, visitas } from '@/server/agenda';
import { fecharPool, tx, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { adicionarHorario, ativarProfissional, dataLocal, desfazerAjuste, gradeDoDia, instante, salvarProfissional, somarDias, tirarHorario, vagasLivres } from '@/server/profissionais';
import { receberPedido } from '@/server/pedidos';
import { meta, novaEmpresa, pedido, telefone, type Cenario } from './apoio';

const FUSO = 'America/Sao_Paulo';
const TODO_DIA = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), [[480, 720]]])) as Record<string, [number, number][]>;
let A: Cenario;
let carla: string;
let rafael: string;
let dia: string; // two days from now, local

const novaOportunidade = async () => (await receberPedido(A.empresa, pedido({ telefone: telefone() }), meta())) as { oportunidadeId: string; contatoId: string };
const marcar = (oportunidadeId: string, inicio: Date, profissionalId?: string) =>
  tx((db) => marcarVisita(db, A.empresa, { oportunidadeId, inicio, origem: 'cliente', checarLivre: true, profissionalId }));
const as = (min: number) => instante(dia, min, FUSO);

beforeAll(async () => {
  A = await novaEmpresa('Clima Profissionais');
  await salvarConfig(A.admin, 'agenda', { ativa: true, duracao_min: 60, antecedencia_horas: 0, janela_dias: 10 });
  A.empresa = (await empresaPorId(A.empresa.id))!;
  dia = somarDias(dataLocal(new Date(), FUSO), 2);
  carla = await salvarProfissional(A.admin, { nome: 'Carla', funcao: 'Instalação', semana: TODO_DIA });
  rafael = await salvarProfissional(A.admin, { nome: 'Rafael', semana: { [String(new Date(`${dia}T12:00:00Z`).getUTCDay())]: [[480, 600]] } });
});
afterAll(fecharPool);

describe('agenda por profissional', () => {
  it('cada profissional tem os horários da sua semana, na duração da empresa', async () => {
    const g = await gradeDoDia(A.empresa, dia);
    const de = (id: string) => g.filter((v) => v.profissionalId === id).map((v) => v.inicio.toISOString());
    expect(de(carla)).toEqual([480, 540, 600, 660].map((m) => as(m).toISOString()));
    expect(de(rafael)).toEqual([480, 540].map((m) => as(m).toISOString()));
    expect(g.every((v) => v.estado === 'livre')).toBe(true);
  });

  it('a assistente e a página veem um horário livre quando pelo menos um profissional está livre', async () => {
    const hs = await horariosLivres(A.empresa, 1000);
    const doDia = hs.filter((h) => dataLocal(h.inicio, FUSO) === dia).map((h) => h.inicio.toISOString());
    expect(doDia).toEqual([480, 540, 600, 660].map((m) => as(m).toISOString()));
  });

  it('o cliente escolhe o profissional; o mesmo horário fica livre com o outro', async () => {
    const o1 = await novaOportunidade();
    await marcar(o1.oportunidadeId, as(480), rafael);
    const v = (await visitas(A.admin, as(0), as(1439))).find((x) => x.oportunidade_id === o1.oportunidadeId)!;
    expect(v.profissional).toBe('Rafael');
    const livres8 = (await vagasLivres(A.empresa)).filter((x) => x.inicio.getTime() === as(480).getTime()).map((x) => x.profissionalId);
    expect(livres8).toEqual([carla]);
    // Without choosing, the next booking at 8h goes to whoever is still free.
    const o2 = await novaOportunidade();
    await marcar(o2.oportunidadeId, as(480));
    const v2 = (await visitas(A.admin, as(0), as(1439))).find((x) => x.oportunidade_id === o2.oportunidadeId)!;
    expect(v2.profissional).toBe('Carla');
    const o3 = await novaOportunidade();
    await expect(marcar(o3.oportunidadeId, as(480))).rejects.toThrow('não está mais livre');
  });

  it('o dono tira um horário e devolve; tirar o dia some com tudo', async () => {
    await tirarHorario(A.admin, carla, dia, 600);
    let g = await gradeDoDia(A.empresa, dia);
    const v10 = g.find((v) => v.profissionalId === carla && v.inicio.getTime() === as(600).getTime())!;
    expect(v10.estado).toBe('tirado');
    expect((await vagasLivres(A.empresa)).some((x) => x.profissionalId === carla && x.inicio.getTime() === as(600).getTime())).toBe(false);
    await desfazerAjuste(A.admin, v10.ajusteId!);
    g = await gradeDoDia(A.empresa, dia);
    expect(g.find((v) => v.profissionalId === carla && v.inicio.getTime() === as(600).getTime())!.estado).toBe('livre');

    await tirarHorario(A.admin, rafael, dia, null);
    g = await gradeDoDia(A.empresa, dia);
    // The visit already booked stays; the free time goes.
    expect(g.filter((v) => v.profissionalId === rafael).map((v) => v.estado)).toEqual(['visita', 'tirado']);
  });

  it('o dono põe um horário extra fora do horário de trabalho, e não duplica um que já existe', async () => {
    await adicionarHorario(A.admin, carla, dia, '15:30');
    const g = await gradeDoDia(A.empresa, dia);
    const extra = g.find((v) => v.profissionalId === carla && v.inicio.getTime() === as(930).getTime())!;
    expect(extra).toMatchObject({ estado: 'livre', extra: true });
    await expect(adicionarHorario(A.admin, carla, dia, '9:00')).rejects.toThrow('já existe');
    await desfazerAjuste(A.admin, extra.ajusteId!);
    expect((await gradeDoDia(A.empresa, dia)).some((v) => v.inicio.getTime() === as(930).getTime())).toBe(false);
  });

  it('o cliente remarca pelo WhatsApp: fica com o mesmo profissional se ele estiver livre', async () => {
    const o = await novaOportunidade();
    await marcar(o.oportunidadeId, as(540), carla);
    await tx((db) => remarcarPeloCliente(db, A.empresa, o.contatoId, as(660)));
    const v = (await visitas(A.admin, as(0), as(1439))).find((x) => x.oportunidade_id === o.oportunidadeId)!;
    expect(v.inicio.getTime()).toBe(as(660).getTime());
    expect(v.profissional).toBe('Carla');
  });

  it('cadastro: nome curto, horários sobrepostos, login de fora da equipe e vendedor são recusados', async () => {
    await expect(salvarProfissional(A.admin, { nome: 'X' })).rejects.toThrow('Escreva o nome');
    await expect(salvarProfissional(A.admin, { nome: 'Xavier', semana: { '1': [[480, 720], [700, 800]] } })).rejects.toThrow('sobrepor');
    await expect(salvarProfissional(A.admin, { nome: 'Yara', userId: 'usuario-que-nao-existe' })).rejects.toThrow('não está na equipe');
    await expect(salvarProfissional(A.vendedor, { nome: 'Zeca' })).rejects.toThrow();
    await expect(tirarHorario(A.vendedor, carla, dia, 480)).rejects.toThrow();
  });

  it('desativar o profissional tira os horários dele; a outra empresa não mexe nos ajustes', async () => {
    const B = await novaEmpresa('Clima Outra');
    await expect(tirarHorario(B.admin, carla, dia, 480)).rejects.toThrow('não encontrado');
    await ativarProfissional(A.admin, rafael, false);
    expect((await gradeDoDia(A.empresa, dia)).some((v) => v.profissionalId === rafael)).toBe(false);
    expect(await um('select ativo from profissionais where id = $1', [rafael])).toEqual({ ativo: false });
  });
});

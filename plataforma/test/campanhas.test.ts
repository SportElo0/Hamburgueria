import { describe, expect, it } from 'vitest';
import { CAMPAIGN_TEMPLATES, campaignMessage, campaignProblem, suggestedTemplate } from '@/lib/campanhas';

describe('modelos de campanha', () => {
  it('são 12, com ids únicos, e toda mensagem diz como sair', () => {
    expect(CAMPAIGN_TEMPLATES).toHaveLength(12);
    expect(new Set(CAMPAIGN_TEMPLATES.map((t) => t.id)).size).toBe(12);
    for (const t of CAMPAIGN_TEMPLATES) {
      const msg = campaignMessage(t, 'Casa Teste', '10% de desconto com o cupom VOLTA.', 'https://casa.example');
      expect(msg).toContain('Casa Teste');
      expect(msg.trim().endsWith('responda SAIR.')).toBe(true);
      expect(msg.length).toBeLessThanOrEqual(700);
    }
  });

  it('sugere o modelo do mês, ou o de cliente que sumiu', () => {
    expect(suggestedTemplate(new Date(2026, 4, 3)).id).toBe('maes');
    expect(suggestedTemplate(new Date(2026, 9, 31)).id).toBe('saudade'); // Dia das Crianças já passou
    expect(suggestedTemplate(new Date(2026, 10, 20)).id).toBe('black-friday');
    expect(suggestedTemplate(new Date(2026, 0, 10)).id).toBe('saudade');
  });

  it('não deixa enviar promessa sem cupom, texto entre colchetes nem sem o SAIR', () => {
    const bf = CAMPAIGN_TEMPLATES.find((t) => t.id === 'black-friday')!;
    const nov = CAMPAIGN_TEMPLATES.find((t) => t.id === 'novidade')!;
    const ok = campaignMessage(bf, 'Casa', '20% de desconto com o cupom BF.', '');
    expect(campaignProblem(bf, ok, false)).toMatch(/cupom/);
    expect(campaignProblem(bf, ok, true)).toBe('');
    expect(campaignProblem(nov, campaignMessage(nov, 'Casa', '', ''), false)).toMatch(/colchetes/);
    expect(campaignProblem(CAMPAIGN_TEMPLATES[0], 'Oi!', false)).toMatch(/SAIR/);
  });
});

import { describe, expect, it } from 'vitest';
import { CAMPAIGN_TEMPLATES, campaignMessage, suggestedTemplate } from '@/lib/campanhas';

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
    expect(suggestedTemplate(5).id).toBe('maes');
    expect(suggestedTemplate(11).id).toBe('black-friday');
    expect(suggestedTemplate(1).id).toBe('saudade');
  });
});

import { randomUUID } from 'node:crypto';
import { carregarEnv } from './env';

carregarEnv();

const SENHA = 'demonstracao-2026';

/**
 * Demonstration data: two fictitious companies (to show isolation), their teams and a few requests.
 * Every name, phone and number here is invented. Never run against a production database.
 */
async function main() {
  if (!['desenvolvimento', 'demonstracao'].includes(process.env.AMBIENTE ?? '')) throw new Error('Recusado: dados de demonstração só entram com AMBIENTE=desenvolvimento ou demonstracao definido.');
  const { q, um, fecharPool } = await import('../src/server/db');
  const { criarUsuario } = await import('../src/server/auth');
  const { criarEmpresa, empresaPorId, salvarConfig, definirResponsavelPadrao } = await import('../src/server/empresas');
  const { salvarConhecimento } = await import('../src/server/conhecimento');
  const { receberPedido } = await import('../src/server/pedidos');
  const { mudarEtapa, anotar, definirProximaAcao } = await import('../src/server/oportunidades');
  const { escreverNoChatSite } = await import('../src/server/conversas');
  const { salvarWhatsApp } = await import('../src/server/integracoes');

  if (await um(`select 1 from empresas where slug = 'lumivale-demo'`)) {
    console.log('Os dados de demonstração já existem. Para recomeçar do zero: npm run reiniciar-banco');
    return fecharPool();
  }
  const growlift = await criarUsuario('equipe@growlift.demo', 'Equipe Growlift', SENHA);
  await q('insert into admins_plataforma (user_id) values ($1)', [growlift]);

  async function montar(nome: string, slug: string, prefixo: string, site: Record<string, unknown>, conhecimento: Record<string, unknown>) {
    const e = await criarEmpresa(growlift, { nome, slug, segmento: 'energia-solar', demonstracao: true });
    const admin = await criarUsuario(`admin@${prefixo}.demo`, `Carla Admin (${prefixo})`, SENHA);
    const vendedor = await criarUsuario(`vendas@${prefixo}.demo`, `Rafael Vendas (${prefixo})`, SENHA);
    await q(`insert into membros (user_id, empresa_id, papel) values ($1, $3, 'admin'), ($2, $3, 'vendedor')`, [admin, vendedor, e.id]);
    const a = { userId: admin, nome: 'Carla Admin', empresaId: e.id, papel: 'admin' as const };
    const v = { userId: vendedor, nome: 'Rafael Vendas', empresaId: e.id, papel: 'vendedor' as const };
    await salvarConfig(a, 'site', { ...e.config.site, ...site });
    await salvarConfig(a, 'avaliacao', { link: 'https://example.com/avaliacao-ficticia' });
    // Every automation on, so the demonstration shows them running (WhatsApp simulated).
    await salvarConfig(a, 'regras', { ...e.config.regras, retorno_auto_cliente: true, retorno_auto_horas: 24, retorno_auto_horas_2: 72, avaliacao_auto: true });
    await salvarConhecimento(a, conhecimento);
    await definirResponsavelPadrao(a, vendedor);
    await salvarWhatsApp(a, { modo: 'simulador', modelo_confirmacao: 'demo_confirmacao', modelo_retorno: 'demo_retorno', modelo_avaliacao: 'demo_avaliacao' });
    return { empresa: (await empresaPorId(e.id))!, a, v };
  }

  const lumi = await montar(
    'Lumivale Energia Solar',
    'lumivale-demo',
    'lumivale',
    {
      chamada: 'Energia solar para a sua casa ou empresa',
      imagem: '/demo/telhado.webp',
      descricao: 'Empresa fictícia de demonstração. Projeto, instalação e manutenção de painéis solares, com atendimento do pedido até a entrega.',
      servicos: [
        { titulo: 'Residencial', texto: 'Casas e sobrados, em telhado de cerâmica, fibrocimento ou laje.' },
        { titulo: 'Comercial e condomínios', texto: 'Lojas, galpões e áreas comuns, com instalação planejada para não parar o funcionamento.' },
        { titulo: 'Manutenção e limpeza', texto: 'Limpeza das placas e verificação do inversor e das conexões.' },
        { titulo: 'Bombeamento solar rural', texto: 'Bomba d\'água ligada aos painéis para irrigação e bebedouro.' },
      ],
      areas: ['Campinas', 'Valinhos', 'Vinhedo', 'Indaiatuba'],
      projetos: [
        { titulo: 'Casa em Valinhos', texto: 'Exemplo ilustrativo: telhado de cerâmica.' },
        { titulo: 'Padaria em Campinas', texto: 'Exemplo ilustrativo: cobertura metálica.' },
        { titulo: 'Sítio em Indaiatuba', texto: 'Exemplo ilustrativo: bombeamento.' },
      ],
      whatsapp: '11900000000',
      email: 'contato@lumivale.demo',
      endereco: 'Campinas, SP (endereço fictício)',
      responsavel_dados: 'Carla (fictícia) · contato@lumivale.demo',
      razao_social: 'Lumivale Energia Solar Ltda (fictícia)',
      cnpj: '00.000.000/0001-00 (fictício)',
      privacidade: 'Texto de exemplo de uma empresa fictícia. Uma empresa real escreve aqui a sua política, revisada por um advogado.',
    },
    {
      descricao: 'A Lumivale (empresa fictícia) projeta e instala sistemas de energia solar em casas, comércios e propriedades rurais.',
      servicos: 'Projeto e instalação residencial e comercial; manutenção e limpeza de placas; bombeamento solar rural.',
      horarios: 'Segunda a sexta, das 8h às 18h. Sábado, das 8h às 12h.',
      regioes: 'Atendemos Campinas, Valinhos, Vinhedo e Indaiatuba.',
      faq: [
        { pergunta: 'Quanto tempo leva a instalação?', resposta: 'Em uma casa, a instalação costuma levar de 2 a 3 dias. Antes disso há o projeto e a aprovação na distribuidora, que têm prazo próprio.' },
        { pergunta: 'Vocês fazem a visita técnica?', resposta: 'Sim, a visita técnica é feita por alguém da equipe, que combina o dia e o horário com você.' },
        { pergunta: 'Funciona em dia nublado?', resposta: 'O sistema continua gerando em dias nublados, só que menos do que em dias de sol.' },
      ],
      precos_autorizados: '',
      regras_comerciais: 'O orçamento é feito por um vendedor depois de entender o imóvel e a conta de luz. Não informar valores, descontos nem prazos de retorno do investimento pelo chat.',
      criterios_encaminhamento: 'Dúvidas sobre financiamento, garantia e dimensionamento vão para um vendedor.',
    },
  );
  const sol = await montar(
    'Sol do Vale Engenharia',
    'soldovale-demo',
    'soldovale',
    { chamada: 'Projetos de energia solar no Vale do Paraíba', descricao: 'Segunda empresa fictícia, usada para demonstrar que os dados de cada cliente ficam separados.', servicos: [{ titulo: 'Projetos residenciais', texto: '' }], areas: ['São José dos Campos', 'Taubaté'], whatsapp: '12900000000', email: 'contato@soldovale.demo' },
    { descricao: 'Sol do Vale (empresa fictícia).', regioes: 'São José dos Campos e Taubaté.', horarios: 'Segunda a sexta, das 9h às 17h.' },
  );

  const novo = (empresa: typeof lumi.empresa, i: number, dados: Record<string, unknown>) =>
    receberPedido(empresa, { preferencia_contato: 'WhatsApp', aceite_whatsapp: true, chave_idempotencia: randomUUID(), extras: { tipo_imovel: 'Casa' }, ...dados }, { origem: 'site', ipHash: `demo-${i}` });
  const id = (r: Awaited<ReturnType<typeof novo>>) => ('oportunidadeId' in r ? r.oportunidadeId : '');

  const p1 = id(await novo(lumi.empresa, 1, { nome: 'Marina Duarte (fictícia)', telefone: '11900000101', cidade: 'Valinhos', necessidade: 'Quero reduzir a conta de luz da minha casa.', extras: { tipo_imovel: 'Casa', gasto_mensal: '480' }, campanha: { utm_source: 'google', utm_campaign: 'solar-residencial' } }));
  const p2 = id(await novo(lumi.empresa, 2, { nome: 'Otávio Reis (fictício)', telefone: '11900000102', cidade: 'Campinas', necessidade: 'Orçamento para a cobertura da minha padaria.', extras: { tipo_imovel: 'Comércio', gasto_mensal: '2300' } }));
  const p3 = id(await novo(lumi.empresa, 3, { nome: 'Helena Prado (fictícia)', telefone: '11900000103', cidade: 'Vinhedo', necessidade: 'Limpeza das placas que já tenho.', aceite_whatsapp: false, preferencia_contato: 'Ligação' }));
  const p4 = id(await novo(lumi.empresa, 4, { nome: 'Sérgio Lima (fictício)', telefone: '11900000104', cidade: 'Indaiatuba', necessidade: 'Bomba solar para o sítio.', extras: { tipo_imovel: 'Rural' } }));
  await novo(lumi.empresa, 5, { nome: 'Bianca Nunes (fictícia)', telefone: '11900000105', cidade: 'Campinas', necessidade: 'Energia solar para apartamento, é possível?', extras: { tipo_imovel: 'Apartamento ou condomínio' } });

  await mudarEtapa(lumi.v, p1, { etapa: 'atendimento' });
  await anotar(lumi.v, p1, 'Liguei e confirmei os dados. Pediu visita no sábado de manhã.');
  await definirProximaAcao(lumi.v, p1, 'Confirmar a visita técnica', new Date(Date.now() + 86_400_000));
  await mudarEtapa(lumi.v, p2, { etapa: 'qualificado' });
  await mudarEtapa(lumi.v, p2, { etapa: 'proposta', valorCentavos: 6_800_000 });
  await mudarEtapa(lumi.v, p3, { etapa: 'ganho', valorCentavos: 45_000 });
  await mudarEtapa(lumi.v, p4, { etapa: 'perdido', motivoPerda: 'Decidiu adiar o projeto.' });

  const chat = await escreverNoChatSite(lumi.empresa, null, 'Funciona em dia nublado?', 'demo-chat');
  await escreverNoChatSite(lumi.empresa, chat.token, 'Quero falar com um atendente', 'demo-chat');

  await novo(sol.empresa, 6, { nome: 'Cliente da Sol do Vale (fictício)', telefone: '12900000201', cidade: 'Taubaté', necessidade: 'Projeto para minha casa.' });

  await fecharPool();
  console.log(`
Dados de demonstração criados (tudo fictício). Senha de todos os logins: ${SENHA}

  Equipe Growlift ........ equipe@growlift.demo
  Lumivale, admin ........ admin@lumivale.demo
  Lumivale, vendedor ..... vendas@lumivale.demo
  Sol do Vale, admin ..... admin@soldovale.demo
  Sol do Vale, vendedor .. vendas@soldovale.demo

  Site de demonstração: ${process.env.APP_URL ?? 'http://localhost:3100'}/s/lumivale-demo
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

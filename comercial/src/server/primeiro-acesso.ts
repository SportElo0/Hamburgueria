import { criarUsuario } from './auth';
import { type Campo, SEGMENTOS, lerConfig } from './config';
import { q, tx, um } from './db';
import { criarEmpresa, empresaPorId, salvarConfig } from './empresas';

/**
 * First access to a new production database: there is no sign-up and no demo data there, so the first Growlift login
 * comes from three variables set by the partners in Vercel (PRIMEIRO_ADMIN_EMAIL, PRIMEIRO_ADMIN_NOME,
 * PRIMEIRO_ADMIN_SENHA: a new password for this system, never a personal one). Runs at the end of the build's migration,
 * only while no Growlift admin exists; after the first login the variables can be deleted. Also creates the company
 * "Growlift" (the first customer of its own system), speaking as the company, with the content of growlift.com.br as a
 * first draft of the knowledge (to be reviewed before turning the assistant on).
 * Prints only whether it ran, never the e-mail or the password.
 */
export async function prepararPrimeiroAcesso(env: Record<string, string | undefined> = process.env, { somenteSeVazio = true } = {}): Promise<string> {
  const email = env.PRIMEIRO_ADMIN_EMAIL?.trim().toLowerCase();
  const senha = env.PRIMEIRO_ADMIN_SENHA ?? '';
  const nome = env.PRIMEIRO_ADMIN_NOME?.trim() || 'Equipe Growlift';
  if (!email || !senha) return 'primeiro acesso: não configurado (sem PRIMEIRO_ADMIN_EMAIL e PRIMEIRO_ADMIN_SENHA)';
  if (somenteSeVazio && (await um('select 1 from admins_plataforma limit 1'))) return 'primeiro acesso: já existe administrador da Growlift; pode apagar as variáveis PRIMEIRO_ADMIN_*';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'primeiro acesso: PRIMEIRO_ADMIN_EMAIL inválido';
  if (senha.length < 10) return 'primeiro acesso: PRIMEIRO_ADMIN_SENHA precisa de pelo menos 10 caracteres';
  if (await um('select 1 from "user" where email = $1', [email])) return 'primeiro acesso: já existe um login com esse e-mail';

  const userId = await criarUsuario(email, nome, senha);
  await q('insert into admins_plataforma (user_id) values ($1)', [userId]);
  if (await um(`select 1 from empresas where slug = 'growlift'`)) return 'primeiro acesso: administrador criado (a empresa Growlift já existia)';
  const e = await criarEmpresa(userId, { nome: 'Growlift', slug: 'growlift', segmento: 'servicos-gerais' });
  await q(`insert into membros (user_id, empresa_id, papel) values ($1, $2, 'admin')`, [userId, e.id]);
  const ctx = { userId, nome, empresaId: e.id, papel: 'admin' as const };
  await salvarConfig(ctx, 'ia', { ...(await empresaPorId(e.id))!.config.ia, falar_como_marca: true });
  await q('update conhecimento set dados = $2 where empresa_id = $1 and versao = 1', [e.id, JSON.stringify(CONHECIMENTO_GROWLIFT)]);
  await atualizarGrowlift();
  return 'primeiro acesso: administrador da Growlift e empresa Growlift criados';
}

/** Public key of the Growlift company, written in growlift.com.br (chat.js and the diagnostic form). Public by design. */
export const CHAVE_SITE_GROWLIFT = 'pk_growlift_site';

/** The diagnostic questions of growlift.com.br, so each answer arrives as its own field in the request. */
export const CAMPOS_GROWLIFT: Campo[] = [
  { id: 'ramo', rotulo: 'Ramo do negócio', tipo: 'texto', opcoes: [], obrigatorio: true, pergunta: 'Qual é o ramo do seu negócio?' },
  { id: 'dor', rotulo: 'O que mais atrapalha hoje', tipo: 'texto', opcoes: [], obrigatorio: false, pergunta: 'O que mais atrapalha hoje no atendimento ou nas vendas?' },
  { id: 'volume', rotulo: 'Atendimentos ou pedidos por dia', tipo: 'texto', opcoes: [], obrigatorio: false, pergunta: 'Mais ou menos quantos atendimentos ou pedidos chegam por dia?' },
  { id: 'quem_responde', rotulo: 'Quem responde o WhatsApp hoje', tipo: 'texto', opcoes: [], obrigatorio: false, pergunta: 'Hoje, quem responde o WhatsApp do negócio?' },
  { id: 'presenca', rotulo: 'Instagram ou site', tipo: 'texto', opcoes: [], obrigatorio: false, pergunta: 'O negócio tem Instagram ou site? Qual?' },
];

/** Company data shown in the chat and in the privacy notice; the same as in growlift.com.br. */
const SITE_GROWLIFT = {
  descricao: 'A Growlift monta no seu negócio um sistema que responde quem pergunta, transforma ligação perdida em conversa, lembra quem sumiu e mostra quais pedidos viraram venda.',
  whatsapp: '11942279336',
  email: 'contato@growlift.com.br',
  endereco: 'Rua Barão de Monte Mor, 55, Real Parque, São Paulo/SP, CEP 05687-010',
  razao_social: '69.611.450 LUCAS CORREA ENNSER',
  cnpj: '69.611.450/0001-17',
  responsavel_dados: 'contato@growlift.com.br',
  link_privacidade: 'https://growlift.com.br/privacidade.html',
};

/**
 * Keeps the Growlift company ready for growlift.com.br, at every build. The public key must always match the site.
 * The rest is applied once, while the company is still as it was created (diagnostic fields still the segment's
 * defaults, or the knowledge still the untouched first draft), so nothing the partners change in the panel is undone:
 * the diagnostic fields, the empty company data, the 12 months of the site's privacy policy and the full knowledge.
 * Does nothing when the company does not exist (demo databases, a database not set up yet).
 */
export async function atualizarGrowlift(): Promise<string> {
  return tx(async (db) => {
    const e = await um<{ id: string; config: unknown; chave_publica: string }>(`select id, config, chave_publica from empresas where slug = 'growlift' for update`, [], db);
    if (!e) return 'growlift: empresa não existe neste banco';
    const feito: string[] = [];
    if (e.chave_publica !== CHAVE_SITE_GROWLIFT) {
      await q('update empresas set chave_publica = $2 where id = $1', [e.id, CHAVE_SITE_GROWLIFT], db);
      feito.push('chave do site');
    }
    const c = lerConfig(e.config);
    const ultima = await um<{ versao: number; rascunho: boolean }>(
      'select versao, dados = $2::jsonb as rascunho from conhecimento where empresa_id = $1 order by versao desc limit 1',
      [e.id, JSON.stringify(RASCUNHO_1_GROWLIFT)],
      db,
    );
    const camposPadrao = JSON.stringify(c.campos) === JSON.stringify(SEGMENTOS['servicos-gerais'].campos);
    if (camposPadrao || ultima?.rascunho) {
      if (camposPadrao) c.campos = CAMPOS_GROWLIFT;
      for (const [k, v] of Object.entries(SITE_GROWLIFT) as [keyof typeof SITE_GROWLIFT, string][]) if (!c.site[k]) c.site[k] = v;
      if (c.dados.guarda_meses === 24) c.dados.guarda_meses = 12;
      await q('update empresas set config = $2 where id = $1', [e.id, JSON.stringify(c)], db);
      feito.push('perguntas do diagnóstico e dados da empresa');
    }
    if (ultima?.rascunho) {
      await q('insert into conhecimento (empresa_id, versao, dados) values ($1, $2, $3)', [e.id, ultima.versao + 1, JSON.stringify(CONHECIMENTO_GROWLIFT)], db);
      feito.push(`conhecimento versão ${ultima.versao + 1}`);
    }
    return feito.length ? `growlift: atualizado (${feito.join(', ')})` : 'growlift: nada a atualizar';
  });
}

/** First draft (24/11/2026), kept only to recognize it untouched and replace it with the full knowledge. */
export const RASCUNHO_1_GROWLIFT = {
  descricao:
    'A Growlift monta no seu negócio um sistema que responde quem pergunta, transforma ligação perdida em conversa, lembra quem sumiu e mostra quais pedidos viraram venda. Diagnóstico grátis.',
  servicos:
    'O sistema mensal: site com uma assistente de IA que só fala o que você aprovou, ligação perdida que vira conversa para quem aceitou, retomada de quem pediu orçamento e autorizou, e o relatório do que foi pago.',
  horarios: '',
  regioes: 'A gente atende negócios do Brasil inteiro. É tudo a distância, com a conversa pelo WhatsApp.',
  faq: [
    { pergunta: 'O diagnóstico é pago?', resposta: 'Não. O diagnóstico e o plano são grátis e sem compromisso. Você só paga se quiser começar.' },
    { pergunta: 'Quanto custa?', resposta: 'Depende do que o seu negócio precisa. Por isso não tem tabela fixa: o preço vem no plano, por escrito, depois do diagnóstico, e só começa se você aprovar.' },
    { pergunta: 'Vocês mexem no meu perfil do Google?', resposta: 'Se fizer parte do plano, sim: a gente arruma categoria, horário, fotos e link. O perfil continua no seu nome; a gente recebe acesso de gerente, e você pode tirar esse acesso quando quiser. Todo cliente recebe o mesmo convite para avaliar, sem desconto nem brinde em troca.' },
    { pergunta: 'Vocês garantem mais clientes ou o 1º lugar no Google?', resposta: 'Não. Ninguém pode garantir posição no Google nem número de vendas. O que a gente garante é o combinado por escrito, e o sistema mostra o que aconteceu com cada pedido.' },
    { pergunta: 'Funciona para o meu ramo?', resposta: 'Se você atende clientes na sua cidade, recebe pedidos de orçamento ou de reserva e conversa pelo WhatsApp, quase sempre tem algo para melhorar: pousadas, restaurantes, serviços como ar-condicionado e limpeza, energia solar, clínicas e lojas.' },
    { pergunta: 'Vocês atendem fora de São Paulo?', resposta: 'Sim. A gente atende negócios do Brasil inteiro. É tudo a distância, com a conversa pelo WhatsApp.' },
    { pergunta: 'Como a atendente de IA conversa?', resposta: 'Ela fala do jeito do seu negócio, pode ter um nome e usa só as informações que você passou. Se o cliente perguntar sério se é uma pessoa, ela responde que é a assistente do negócio e oferece chamar alguém da equipe. Quando não sabe a resposta, ela chama você.' },
    { pergunta: 'Quem paga o WhatsApp oficial?', resposta: 'A conta do WhatsApp oficial é do seu negócio, com o seu número. A Meta cobra algumas mensagens direto de você, conforme a tabela dela na época. A gente mostra a estimativa no plano.' },
    { pergunta: 'Tem fidelidade? Posso desistir?', resposta: 'As condições vêm escritas na proposta e no contrato, antes de começar. E você sempre tem 7 dias para desistir sem multa, a contar da assinatura do contrato.' },
    { pergunta: 'Vocês cobram comissão sobre as vendas?', resposta: 'Não. A Growlift cobra o valor combinado no plano, sem comissão sobre os seus pedidos ou serviços. A Meta cobra à parte, direto do seu negócio, as mensagens do WhatsApp oficial.' },
    { pergunta: 'E se eu já tiver site ou sistema?', resposta: 'Melhor ainda: a gente trabalha junto com o que você já usa. Conte no diagnóstico qual é, e o plano parte dele.' },
  ],
  precos_autorizados: '',
  regras_comerciais: '',
  criterios_encaminhamento: 'Quem quiser marcar o diagnóstico, receber uma proposta ou negociar preço: chamar alguém da equipe.',
};

/**
 * Everything growlift.com.br and its terms of use say (24/11/2026), for the site chat. Nothing beyond the site: no price
 * (it comes in the written plan), no client, no result. Prices of the plans enter here only once they are on the site.
 */
export const CONHECIMENTO_GROWLIFT = {
  descricao:
    'A Growlift monta no seu negócio um sistema que responde quem pergunta, transforma ligação perdida em conversa, lembra quem sumiu e mostra quais pedidos viraram venda. É para negócios locais que vendem por orçamento ou reserva: pousadas, restaurantes, clínicas, imobiliárias, serviços (ar-condicionado, limpeza, reforma, energia solar), oficinas e lojas. A Growlift é o Lucas e o Antônio, jovens de São Paulo: os dois montam os sistemas, as automações e os sites, e atendem os clientes. Empresa: 69.611.450 LUCAS CORREA ENNSER, CNPJ 69.611.450/0001-17, Rua Barão de Monte Mor, 55, Real Parque, São Paulo/SP, CEP 05687-010. Contato: WhatsApp (11) 94227-9336, e-mail contato@growlift.com.br, Instagram @growlift.ai, site growlift.com.br.',
  servicos: [
    'Atendente de IA no WhatsApp: responde de dia e de noite, com os preços e os horários do negócio, faz orçamento e marca na agenda. Ouve áudio e entende o pedido. Fala do jeito do negócio, pode ter um nome, usa só as informações que o negócio aprovou e chama alguém da equipe quando não sabe.',
    'Ligação perdida vira conversa: quem liga e não é atendido recebe uma mensagem no WhatsApp só se aceitar (aperta 1 na ligação). A equipe sempre ganha a tarefa de retornar a ligação.',
    'Retomada de quem sumiu: mandou o orçamento e o cliente não respondeu? Sai uma retomada para quem autorizou ao pedir, e ela para na hora em que ele responde.',
    'Avaliações no Google: depois do serviço, o convite para avaliar vai para todos os clientes, sem escolher quem teve uma experiência boa.',
    'Relatório de vendas pagas: cada pedido acompanhado até a venda e o relatório do que foi pago.',
    'Para clínicas: atendimento no WhatsApp da clínica, com o nome e o jeito dela. Mostra os horários livres e marca, remarca, confirma na véspera, ouve áudio e avisa a equipe quando o assunto é urgente. Não faz triagem nem dá orientação de saúde.',
    'Para restaurantes: reservas, pedidos e Pix. Em teste: cardápio em 3D, em que o cliente gira o prato no celular e coloca na mesa pela câmera, do tamanho real.',
    'Para imobiliárias: o site da imobiliária com um painel para editar tudo (cadastrar imóvel, trocar foto e preço). Uma vez por mês, os proprietários que autorizaram recebem uma pergunta se o imóvel continua disponível e por quanto; se alugou ou vendeu, o corretor confirma e o imóvel sai do site. A atendente responde quem procura imóvel e marca a visita com o corretor.',
    'Sites: a Growlift também faz sites. Quando o plano inclui site, o domínio é registrado no nome do negócio.',
    'Perfil do Google: se fizer parte do plano, a gente arruma categoria, horário, fotos e link. O perfil continua no nome do negócio.',
    'Como começa: 1º o diagnóstico grátis (3 perguntas no site, mais ou menos 1 minuto, ou uma conversa no WhatsApp). Em até 2 dias úteis chega no WhatsApp o que a gente faria no lugar do negócio, por onde começar e quanto custa, por escrito. 2º começa pelo que mais trava, uma peça de cada vez. 3º depois, o sistema, se fizer sentido.',
  ].join('\n'),
  horarios: '',
  regioes: 'A gente atende negócios do Brasil inteiro. É tudo a distância, com a conversa pelo WhatsApp. A Growlift fica em São Paulo/SP.',
  faq: [
    ...RASCUNHO_1_GROWLIFT.faq.map((f) =>
      f.pergunta === 'Funciona para o meu ramo?' ? { ...f, resposta: `${f.resposta} O cardápio em 3D, ainda em teste, é para quem vende comida.` } : f,
    ),
    { pergunta: 'Como peço o diagnóstico?', resposta: 'Pelo formulário do site (3 perguntas, mais ou menos 1 minuto) ou numa conversa no WhatsApp (11) 94227-9336. Se preferir, pode mandar aqui mesmo o nome do negócio, o ramo, a cidade e o seu WhatsApp, que a equipe recebe.' },
    { pergunta: 'Em quanto tempo chega o plano?', resposta: 'Em até 2 dias úteis depois do pedido, pelo WhatsApp: o diagnóstico, por onde começar e quanto custa.' },
    { pergunta: 'Quem lê o diagnóstico?', resposta: 'Gente: o Lucas e o Antônio leem cada diagnóstico e montam o plano. Quem conversa com você é quem faz.' },
    { pergunta: 'Quem é a Growlift?', resposta: 'O Lucas e o Antônio, jovens de São Paulo. O Lucas cuida de automação, sites e atendimento; o Antônio, da programação: IA, automações e 3D. Os dois montam os sistemas e atendem os clientes.' },
    { pergunta: 'Como falo com vocês?', resposta: 'Pelo WhatsApp (11) 94227-9336, pelo e-mail contato@growlift.com.br ou pelo Instagram @growlift.ai.' },
    { pergunta: 'Vocês mandam mensagem para quem não pediu?', resposta: 'Não. O sistema só escreve para quem autorizou, e sempre tem a opção SAIR.' },
    { pergunta: 'Vocês compram avaliação ou dão brinde por avaliação?', resposta: 'Não. Todo cliente recebe o mesmo convite, sem desconto nem brinde, porque as regras do Google proíbem pagar ou premiar por avaliação.' },
    { pergunta: 'Como cancelo?', resposta: 'Você pode desistir em até 7 dias da assinatura do contrato, sem multa e sem explicar o motivo, e recebe de volta tudo o que pagou. Depois disso, pode cancelar quando quiser; se o contrato tiver fidelidade, valem as condições escritas nele. Para pedir, escreva para contato@growlift.com.br com o assunto "Cancelamento" ou peça pelo WhatsApp. A gente confirma por escrito.' },
    { pergunta: 'O domínio do site fica no nome de quem?', resposta: 'Quando o plano inclui site, o domínio é registrado no nome do seu negócio.' },
    { pergunta: 'A atendente funciona com o meu número de WhatsApp?', resposta: 'Ela roda no WhatsApp oficial (da Meta), numa conta do seu negócio, com o seu número. No diagnóstico a gente vê como fica no seu caso.' },
    { pergunta: 'A atendente entende áudio?', resposta: 'Sim. Ela ouve o áudio que o cliente manda e entende o pedido.' },
    { pergunta: 'A atendente da clínica dá orientação de saúde?', resposta: 'Não. Ela não faz triagem nem dá orientação de saúde. Responde só com as informações da clínica e avisa a equipe quando o assunto é urgente.' },
    { pergunta: 'O que é o cardápio em 3D?', resposta: 'É um cardápio, ainda em teste, em que o cliente gira o prato no celular e pode colocá-lo na mesa pela câmera, do tamanho real. É para quem vende comida.' },
    { pergunta: 'Os exemplos do site são clientes de vocês?', resposta: 'Não. As telas, as conversas e os sites mostrados no site são exemplos, com nomes e valores fictícios, feitos para mostrar o que dá para fazer.' },
    { pergunta: 'Como vocês usam os meus dados?', resposta: 'Só para preparar e conversar sobre o diagnóstico e o plano. Não vendemos nem repassamos para propaganda. Você pode pedir para ver, corrigir ou apagar os dados escrevendo para contato@growlift.com.br. Está tudo na política de privacidade: growlift.com.br/privacidade.html.' },
  ],
  precos_autorizados: '',
  regras_comerciais:
    'Não dizer preço de plano: o preço vem no plano, por escrito, depois do diagnóstico. Não prometer posição no Google, número de vendas ou de clientes, nem prazo além dos escritos aqui (plano em até 2 dias úteis). Não citar clientes. Não fechar contrato, não cobrar e não mandar link de pagamento pelo chat. Para quem quiser o diagnóstico, pedir o nome do negócio, o ramo, a cidade e o WhatsApp, ou indicar o formulário do site.',
  criterios_encaminhamento:
    'Chamar alguém da equipe quando a pessoa: quiser o diagnóstico e já tiver deixado o WhatsApp; pedir proposta, preço ou desconto; quiser contratar, cancelar ou falar do contrato; já for cliente e tiver um problema; ou perguntar algo que não está nestas informações.',
};

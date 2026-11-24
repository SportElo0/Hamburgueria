import { criarUsuario } from './auth';
import { q, um } from './db';
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
  return 'primeiro acesso: administrador da Growlift e empresa Growlift criados';
}

/** First draft, copied from what growlift.com.br already says (nothing new). Reviewed in the panel before the assistant goes on. */
export const CONHECIMENTO_GROWLIFT = {
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

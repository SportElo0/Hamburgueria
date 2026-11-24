/**
 * Growlift's services ("Serviços" tab of the team panel): one card per product, with a demo picture, a short
 * explanation and where it stands. Starts with the list the team talked about (23/11); they edit it from there.
 * Pure functions and data only. Pictures in /public/servicos are screens of our own demos with fictitious data.
 */

export const SITUACOES = ['pronto', 'falta-ligar', 'teste', 'ideia'] as const;
export type Situacao = (typeof SITUACOES)[number];
export const NOME_SITUACAO: Record<Situacao, string> = {
  pronto: 'Pronto para vender',
  'falta-ligar': 'Falta ligar algo',
  teste: 'Em teste',
  ideia: 'Ideia',
};

export interface Servico {
  id: string;
  nome: string;
  /** What it is, in one or two sentences. */
  resumo: string;
  /** The client's problem it solves, in the client's words (what the search reads first). Older saved cards lack it. */
  problema?: string;
  situacao: Situacao;
  /** '' | a picture of the defaults (/servicos/x.webp) | an upload (midia/growlift-servicos/<id>.<ext>). */
  imagem: string;
  /** Link to a demonstration ('' when there is none). */
  demo: string;
  criadoEm: string;
}

export const MAX_SERVICOS = 100;
export const MAX_RESUMO = 300;
export const MAX_PROBLEMA = 200;
/** Uploaded pictures live here, served by /api/midia (folder name no store slug would take). */
export const PASTA_FOTOS = 'growlift-servicos';

const COMERCIAL = 'https://growlift-comercial.vercel.app';
const PAINEL = 'https://painel-lojas-sportelo.vercel.app';

const s = (id: string, nome: string, situacao: Situacao, resumo: string, problema: string, demo = '', criadoEm = '2026-11-23'): Servico => ({ id, nome, situacao, resumo, problema, imagem: `/servicos/${id}.webp`, demo, criadoEm });

/**
 * Cards the team asked to add after the list was first saved (the saved list wins, so they are merged in once).
 * Once delivered, a card is the team's like any other: deleting it does not bring it back.
 */
function SERVICOS_ADICIONADOS_LISTA(): Servico[] {
  const ideia = (id: string, nome: string, resumo: string, problema: string) => s(id, nome, 'ideia', resumo, problema, '', '2026-11-24');
  return [
    s('mesa-conectada', 'Página da mesa (QR e NFC)', 'ideia', 'Uma página que abre pelo QR ou por NFC na mesa: cardápio, cartão fidelidade com selos, Wi-Fi, Instagram e avaliação no Google num lugar só. Quem quiser deixa o contato para receber promoções, com aceite e opção de sair.', 'O cliente não segue o Instagram, não avalia e não volta; o cartão fidelidade de papel se perde.'),
    s('catalogo-lojista', 'Catálogo com carrinho no WhatsApp', 'ideia', 'Catálogo da loja no celular, com fotos, preços e estoque. O cliente monta o carrinho e manda o pedido pronto no WhatsApp da loja, com itens e total. O lojista cadastra pela foto do produto: a IA sugere nome, descrição e categoria, e ele confere o preço. Sem estoque, aparece esgotado.', 'O cliente pede foto e preço de cada produto no WhatsApp e a loja perde o dia mandando catálogo.'),
    // 24/11: 25 soluções de IA de uma lista pública (página de vendas do Viver de IA), reescritas com as nossas palavras e sem os
    // nomes de produto deles, só como repertório. Ideias: nada disso está pronto para vender.
    ideia('sdr-whatsapp', 'Vendedor de IA no WhatsApp (SDR)', 'A IA responde o contato na hora, a qualquer hora, faz as perguntas para saber se ele tem perfil, coloca o lead na etapa certa do funil e passa a conversa para o vendedor quando ele está pronto para comprar.', 'O contato chega à noite ou no fim de semana, ninguém responde e de manhã ele já fechou com o concorrente.'),
    ideia('copiloto-reuniao', 'Copiloto de vendas na reunião', 'Durante a reunião on-line, a IA acompanha a conversa e mostra dicas e alertas ao vendedor com base no roteiro de vendas da empresa: o que perguntar, que objeção tratar. Quem participa precisa ser avisado de que a conversa é analisada.', 'O vendedor erra na reunião e o gestor só descobre depois, quando a venda já se perdeu.'),
    ideia('redes-sociais-ia', 'Posts nas redes com IA e aprovação', 'A IA pesquisa o assunto, escreve, cria a arte e adapta para cada rede (Instagram, Facebook, LinkedIn, TikTok e outras). Uma pessoa da empresa aprova antes, e os posts ficam agendados no calendário.', 'Ninguém tem tempo de postar, o Instagram fica parado e cada post sai num tom diferente.'),
    ideia('caixa-unica', 'Caixa de entrada única (WhatsApp, Instagram, e-mail)', 'Todas as conversas num lugar só: WhatsApp, direct, Messenger, e-mail, chat do site e telefone. Agentes de IA respondem no tom da empresa, inclusive fora do horário, e passam para a equipe quando precisa.', 'As mensagens chegam por vários canais, ninguém sabe quem respondeu e muita coisa fica sem resposta.'),
    ideia('portal-cliente', 'Carteira de clientes + Área do cliente', 'Mostra a saúde de cada cliente (uso, chamados, pagamentos), avisa quando algum corre risco de cancelar e sugere o que fazer. O cliente ganha uma área própria para abrir chamados e trocar documentos.', 'A empresa só descobre que o cliente estava insatisfeito quando ele pede para cancelar.'),
    ideia('estudio-anuncios', 'Estúdio de anúncios com IA', 'A IA analisa os anúncios que mais venderam, explica o que eles têm em comum e cria versões novas no mesmo padrão. Elas ficam prontas para alguém aprovar e subir pausadas na conta de anúncios.', 'Ninguém sabe por que um anúncio vendeu, cada semana é um chute e o designer não dá conta de tanta peça.'),
    ideia('rh-completo', 'RH num sistema só', 'Admissão, documentos, ponto, férias, comunicados e desligamento num lugar só, com IA para tirar dúvidas dos funcionários e preparar documentos. Dados dos funcionários com acesso restrito a quem precisa.', 'O RH vive entre planilha de ponto, sistema pago e recado no WhatsApp, e informação de funcionário se perde.'),
    ideia('agente-cobranca', 'Agente de cobrança por voz', 'A IA liga para quem está com pagamento atrasado, oferece as condições que a empresa definiu e registra o acordo para uma pessoa aprovar. Atenção: hoje a regra da Growlift é a IA não cobrar dívida; só com revisão legal antes (sem constrangimento, com horário e limite de ligações).', 'Tem muita gente devendo, o operador liga um por um e boa parte dos inadimplentes nunca é procurada.'),
    ideia('formulario-conversa', 'Formulário em conversa, com nota do lead', 'Em vez de um formulário comum, o contato responde a uma conversa guiada. Cada resposta vale pontos, o lead ganha uma nota de A a F e já chega ao CRM com a origem (qual anúncio trouxe).', 'O anúncio traz muito contato sem perfil e o comercial perde o dia separando quem vale a pena atender.'),
    ideia('prospeccao-ia', 'Lista de prospecção com IA', 'Você descreve o cliente ideal e a IA monta uma lista de empresas com o contato comercial delas para abordar por WhatsApp ou e-mail. Cuidado com a LGPD e com as regras do Google: nada de lista de pessoas físicas nem de base comprada, e sempre com opção de sair.', 'O vendedor passa o dia procurando contato de cliente novo e metade dos números nem funciona.'),
    ideia('disparo-api-oficial', 'Campanhas no WhatsApp pela API oficial', 'Mensagens de campanha pela API oficial da Meta, com o número da própria empresa e modelos aprovados; quem responde cai num fluxo de atendimento. Só para quem aceitou receber, com opção SAIR, sem envio em massa para lista fria.', 'A empresa manda promoção por um número comum e ele é bloqueado no meio do envio.'),
    ideia('comentou-recebeu', 'Comentou, recebeu no direct', 'Quem comenta uma palavra no post recebe na hora, no direct do Instagram, o link ou o material prometido. É o mesmo esquema do "Comenta a palavra" dos Reels da Growlift, montado para o cliente.', 'O post bomba, chegam centenas de comentários e ninguém consegue responder todo mundo a tempo.'),
    ideia('crm-proprio', 'CRM próprio da empresa', 'Funil de vendas, atendimento com IA, agenda, ligações e automações num sistema instalado só para a empresa, com os dados dela. Dá para partir do Growlift Comercial, que já temos.', 'Os contatos chegam por WhatsApp, Instagram e e-mail e ninguém sabe em que pé está cada negociação.'),
    ideia('painel-trafego', 'Painel do gestor de tráfego', 'Junta as contas de anúncio de todos os clientes num painel, monta a lista de tarefas do dia e liga cada venda ao anúncio que trouxe. Agentes de IA sugerem ajustes dentro dos limites que o gestor definir.', 'O gestor de tráfego pula entre o gerenciador de cada rede, o CRM e a planilha e não sabe qual anúncio vendeu.'),
    ideia('blog-ia', 'Blog com IA', 'A IA escolhe a pauta, pesquisa, escreve, ilustra e publica os posts do blog seguindo a linha da empresa, com revisão de uma pessoa antes de ir ao ar. Pode ajudar a aparecer no Google e nas respostas de IA, sem garantia de posição.', 'O blog para na segunda semana porque ninguém tem tempo de achar assunto e escrever.'),
    ideia('auditoria-seo', 'Relatório de SEO com IA', 'A IA analisa o site (velocidade, títulos, erros), levanta palavras-chave e concorrentes e entrega um plano de melhoria em ordem de prioridade. Serve de porta de entrada para vender o serviço de Google + SEO. Sem garantia de posição.', 'A empresa não aparece no Google e não sabe o que está errado no site.'),
    ideia('helpdesk-ia', 'Central de chamados (suporte)', 'E-mail e formulário do site viram chamado com responsável, prioridade e prazo de resposta. A IA sugere a resposta pela base de conhecimento e, no fim, o cliente avalia o atendimento.', 'O suporte vive num e-mail compartilhado e ninguém sabe quem está cuidando de cada pedido ou reclamação.'),
    ideia('ligacao-transcrita', 'Ligação de vendas transcrita ao vivo', 'Transcreve na hora a ligação de vendas feita pelo WhatsApp e mostra o que ainda falta perguntar ou explicar; no fim, a conversa fica registrada. O cliente precisa ser avisado de que a ligação é transcrita.', 'As vendas por ligação no WhatsApp não deixam registro e o gestor não sabe o que foi combinado.'),
    ideia('financeiro-ia', 'Financeiro com IA (contas, notas e extrato)', 'Contas a pagar e a receber, notas fiscais, vendas e estoque de uma ou mais empresas num lugar só. A IA classifica o extrato do banco e o dono aprova os pagamentos pelo WhatsApp.', 'Extrato, contas e notas fiscais ficam em lugares diferentes e o resultado do mês nunca bate com o banco.'),
    ideia('proposta-assinatura', 'Proposta e contrato assinados no celular', 'A IA preenche a proposta com os dados da conversa, o cliente aceita pelo link e assina o contrato no celular, com registro de quem assinou e quando.', 'A proposta sai do Word, o sim chega pelo WhatsApp e alguém precisa digitar o contrato de novo.'),
    ideia('recrutamento-ia', 'Recrutamento com triagem por IA', 'Publica a vaga, organiza os currículos conforme o perfil pedido, agenda as entrevistas e envia a proposta. A IA só organiza e sugere: quem decide é uma pessoa (LGPD e nada de discriminação).', 'Difícil contratar: o recrutador passa horas lendo currículo de quem não tem o perfil da vaga.'),
    ideia('pesquisa-satisfacao', 'Pesquisa de satisfação (NPS)', 'Depois da compra ou do serviço, o cliente dá uma nota de 0 a 10 por e-mail ou WhatsApp. Nota baixa vira tarefa para alguém da equipe ligar e resolver. O convite para avaliar no Google continua indo para todos, sem filtro.', 'Ninguém pergunta a opinião do cliente e ninguém vai atrás de quem ficou insatisfeito.'),
    ideia('dashboard-ia', 'Painel de números montado pela IA', 'O dono escreve em uma frase o que quer ver (ex.: vendas por vendedor no mês) e a IA monta o painel ligado aos dados reais da empresa, sempre atualizado.', 'O dono junta números de vários sistemas numa planilha e a informação chega atrasada.'),
    ideia('ata-reuniao', 'Ata de reunião com tarefas', 'A IA transforma a reunião em ata, com as decisões e um quadro de tarefas com responsável e prazo, e lembra cada um do que ficou combinado. Todos na reunião precisam saber que ela é gravada.', 'A reunião acaba, todo mundo concorda e uma semana depois ninguém lembra quem ficou com o quê.'),
    ideia('tarefas-whatsapp', 'Tarefas da equipe pelo WhatsApp', 'Quadro de tarefas e agenda da equipe; a IA cria e atualiza as tarefas a partir de mensagens no WhatsApp e também responde no Slack.', 'O pedido chega no WhatsApp, vira linha numa planilha e ninguém mais atualiza; tarefa fica esquecida.'),
  ];
}
export const SERVICOS_ADICIONADOS: Servico[] = SERVICOS_ADICIONADOS_LISTA();

/** The saved list plus the added cards not delivered yet (and not already there). Pure: the caller stores `entregues`. */
export function comAdicionados(lista: Servico[], entregues: string[]): Servico[] {
  const novos = SERVICOS_ADICIONADOS.filter((a) => !entregues.includes(a.id) && !lista.some((x) => x.id === a.id));
  return [...lista, ...novos.map((n) => structuredClone(n))];
}

export const SERVICOS_INICIAIS: Servico[] = [
  s('site-ia', 'Site com chat de IA', 'pronto', 'Site da empresa com uma assistente que responde a qualquer hora, só com as informações do cliente, e entrega o pedido de orçamento ou reserva pronto para a equipe.', 'O cliente entra no site fora do horário, não acha a resposta e vai embora sem pedir orçamento.', `${COMERCIAL}/s/pousada-demo`),
  s('google', 'Perfil no Google + SEO', 'pronto', 'A gente arruma o perfil no Google (categoria, horário, fotos reais, link) e o título das páginas do site, para a empresa aparecer certo nas buscas. Sem garantia de posição.', 'A empresa não aparece no Google, ou aparece com horário, telefone e fotos errados.', `${COMERCIAL}/demonstracao`),
  s('cardapio', 'Cardápio digital no QR', 'pronto', 'O cliente lê o QR na mesa, vê o cardápio com fotos, faz o pedido e paga a conta pelo Pix. Tem também reservas e fila de espera.', 'Demora para pedir e para pagar a conta na mesa, e os garçons não dão conta.', `${PAINEL}/cardapio-exemplo`),
  s('delivery', 'Delivery próprio com Pix', 'pronto', 'Pedidos pelo site da própria loja, com entrega ou retirada, taxa por bairro, Pix e cupom. A loja aceita na tela e o cliente acompanha o pedido.', 'A loja paga comissão alta aos aplicativos de entrega e não fica com o contato de quem pede.'),
  s('prato-3d', 'Prato em 3D no tamanho real', 'teste', 'No cardápio da mesa, o cliente gira o prato em 3D e pode ver pela câmera, em cima da mesa, do tamanho de verdade. Falta escanear um prato real.', 'O cliente não sabe o tamanho do prato e fica em dúvida na hora de pedir.', `${PAINEL}/cardapio-exemplo`),
  s('atendente-ia', 'Atendente de IA no WhatsApp', 'falta-ligar', 'Atende no WhatsApp oficial do cliente: responde, monta pedido ou orçamento e agenda. Se não souber, passa para alguém da equipe. Falta ligar o WhatsApp de cada cliente.', 'Demora para responder no WhatsApp, e a mensagem que chega fora do horário fica sem resposta.'),
  s('ligacao', 'Ligação perdida vira WhatsApp', 'falta-ligar', 'Quem liga e não é atendido aperta 1 e recebe uma mensagem no WhatsApp logo em seguida; a equipe ganha a tarefa de retornar. Falta ligar o serviço de telefonia.', 'O cliente liga, ninguém atende e ninguém retorna a ligação perdida.', `${COMERCIAL}/demonstracao`),
  s('retomada', 'Retomada de quem sumiu', 'pronto', 'Quando o cliente recebe o orçamento e não responde, sai uma mensagem de retomada e, depois, a equipe recebe uma tarefa. Só para quem autorizou mensagens.', 'O cliente pede orçamento, some, e ninguém lembra de chamar de novo.', `${COMERCIAL}/demonstracao`),
  s('avaliacoes', 'Avaliações no Google', 'pronto', 'Depois do serviço, o cliente recebe o convite para avaliar no Google. Todo mundo recebe o mesmo convite, sem filtro de nota.', 'Poucas avaliações no Google, ou só avaliações antigas.', `${COMERCIAL}/demonstracao`),
  s('crm-torpedo', 'App de clientes: CRM e Torpedo', 'pronto', 'A loja vê seus clientes, quem sumiu e quanto cada um gastou, e prepara com a IA a mensagem para trazer de volta quem parou de comprar.', 'Cliente para de comprar e a loja nem percebe; ninguém sabe quem são os melhores clientes.', `${PAINEL}/demo/fish-burguer`),
  s('paineis', 'Painéis de organização', 'pronto', 'Painel do dono com vendas, preços e custos de cada prato, mesas e relatório do mês, para decidir com números.', 'O dono não sabe quanto lucra em cada produto nem quanto vendeu no mês.'),
  s('link-bio', 'Link na bio com perguntas', 'ideia', 'No link da bio, o cliente responde 2 ou 3 perguntas e recebe a indicação do produto certo da empresa, com botão para pedir no WhatsApp.', 'O seguidor não sabe o que escolher e desiste antes de pedir.'),
  ...SERVICOS_ADICIONADOS_LISTA(),
];

const PROBLEMA_PADRAO = new Map(SERVICOS_INICIAIS.map((x) => [x.id, x.problema ?? '']));
/** The problem a card solves: what the team wrote, or our default for a card saved before the field existed. */
export const problemaDe = (x: Servico): string => x.problema ?? PROBLEMA_PADRAO.get(x.id) ?? '';

const FOTO_ENVIADA = new RegExp(`^midia/${PASTA_FOTOS}/[a-z0-9]{6,40}\\.(jpg|png|webp|avif)$`);

/** A picture the card may show: one of the defaults or an upload to the services folder. */
export const imagemValida = (v: string) => v === '' || /^\/servicos\/[a-z0-9-]{1,40}\.webp$/.test(v) || FOTO_ENVIADA.test(v);
/** Where the browser loads the picture from. */
export const srcImagem = (v: string) => (v.startsWith('midia/') ? `/api/midia/${v.slice('midia/'.length)}` : v);

/** A demonstration link: https only (never javascript: or a data URL). */
export function demoValida(v: string): boolean {
  if (v === '') return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && v.length <= 300;
  } catch {
    return false;
  }
}

/** The kind of picture from its first bytes (the browser's type is not trusted). */
export function tipoDaImagem(b: Uint8Array): 'jpg' | 'png' | 'webp' | 'avif' | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  const txt = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));
  if (b.length >= 12 && txt(0, 4) === 'RIFF' && txt(8, 4) === 'WEBP') return 'webp';
  if (b.length >= 12 && txt(4, 4) === 'ftyp' && /^avi[fs]$/.test(txt(8, 4))) return 'avif';
  return null;
}

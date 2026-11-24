/**
 * "Qual é o problema do cliente?": finds the services that solve a problem typed in plain words
 * ("demora pra responder no zap", "muita gente devendo"). Pure and synchronous: it runs in the browser on every keystroke.
 *
 * How: accents and case are ignored, filler words dropped, and each word is compared by its beginning (so
 * "respondido" finds "responder"). Words the client says that the card doesn't (zap, calote, currículo) reach it
 * through small groups of related words. The problem a card solves weighs more than its name, which weighs more than
 * its description.
 */
import { problemaDe, type Servico } from './servicos';

export const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const PARADAS = new Set(
  'a o as os um uma uns umas de do da dos das no na nos nas em e ou pra pro pras pros para por com sem que se ser sua seu suas seus meu minha meus minhas nosso nossa ele ela eles elas eu voce voces gente nao sim muito muita muitos muitas mais menos todo toda todos todas tem ter tenho temos esta estao estou ta tao fica ficam ficar quando como porque pois isso esse essa este esta aqui ai la ja so ate quer querem preciso precisa precisamos tipo coisa coisas cliente clientes empresa empresas dono loja lojas problema problemas meus nunca sempre bem mal hoje dia dias vez vezes consigo consegue conseguimos quero pede pedem pessoal sei sabe sabemos quanto quanta to tao ninguem alguem nada fazer faz fazem dar deu vai vou ia pq oq tudo tanto demais nem algum alguma outro outra ainda depois antes agora ruim ruins acho falta perde perder perdendo perdeu perdi resultado resultados melhorar'.split(' '),
);

/** Groups of words people use for the same thing. A word typed in the search also looks for the others, with less weight. */
const GRUPOS: string[][] = [
  ['responder', 'resposta', 'respondido', 'demora', 'demorado', 'atender', 'atendimento', 'mensagem', 'mensagens', 'horario', 'noite', 'madrugada', 'sabado', 'domingo', 'feriado'],
  ['whatsapp', 'zap', 'zapzap', 'wpp', 'whats'],
  ['instagram', 'insta', 'direct', 'redes', 'social', 'sociais', 'post', 'posts', 'postar', 'publicar', 'conteudo', 'seguidores', 'engajamento', 'facebook', 'tiktok', 'linkedin', 'reels', 'stories', 'seguir', 'segue', 'seguem'],
  ['comentario', 'comentarios', 'comentam', 'comenta', 'comentar'],
  ['anuncio', 'anuncios', 'trafego', 'campanha', 'ads', 'impulsionar', 'impulsionamento', 'criativo', 'criativos', 'gerenciador', 'designer', 'arte'],
  ['google', 'seo', 'busca', 'buscas', 'aparecer', 'aparece', 'encontrar', 'acham', 'maps', 'posicao', 'site'],
  ['avaliacao', 'avaliacoes', 'avaliar', 'estrelas', 'reputacao', 'opiniao', 'satisfacao', 'insatisfeito', 'nps', 'reclamacao', 'reclamacoes', 'feedback'],
  ['cobranca', 'cobrar', 'devendo', 'deve', 'devem', 'divida', 'dividas', 'inadimplente', 'inadimplentes', 'inadimplencia', 'atrasado', 'calote', 'boleto', 'pagamento'],
  ['financeiro', 'financas', 'fluxo', 'extrato', 'banco', 'contas', 'fiscal', 'notas', 'lucro', 'custo', 'custos', 'dinheiro', 'faturamento'],
  ['lead', 'leads', 'contato', 'contatos', 'prospectar', 'prospeccao', 'vender', 'venda', 'vendas', 'vendedor', 'vendedores', 'comercial', 'fechar', 'funil', 'negociacao', 'orcamento'],
  ['qualificar', 'qualificacao', 'perfil', 'curioso', 'curiosos', 'filtrar', 'separar', 'triagem'],
  ['crm', 'organizar', 'organizacao', 'desorganizado', 'bagunca', 'baguncado', 'controle', 'acompanhar', 'planilha', 'kanban'],
  ['rh', 'funcionario', 'funcionarios', 'colaborador', 'colaboradores', 'ponto', 'ferias', 'admissao', 'desligamento', 'demissao', 'folha'],
  ['contratar', 'contratacao', 'vaga', 'vagas', 'curriculo', 'curriculos', 'candidato', 'candidatos', 'recrutar', 'recrutamento', 'recrutador', 'entrevista', 'selecao'],
  ['reuniao', 'reunioes', 'ata', 'combinado', 'combinou', 'esquece', 'esquecem', 'esquecida', 'lembra', 'lembrar', 'lembram'],
  ['tarefa', 'tarefas', 'projeto', 'projetos', 'prazo', 'prazos', 'kanban', 'atualiza'],
  ['cancelar', 'cancelamento', 'cancela', 'cancelam', 'sumiu', 'some', 'somem', 'sumir', 'volta', 'voltar', 'voltam', 'retomada', 'recompra', 'fidelidade', 'fidelizar', 'parou', 'pararam', 'concorrente'],
  ['ligacao', 'ligacoes', 'ligar', 'liga', 'ligam', 'telefone', 'telefonema', 'chamada', 'chamadas'],
  ['proposta', 'propostas', 'contrato', 'contratos', 'assinatura', 'assinar', 'word', 'digitar'],
  ['suporte', 'chamado', 'chamados', 'ticket', 'email', 'reclamacao'],
  ['relatorio', 'dashboard', 'painel', 'numeros', 'indicadores', 'metricas', 'dados', 'planilha'],
  ['cardapio', 'pedido', 'pedidos', 'delivery', 'entrega', 'mesa', 'mesas', 'garcom', 'garcons', 'fila', 'ifood', 'comida', 'restaurante', 'lanchonete', 'hamburgueria', 'prato', 'pratos'],
  ['catalogo', 'produto', 'produtos', 'estoque', 'lojista', 'carrinho', 'preco', 'precos', 'foto', 'fotos', 'roupa', 'roupas'],
  ['blog', 'artigo', 'artigos', 'texto', 'textos', 'pauta', 'escrever'],
];

/** Word endings that don't change the meaning much (plural, verb forms, -ção, -mento...). */
const FINAIS = new Set(
  ' s es r ar er ir do da dos das ido ida idos idas ado ada ados adas ando endo indo ndo am em ou eu iu u m a e o os as ao oes cao coes sao soes mento mentos imento amento anca encia or ores edor edores ador adores ente entes ante antes vel veis ivel iveis ia ias io ios ista istas'.split(' '),
);

/** Same word with a different ending: "respondido" ~ "responder", "anuncios" ~ "anuncio", but "conta" is not "contato". */
function parecido(a: string, b: string): boolean {
  if (a === b) return true;
  const menor = Math.min(a.length, b.length);
  if (menor < 4) return false;
  let k = 0;
  while (k < menor && a[k] === b[k]) k++;
  return k >= 4 && FINAIS.has(a.slice(k)) && FINAIS.has(b.slice(k));
}

export const palavras = (t: string) => normalizar(t).split(/[^a-z0-9]+/).filter((p) => p.length >= 2);
const termos = (t: string) => palavras(t).filter((p) => !PARADAS.has(p));

/** The typed word plus the related words of every group it belongs to. */
function relacionados(p: string): string[] {
  const out = new Set<string>();
  for (const g of GRUPOS) if (g.some((w) => parecido(w, p))) g.forEach((w) => out.add(w));
  out.delete(p);
  return [...out];
}

const PESO = { problema: 3, nome: 2.5, resumo: 1.5 } as const;
type Campo = keyof typeof PESO;
const CAMPOS = Object.keys(PESO) as Campo[];

export interface Achado {
  servico: Servico;
  pontos: number;
}

/** How well one typed word fits one card: its best field, full weight for the word itself, less for related words. */
function encaixe(ws: Record<Campo, string[]>, p: string, rel: string[]): { nota: number; direto: boolean } {
  let direto = 0;
  let campos = 0;
  let relacionado = 0;
  for (const c of CAMPOS) {
    if (ws[c].some((w) => parecido(w, p))) {
      direto = Math.max(direto, PESO[c]);
      campos++;
    } else {
      // related words count more when the card uses several of them ("devendo", "inadimplentes", "atrasado")
      const n = rel.filter((r) => ws[c].some((w) => parecido(w, r))).length;
      if (n > 0) relacionado = Math.max(relacionado, PESO[c] * Math.min(0.8, 0.3 + 0.15 * (n - 1)));
    }
  }
  // the word in the name and in the problem beats the word in only one of them
  if (campos > 1) direto *= 1 + 0.1 * (campos - 1);
  return direto >= relacionado ? { nota: direto, direto: direto > 0 } : { nota: relacionado, direto: false };
}

/**
 * Cards that solve the typed problem, best first (ties keep the list order). Empty search: nothing.
 * A word found on almost every card ("WhatsApp", "IA") counts less than a rare one ("devendo"), and weak matches far
 * below the best are left out, so a long sentence doesn't bring the whole list.
 */
export function buscarServicos(lista: Servico[], texto: string): Achado[] {
  const busca = termos(texto).map((p) => ({ p, rel: relacionados(p) }));
  if (busca.length === 0 || lista.length === 0) return [];
  const cartas = lista.map((servico) => ({
    servico,
    ws: { problema: palavras(problemaDe(servico)), nome: palavras(servico.nome), resumo: palavras(servico.resumo) },
  }));
  const N = cartas.length;
  const total = new Array<number>(N).fill(0);
  const achou = new Array<number>(N).fill(0);
  for (const { p, rel } of busca) {
    const notas = cartas.map((c) => encaixe(c.ws, p, rel));
    // rarity: the typed word itself counts by how many cards use it; related words, by how many cards they reach
    const direto = notas.filter((x) => x.direto).length;
    const algum = notas.filter((x) => x.nota > 0).length;
    if (algum === 0) continue;
    const raro = (df: number) => Math.log(1 + N / df) / Math.log(1 + N);
    const fator = { direto: 0.35 + 0.65 * raro(Math.max(1, direto)), relacionado: 0.35 + 0.65 * raro(algum) };
    notas.forEach((x, i) => {
      if (x.nota > 0) {
        total[i] += x.nota * (x.direto ? fator.direto : fator.relacionado);
        achou[i]++;
      }
    });
  }
  // a card that covers more of the typed words beats one that matches a single word strongly
  const achados = cartas
    .map((c, i) => ({ servico: c.servico, i, pontos: total[i] * (busca.length > 1 ? 0.5 + (0.5 * achou[i]) / busca.length : 1) }))
    .filter((a) => a.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.i - b.i);
  const corte = Math.max(0.8, (achados[0]?.pontos ?? 0) * 0.5);
  return achados.filter((a) => a.pontos >= corte).map(({ servico, pontos }) => ({ servico, pontos: Math.round(pontos * 100) / 100 }));
}

/** Examples under the search box: problems clients really bring, one click to try. */
export const EXEMPLOS_PROBLEMA = [
  'Demora para responder no WhatsApp',
  'Cliente pede orçamento e some',
  'Muita gente devendo',
  'Não aparece no Google',
  'Ninguém tem tempo de postar',
  'Difícil contratar',
  'Reunião sem combinado',
  'Financeiro bagunçado',
];

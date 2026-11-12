import type { AdaptadorIA, Executar, PedidoIA, RespostaIA } from './tipos';

const limpo = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const palavras = (s: string) => new Set(limpo(s).split(/[^a-z0-9]+/).filter((p) => p.length > 3).map((p) => p.slice(0, 6)));

/**
 * Rule-based stand-in for the language model, used when there is no API key.
 * It follows the same contract (approved content only, one question at a time, hand-off rules)
 * so the whole flow can be demonstrated and tested. Its answers are marked as simulated on screen.
 */
export const iaSimulada: AdaptadorIA = {
  simulada: true,
  async responder(p: PedidoIA, executar: Executar): Promise<RespostaIA> {
    const c = p.contexto;
    const k = c.conhecimento;
    const ultima = [...p.historico].reverse().find((m) => m.de === 'contato')?.texto ?? '';
    const anterior = [...p.historico].reverse().find((m) => m.de === 'assistente')?.texto ?? '';
    const t = limpo(ultima);
    const primeira = !p.historico.some((m) => m.de === 'assistente');
    const ola = primeira ? `Olá! Sou ${/assistente virtual/i.test(c.assistente) ? 'a' : `${c.assistente}, a`} assistente virtual da ${c.empresa}. ` : '';
    const fim = (texto: string): RespostaIA => ({ texto: (ola + texto).trim(), tokensEntrada: 0, tokensSaida: 0, modelo: 'simulador' });
    let faltando = [...c.faltando];

    if (/(ignor|desconsider|esquec).{0,30}(instruc|regra|orient)|prompt|senha|token|chave de api|api key|outra empresa|outros clientes|system/.test(t)) {
      return fim(`Só consigo ajudar com informações sobre os serviços da ${c.empresa}. Como posso ajudar no seu orçamento?`);
    }
    if (/(atendente|humano|uma pessoa|pessoa de verdade|vendedor|alguem da equipe|falar com alguem)/.test(t)) {
      await executar('encaminhar_para_pessoa', { motivo: 'pedido_do_cliente', resumo: resumo(p) });
      return fim('Claro. Já avisei a equipe e uma pessoa vai continuar este atendimento.');
    }
    if (/(reclam|insatisf|absurdo|procon|pessimo|horrivel)/.test(t)) {
      await executar('encaminhar_para_pessoa', { motivo: 'reclamacao', resumo: resumo(p) });
      return fim('Sinto muito por isso. Vou passar sua mensagem para uma pessoa da equipe agora.');
    }
    if (/(desconto|negoci|baixar o preco|melhor preco|parcel|financi|abat)/.test(t)) {
      await executar('encaminhar_para_pessoa', { motivo: 'negociacao', resumo: resumo(p) });
      return fim('Condições e negociação são com a equipe. Já chamei uma pessoa para falar com você.');
    }

    // Was the previous message one of our questions? Then this is the answer to it.
    const perguntado = faltando.find((f) => anterior.includes(f.pergunta));
    const pareceDuvida = /\?/.test(ultima) || /^(qual|quais|quanto|como|onde|quando|voces|vcs|tem |fazem|atendem|trabalham)/.test(t);
    const dados: Record<string, unknown> = {};
    // The phone is captured by the server before this runs; if it is still missing, the number could not be read.
    if (perguntado?.id === 'telefone' && !pareceDuvida) return fim(`Não consegui ler o telefone. ${perguntado.pergunta}`);
    if (perguntado && !pareceDuvida && ultima.trim()) {
      if (['nome', 'cidade', 'necessidade'].includes(perguntado.id)) dados[perguntado.id] = ultima.trim();
      else dados.extras = { [perguntado.id]: ultima.trim() };
    }
    if (Object.keys(dados).length) {
      const r = await executar('salvar_dados', dados);
      if (r.startsWith('ok')) faltando = faltando.filter((f) => !(f.id in dados) && !(f.id in ((dados.extras as object) ?? {})));
      else if (perguntado) return fim(`${r.replace(/^erro: /, '')} ${perguntado.pergunta}`);
    }

    let resposta = '';
    if (/(visita|vistoria|agendar|reuniao|ir ate)/.test(t)) {
      await executar('registrar_interesse_visita', { preferencia: ultima.trim().slice(0, 200) });
      resposta = 'Anotei seu interesse em uma visita. A equipe confirma o dia e o horário com você. ';
    } else if (pareceDuvida) {
      const achou = responderDuvida(t, ultima, k);
      if (!achou) {
        await executar('encaminhar_para_pessoa', { motivo: 'fora_da_base', resumo: resumo(p) });
        return fim('Essa eu não sei responder com certeza. Já pedi para uma pessoa da equipe confirmar e falar com você.');
      }
      resposta = `${achou} `;
    }

    const proxima = faltando[0];
    if (proxima) return fim(resposta + proxima.pergunta);
    if (resposta) return fim(resposta.trim());
    return fim(anterior.includes('preparar seu orçamento') ? 'Combinado! Qualquer dúvida, é só escrever.' : 'Obrigado! Já tenho o que preciso para a equipe preparar seu orçamento. Uma pessoa vai falar com você em breve.');
  },
};

function responderDuvida(t: string, original: string, k: PedidoIA['contexto']['conhecimento']): string | null {
  // Approved FAQ first: the question with the most words in common wins, if it is close enough.
  const alvo = palavras(original);
  let melhor: { nota: number; resposta: string } | null = null;
  for (const f of k.faq) {
    const pf = palavras(f.pergunta);
    const comuns = [...pf].filter((w) => alvo.has(w)).length;
    const nota = comuns / Math.max(1, Math.min(pf.size, alvo.size));
    if (comuns >= 1 && nota >= 0.5 && (!melhor || nota > melhor.nota)) melhor = { nota, resposta: f.resposta };
  }
  if (melhor) return melhor.resposta;
  if (/(preco|valor|custa|quanto fica|quanto sai|orcamento)/.test(t)) {
    return k.precos_autorizados ? `${k.precos_autorizados} O valor final é confirmado no orçamento.` : 'Não tenho valores por aqui: o orçamento é feito pela equipe depois de entender o seu caso.';
  }
  if (/(horario|funciona|aberto|abre|fecha|atendimento)/.test(t) && k.horarios) return k.horarios;
  if (/(atende|regiao|cidade|bairro|area)/.test(t) && k.regioes) return k.regioes;
  if (/(servico|fazem|trabalham|instala|oferecem)/.test(t) && k.servicos) return k.servicos;
  return null;
}

function resumo(p: PedidoIA): string {
  const dados = Object.entries(p.contexto.coletado).map(([k, v]) => `${k}: ${v}`).join('; ');
  const falas = p.historico.filter((m) => m.de === 'contato').slice(-3).map((m) => `"${m.texto.slice(0, 140)}"`).join(' ');
  return `${dados ? `Dados informados: ${dados}. ` : ''}Últimas mensagens do cliente: ${falas}`.slice(0, 800);
}

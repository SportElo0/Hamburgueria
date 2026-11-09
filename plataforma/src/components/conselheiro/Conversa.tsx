'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { NOME_ORIGEM } from '@/lib/conselheiro/modelo';
import type { Mensagem } from '@/lib/conselheiro/ia';
import type { Cartao } from '@/lib/conselheiro/ferramentas';
import { perguntarAction, salvarCartaoAction } from '@/app/loja/[slug]/dono/conselheiro/actions';

const SUGESTOES = [
  'Posso subir o preço do meu lanche mais vendido?',
  'Se eu der 15% de desconto num item, quanto preciso vender a mais?',
  'Um combo de lanche + batata + refri compensa?',
  'Quais itens vendem muito e deixam pouco?',
  'Quais dados estão faltando para você me ajudar melhor?',
];

function CartaoView({ c, slug, conversaId, mensagemId, indice }: { c: Cartao; slug: string; conversaId: string; mensagemId: string; indice: number }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();
  const salvar = (comoDecisao: boolean) =>
    start(async () => {
      const r = await salvarCartaoAction(slug, { conversaId, mensagemId, indice, comoDecisao });
      setMsg({ ok: r.ok, texto: r.msg });
    });
  const base = `/loja/${slug}/dono/conselheiro`;
  return (
    <div className="rounded-lg border border-line bg-white p-3 text-sm">
      {c.tipo === 'simulacao' && (
        <>
          <p className="font-bold">Cálculo: {c.titulo}</p>
          <ul className="mt-1 space-y-0.5">{c.resumo.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {c.faltando.length > 0 && <p className="mt-1 text-warn">Falta: {c.faltando.join(', ')}</p>}
          <details className="mt-1 text-xs text-ink-mute">
            <summary className="cursor-pointer">De onde vieram os dados</summary>
            <ul>{c.fontes.map((f, i) => <li key={i}>{f.rotulo}: {f.origem === 'hipotese' ? 'hipótese' : NOME_ORIGEM[f.origem]}{f.data ? `, ${f.data.split('-').reverse().join('/')}` : ''}</li>)}</ul>
          </details>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => salvar(false)}>Salvar simulação</button>
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => salvar(true)}>Salvar e criar decisão</button>
            {c.simulacao.tipo !== 'combo' && (
              <Link className="btn-ghost" href={`${base}/simulador?aba=${c.simulacao.tipo}${typeof (c.simulacao.entrada as { produtoId?: string }).produtoId === 'string' ? `&produto=${(c.simulacao.entrada as { produtoId: string }).produtoId}&canal=${(c.simulacao.entrada as { canalId: string }).canalId}` : ''}`}>
                Abrir no simulador
              </Link>
            )}
          </div>
        </>
      )}
      {c.tipo === 'dados' && (
        <>
          <p className="font-bold">Consulta: {c.titulo}</p>
          <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">{c.linhas.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </>
      )}
      {c.tipo === 'lacuna' && (
        <>
          <p className="font-bold text-warn">{c.titulo}</p>
          <ul className="mt-1 list-disc pl-5">{c.itens.map((l) => <li key={l}>{l}</li>)}</ul>
          <Link className="btn-ghost mt-2" href={`${base}/produtos`}>Completar os dados</Link>
        </>
      )}
      {c.tipo === 'recomendacao' && (
        <>
          <p className="font-bold">Rascunho de recomendação: {c.rascunho.titulo}</p>
          <p className="mt-1 whitespace-pre-line">{c.rascunho.recomendacao}</p>
          {c.rascunho.riscos.length > 0 && <p className="mt-1 text-ink-soft">Riscos: {c.rascunho.riscos.join('; ')}</p>}
          {c.rascunho.proximoPasso && <p className="mt-1 text-ink-soft">Próximo passo: {c.rascunho.proximoPasso}</p>}
          <p className="mt-1 text-xs text-ink-mute">Ainda não foi salvo. Confira antes.</p>
          <button type="button" className="btn-primary mt-2" disabled={pending} onClick={() => salvar(true)}>Salvar em Decisões</button>
        </>
      )}
      {msg && <p role="status" className={`mt-2 font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.texto}</p>}
    </div>
  );
}

export function Conversa({ slug, ligada, conversaId: inicialId, mensagens: inicial, perguntaInicial }: { slug: string; ligada: boolean; conversaId: string | null; mensagens: Mensagem[]; perguntaInicial: string }) {
  const [conversaId, setConversaId] = useState(inicialId);
  const [mensagens, setMensagens] = useState(inicial);
  const [texto, setTexto] = useState(perguntaInicial);
  const [erro, setErro] = useState('');
  const [pending, start] = useTransition();

  const enviar = (pergunta: string) =>
    start(async () => {
      setErro('');
      const r = await perguntarAction(slug, { conversaId, pergunta });
      if (r.estado === 'ok') {
        setConversaId(r.conversaId);
        setMensagens((m) => [...m, { id: `local-${m.length}`, papel: 'dono', texto: pergunta, cartoes: [], metodo: null, versao: '', avisos: [], ferramentas: [], em: new Date().toISOString(), por: '' }, r.mensagem]);
        setTexto('');
        window.history.replaceState(null, '', `?c=${r.conversaId}`);
      } else if (r.estado === 'configuracao-pendente') setErro('O Conselheiro ainda não está ligado para esta loja (configuração pendente na Growlift). Os simuladores funcionam normalmente.');
      else if (r.estado === 'limite') setErro(`Limite de ${r.limite} perguntas do mês atingido. Os simuladores continuam funcionando; o limite volta no mês que vem.`);
      else setErro(r.erro);
    });

  return (
    <div className="space-y-4">
      {!ligada && (
        <p className="rounded-lg bg-warn/10 px-4 py-3 text-sm text-warn">
          <strong>Configuração pendente:</strong> a conversa com IA ainda não foi ligada para esta loja. Enquanto isso, use o Simulador, Produtos e custos e Testes: as contas são as mesmas que o Conselheiro usa.
        </p>
      )}
      {mensagens.length === 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-soft">Comece com uma dúvida real:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button key={s} type="button" className="btn-ghost" onClick={() => setTexto(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}
      <ol className="space-y-4">
        {mensagens.map((m) => (
          <li key={m.id} className={m.papel === 'dono' ? 'ml-auto max-w-2xl rounded-xl bg-accent px-4 py-3 text-white' : 'max-w-3xl space-y-2 rounded-xl border border-line bg-card px-4 py-3'}>
            <p className="text-sm whitespace-pre-line">{m.texto}</p>
            {m.avisos.map((a) => <p key={a} className="rounded-lg bg-warn/10 px-3 py-2 text-xs font-semibold text-warn">{a}</p>)}
            {m.cartoes.map((c, i) => conversaId && <CartaoView key={i} c={c} slug={slug} conversaId={conversaId} mensagemId={m.id} indice={i} />)}
            {m.papel === 'conselheiro' && <p className="text-[11px] text-ink-mute">Regras {m.versao}{m.ferramentas.length ? ` · consultas: ${m.ferramentas.map((f) => f.nome.replace(/_/g, ' ')).join(', ')}` : ''}</p>}
          </li>
        ))}
      </ol>
      {pending && <p className="text-sm text-ink-mute">O Conselheiro está consultando os dados…</p>}
      {erro && <p role="alert" className="text-sm font-semibold text-bad">{erro}</p>}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim()) enviar(texto.trim());
        }}
      >
        <label htmlFor="pergunta" className="sr-only">Sua pergunta</label>
        <textarea id="pergunta" className="field min-h-14 flex-1" maxLength={1500} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: posso subir o X-Bacon para R$ 38 no app?" />
        <button type="submit" className="btn-primary sm:self-end" disabled={pending || !texto.trim()}>Perguntar</button>
      </form>
      <p className="text-xs text-ink-mute">O Conselheiro consulta só os dados desta loja, faz as contas pelo painel e não muda nada sozinho. Contribuição não é lucro; volumes simulados são hipóteses.</p>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { salvarConhecimentoAcao } from '@/app/acoes';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { conhecimentoAtual } from '@/server/conhecimento';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Conhecimento' };

function Texto({ id, rotulo, ajuda, valor, linhas = 3 }: { id: string; rotulo: string; ajuda?: string; valor: string; linhas?: number }) {
  return (
    <div>
      <label className="rotulo" htmlFor={id}>{rotulo}</label>
      {ajuda && <p id={`${id}-ajuda`} className="-mt-1 mb-1.5 text-sm text-suave">{ajuda}</p>}
      <textarea className="campo" id={id} name={id} rows={linhas} defaultValue={valor} aria-describedby={ajuda ? `${id}-ajuda` : undefined} />
    </div>
  );
}

export default async function ConhecimentoPagina() {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel');
  const k = await conhecimentoAtual(ctx.empresaId);
  const faq = [...k.dados.faq, ...Array.from({ length: 3 }, () => ({ pergunta: '', resposta: '' }))];
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Conhecimento da empresa</h1>
        <p className="text-[15px] text-suave">A assistente só responde com o que estiver aprovado aqui. O que não estiver escrito, ela diz que vai confirmar e chama uma pessoa. Versão atual: {k.versao} ({dataHora(k.criado_em)}).</p>
      </div>
      <Formulario acao={salvarConhecimentoAcao} className="cartao space-y-5 p-4">
        <Texto id="descricao" rotulo="Descrição da empresa" valor={k.dados.descricao} />
        <Texto id="servicos" rotulo="Serviços" valor={k.dados.servicos} linhas={4} />
        <Texto id="horarios" rotulo="Horários de atendimento" valor={k.dados.horarios} linhas={2} />
        <Texto id="regioes" rotulo="Regiões atendidas" valor={k.dados.regioes} linhas={2} />
        <fieldset>
          <legend className="rotulo">Perguntas frequentes</legend>
          <p className="mb-2 text-sm text-suave">Elas também aparecem no site. Para remover uma, apague a pergunta e a resposta.</p>
          <div className="space-y-3">
            {faq.map((f, i) => (
              <div key={i} className="rounded-lg border border-linha p-3">
                <label className="rotulo" htmlFor={`p${i}`}>Pergunta {i + 1}</label>
                <input className="campo" id={`p${i}`} name="pergunta" defaultValue={f.pergunta} />
                <label className="rotulo mt-2" htmlFor={`r${i}`}>Resposta</label>
                <textarea className="campo" id={`r${i}`} name="resposta" rows={2} defaultValue={f.resposta} />
              </div>
            ))}
          </div>
        </fieldset>
        <Texto id="precos_autorizados" rotulo="Preços autorizados" ajuda="Só o que estiver aqui pode ser dito como valor, com as condições escritas. Em branco, a assistente não informa preço." valor={k.dados.precos_autorizados} />
        <Texto id="regras_comerciais" rotulo="Regras comerciais" ajuda="Formas de pagamento, garantias e prazos que podem ser informados. Não escreva promessas que a empresa não cumpre." valor={k.dados.regras_comerciais} />
        <Texto id="criterios_encaminhamento" rotulo="Quando chamar uma pessoa" ajuda="Além dos casos fixos (o cliente pede, negociação, reclamação, dúvida fora deste conteúdo)." valor={k.dados.criterios_encaminhamento} linhas={2} />
        <Enviar>Salvar nova versão</Enviar>
      </Formulario>
    </div>
  );
}

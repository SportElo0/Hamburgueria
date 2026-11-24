import { ativarEmpresaAcao, criarEmpresaAcao, entrarEmpresaAcao, sair, testarAssistenteAcao } from '@/app/acoes';
import { TestarAssistente } from '@/componentes/testar-assistente';
import { modeloPadrao } from '@/server/ia';
import { Marca } from '@/componentes/acesso';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { SEGMENTOS, ambiente } from '@/server/config';
import { MODELOS } from '@/server/modelos';
import { q } from '@/server/db';
import { emailLigado } from '@/server/email';
import { painelPlataforma } from '@/server/empresas';
import { exigirPlataforma } from '@/server/sessao';

export const metadata = { title: 'Administração Growlift' };

export default async function Admin() {
  const s = await exigirPlataforma();
  const [empresas, emails, acessos] = await Promise.all([
    painelPlataforma(s.userId),
    q<{ para: string; assunto: string; corpo: string; criado_em: Date }>('select para, assunto, corpo, criado_em from emails_simulados order by criado_em desc limit 15'),
    q<{ nome: string; empresa: string; motivo: string; inicio: Date }>('select u.name as nome, e.nome as empresa, a.motivo, a.inicio from acessos_admin a join "user" u on u.id = a.user_id join empresas e on e.id = a.empresa_id order by a.inicio desc limit 15'),
  ]);
  return (
    <div className="min-h-dvh">
      <header className="border-b border-linha bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="flex min-w-0 items-center gap-3"><Marca className="shrink-0" /><span className="hidden border-l border-linha pl-3 font-semibold text-tinta sm:inline">Administração Growlift</span></span>
          <form action={sair}><button className="botao-2 min-h-9 px-3 py-1 text-sm">Sair</button></form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <p className="text-sm font-semibold text-suave sm:hidden">Administração Growlift</p>
        <h1 className="text-2xl font-bold">Empresas</h1>
        <p className="text-[15px] text-suave">Aqui aparecem só o cadastro e a saúde das integrações. Para ver contatos e conversas de uma empresa é preciso entrar nela com um motivo, que fica registrado no histórico dela.</p>
        {empresas.length === 0 ? <p className="cartao p-6 text-center text-suave">Nenhuma empresa cadastrada.</p> : (
          <ul className="space-y-3">
            {empresas.map((e) => (
              <li key={e.id} className="cartao p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{e.nome} {e.demonstracao && <span className="etiqueta etiqueta-alerta ml-1">demonstração</span>} {!e.ativa && <span className="etiqueta etiqueta-erro ml-1">suspensa</span>}</h2>
                    <p className="text-sm text-suave">/s/{e.slug} · {SEGMENTOS[e.segmento]?.nome ?? e.segmento} · {e.membros} pessoa(s)</p>
                  </div>
                  <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <div><dt className="text-suave">WhatsApp</dt><dd className="font-semibold text-tinta">{e.whatsapp === 'oficial' ? 'Oficial' : 'Simulador'}</dd></div>
                    <div><dt className="text-suave">Mensagens com falha (7 dias)</dt><dd className={`font-semibold ${e.mensagens_falhas ? 'text-erro' : 'text-tinta'}`}>{e.mensagens_falhas}</dd></div>
                    <div><dt className="text-suave">Trabalhos com falha / incertos</dt><dd className={`font-semibold ${e.trabalhos_falhos + e.trabalhos_incertos ? 'text-erro' : 'text-tinta'}`}>{e.trabalhos_falhos} / {e.trabalhos_incertos}</dd></div>
                    <div><dt className="text-suave">Assistente no mês</dt><dd className="font-semibold text-tinta">{e.ia_respostas_mes} respostas · {e.ia_falhas_mes} falhas</dd></div>
                  </dl>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-linha pt-3">
                  <Formulario acao={entrarEmpresaAcao} className="flex min-w-64 flex-1 flex-wrap items-end gap-2">
                    <input type="hidden" name="empresa" value={e.id} />
                    <div className="min-w-48 flex-1"><label className="rotulo" htmlFor={`m-${e.id}`}>Motivo para entrar nos dados</label><input className="campo" id={`m-${e.id}`} name="motivo" required minLength={5} placeholder="Ex.: suporte pedido pelo cliente" /></div>
                    <Enviar secundario>Entrar por 1 hora</Enviar>
                  </Formulario>
                  <Formulario acao={ativarEmpresaAcao}>
                    <input type="hidden" name="empresa" value={e.id} /><input type="hidden" name="ativa" value={e.ativa ? 'nao' : 'sim'} />
                    <Enviar secundario>{e.ativa ? 'Suspender' : 'Reativar'}</Enviar>
                  </Formulario>
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="cartao p-4" aria-labelledby="t-nova">
          <h2 id="t-nova" className="font-bold">Cadastrar empresa pelo modelo</h2>
          <p className="mt-1 text-sm text-suave">Escolha o modelo do tipo de negócio e preencha o que o dono passou. A empresa já nasce com o formulário, as regras, o site, o conteúdo da assistente e as automações ligadas. O que ficar em branco continua em branco: a assistente passa essas perguntas para a equipe, nada é inventado.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.values(MODELOS).map((m) => <li key={m.id} className="rounded-lg border border-linha p-3 text-sm"><strong className="text-tinta">{m.nome}</strong><span className="mt-1 block text-suave">{m.resumo}</span></li>)}
          </ul>
          <Formulario acao={criarEmpresaAcao} limpar className="mt-4 space-y-4">
            <fieldset className="grid gap-3 sm:grid-cols-3">
              <legend className="mb-2 text-sm font-semibold text-tinta">1. A empresa</legend>
              <div><label className="rotulo" htmlFor="segmento">Modelo</label><select className="campo" id="segmento" name="segmento" defaultValue="pousada">{Object.values(MODELOS).map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></div>
              <div><label className="rotulo" htmlFor="nome">Nome</label><input className="campo" id="nome" name="nome" required minLength={2} maxLength={80} /></div>
              <div><label className="rotulo" htmlFor="slug">Endereço do site (/s/…)</label><input className="campo" id="slug" name="slug" required pattern="[a-z0-9-]{3,40}" placeholder="pousada-exemplo" /></div>
              <div><label className="rotulo" htmlFor="whatsapp">WhatsApp da empresa</label><input className="campo" id="whatsapp" name="whatsapp" inputMode="tel" maxLength={20} placeholder="(12) 99999-0000" /></div>
              <div><label className="rotulo" htmlFor="email">E-mail da empresa</label><input className="campo" id="email" name="email" type="email" maxLength={120} /></div>
              <div><label className="rotulo" htmlFor="cidade">Cidade / região que atende</label><input className="campo" id="cidade" name="cidade" maxLength={120} placeholder="Juquehy, São Sebastião" /></div>
              <div className="sm:col-span-2"><label className="rotulo" htmlFor="endereco">Endereço (opcional)</label><input className="campo" id="endereco" name="endereco" maxLength={200} /></div>
              <div><label className="rotulo" htmlFor="email_dono">E-mail do dono (recebe o convite)</label><input className="campo" id="email_dono" name="email_dono" type="email" maxLength={120} /></div>
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-semibold text-tinta">2. O que a assistente pode dizer (só o que o dono confirmou)</legend>
              <div className="sm:col-span-2"><label className="rotulo" htmlFor="descricao">Descrição curta</label><textarea className="campo min-h-20" id="descricao" name="descricao" maxLength={600} placeholder="Ex.: Pousada a 100 m da praia, com café da manhã e piscina." /></div>
              <div><label className="rotulo" htmlFor="servicos">Serviços ou acomodações (um por linha: Nome — detalhe)</label><textarea className="campo min-h-28" id="servicos" name="servicos" maxLength={2000} placeholder={'Suíte casal — vista para o jardim\nChalé família — até 4 pessoas'} /></div>
              <div><label className="rotulo" htmlFor="precos">Preços que a assistente pode informar (opcional, um por linha)</label><textarea className="campo min-h-28" id="precos" name="precos" maxLength={2000} placeholder="Deixe em branco para a equipe sempre passar os valores." /></div>
              <div className="sm:col-span-2"><label className="rotulo" htmlFor="perguntas">Perguntas frequentes (uma por linha: pergunta | resposta)</label><textarea className="campo min-h-24" id="perguntas" name="perguntas" maxLength={4000} placeholder={'Que horas é o check-in? | A partir das 14h.\nAceita pet? | Sim, pets pequenos, com aviso antes.'} /></div>
              <div className="sm:col-span-2"><label className="rotulo" htmlFor="horarios">Horários (texto para a assistente)</label><input className="campo" id="horarios" name="horarios" maxLength={300} placeholder="Recepção todos os dias, das 8h às 22h." /></div>
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-4">
              <legend className="mb-2 text-sm font-semibold text-tinta">3. Atendimento e avaliações</legend>
              <div><label className="rotulo" htmlFor="hora_inicio">Atende a partir de</label><select className="campo" id="hora_inicio" name="hora_inicio" defaultValue=""><option value="">Padrão do modelo</option>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h</option>)}</select></div>
              <div><label className="rotulo" htmlFor="hora_fim">Até</label><select className="campo" id="hora_fim" name="hora_fim" defaultValue=""><option value="">Padrão do modelo</option>{Array.from({ length: 24 }, (_, h) => <option key={h + 1} value={h + 1}>{h + 1}h</option>)}</select></div>
              <div><label className="rotulo" htmlFor="assistente">Nome da assistente</label><input className="campo" id="assistente" name="assistente" maxLength={40} placeholder="Ana" /></div>
              <div><label className="rotulo" htmlFor="link_avaliacao">Link de avaliação do Google</label><input className="campo" id="link_avaliacao" name="link_avaliacao" type="url" maxLength={300} placeholder="https://search.google.com/local/writereview?placeid=…" /></div>
            </fieldset>
            <label className="flex min-h-11 items-center gap-2 text-[15px]"><input type="checkbox" name="demonstracao" className="h-5 w-5" /> Empresa de demonstração (dados fictícios)</label>
            <div><Enviar>Cadastrar pelo modelo</Enviar></div>
          </Formulario>
        </section>

        <section className="cartao p-4" aria-labelledby="t-ia">
          <h2 id="t-ia" className="font-bold">Assistente de IA</h2>
          <p className={`aviso mt-2 ${process.env.IA_ANTHROPIC_API_KEY ? 'bg-ok-clara text-ok' : 'bg-alerta-clara text-alerta'}`}>
            {process.env.IA_ANTHROPIC_API_KEY ? 'Chave da IA configurada: as empresas usam o modelo real.' : 'Sem chave da IA neste servidor: as empresas usam o simulador (fora de produção) ou passam direto para a equipe (em produção).'}
          </p>
          <p className="mt-2 text-sm text-suave">O teste conversa com o modelo real em 8 situações (pergunta do conteúdo, preço, desconto, dúvida técnica, visita, tentativa de burlar, “você é robô?”) usando uma empresa fictícia, e mostra o custo. Cada teste custa alguns centavos de dólar.</p>
          <div className="mt-3"><TestarAssistente acao={testarAssistenteAcao} modeloPadrao={modeloPadrao()} /></div>
        </section>

        <section className="cartao p-4" aria-labelledby="t-acessos">
          <h2 id="t-acessos" className="font-bold">Últimos acessos da equipe Growlift a dados de empresas</h2>
          {acessos.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nenhum acesso registrado.</p> : <ul className="mt-2 divide-y divide-linha text-[15px]">{acessos.map((a, i) => <li key={i} className="py-2">{dataHora(a.inicio)} · <strong>{a.nome}</strong> entrou em <strong>{a.empresa}</strong> · motivo: {a.motivo}</li>)}</ul>}
        </section>

        {ambiente() !== 'producao' && (
          <section className="cartao p-4" aria-labelledby="t-emails">
            <h2 id="t-emails" className="font-bold">E-mails simulados</h2>
            <p className="mt-1 text-sm text-suave">{emailLigado() ? 'O envio de e-mail está ligado (Resend): convites e links de senha saem por e-mail. Esta lista guarda só o que foi simulado antes.' : 'Simulação — nenhum e-mail externo enviado. Convites e links de senha aparecem aqui até um serviço de e-mail ser configurado. Esta lista não existe em produção.'}</p>
            {emails.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nenhum.</p> : <ul className="mt-2 divide-y divide-linha text-[15px]">{emails.map((m, i) => <li key={i} className="py-2"><span className="font-semibold text-tinta">{m.assunto}</span> · para {m.para} · {dataHora(m.criado_em)}<span className="block break-all text-sm">{m.corpo}</span></li>)}</ul>}
          </section>
        )}
      </main>
    </div>
  );
}

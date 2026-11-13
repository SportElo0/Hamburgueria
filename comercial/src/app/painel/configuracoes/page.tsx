import { redirect } from 'next/navigation';
import { convidarAcao, gerarChaveTelefoniaAcao, membroAcao, responsavelPadraoAcao, salvarConfigAcao, salvarWhatsAppAcao, simularLigacaoAcao } from '@/app/acoes';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { feedbacks } from '@/server/avaliacoes';
import { FRASE_MENU_LIGACAO, ambiente, formatarTelefone } from '@/server/config';
import { empresaPorId, equipe } from '@/server/empresas';
import { adaptadorIA, modeloPadrao } from '@/server/ia';
import { integracaoWhatsApp } from '@/server/integracoes';
import { telefoniaDa, ultimasLigacoes } from '@/server/ligacoes';
import { quantosVencidos } from '@/server/limpeza';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Configurações' };

const Secao = ({ id, titulo, children, nota }: { id: string; titulo: string; nota?: string; children: React.ReactNode }) => (
  <section id={id} className="cartao scroll-mt-4 p-4" aria-labelledby={`t-${id}`}>
    <h2 id={`t-${id}`} className="text-lg font-bold">{titulo}</h2>
    {nota && <p className="mt-1 text-[15px] text-suave">{nota}</p>}
    <div className="mt-4">{children}</div>
  </section>
);
const Num = ({ id, rotulo, valor, min, max }: { id: string; rotulo: string; valor: number; min: number; max: number }) => (
  <div><label className="rotulo" htmlFor={id}>{rotulo}</label><input className="campo" id={id} name={id} type="number" min={min} max={max} defaultValue={valor} required /></div>
);
const Marcar = ({ id, rotulo, ajuda, marcado }: { id: string; rotulo: string; ajuda?: string; marcado: boolean }) => (
  <label className="flex min-h-11 items-start gap-3 text-[15px]"><input type="checkbox" name={id} defaultChecked={marcado} className="mt-1 h-5 w-5 accent-[#175cd3]" /><span><span className="font-semibold text-tinta">{rotulo}</span>{ajuda && <span className="block text-sm text-suave">{ajuda}</span>}</span></label>
);

export default async function Configuracoes() {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel');
  const [empresa, pessoas, zap, notas, telefonia, ligacoes] = await Promise.all([empresaPorId(ctx.empresaId), equipe(ctx), integracaoWhatsApp(ctx.empresaId), feedbacks(ctx), telefoniaDa(ctx.empresaId), ultimasLigacoes(ctx)]);
  const c = empresa!.config;
  const vencidos = await quantosVencidos(ctx, c.dados.guarda_meses);
  const ia = adaptadorIA();
  const base = process.env.APP_URL ?? '';
  const linhas = (xs: { titulo: string; texto: string }[]) => xs.map((x) => `${x.titulo}${x.texto ? ` | ${x.texto}` : ''}`).join('\n');
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Configurações e integrações</h1>
      <nav aria-label="Seções" className="flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
        {[['equipe', 'Equipe'], ['regras', 'Regras de acompanhamento'], ['agenda', 'Agenda'], ['ia', 'Assistente'], ['whatsapp', 'WhatsApp'], ['ligacoes', 'Ligações não atendidas'], ['avaliacao', 'Avaliações'], ['site', 'Site'], ['integrar', 'Formulário no seu site'], ['dados', 'Dados']].map(([id, n]) => <a key={id} className="underline" href={`#${id}`}>{n}</a>)}
      </nav>

      <Secao id="equipe" titulo="Equipe" nota="Administradores gerenciam equipe, conteúdo e configurações. Vendedores atendem e movimentam oportunidades.">
        <ul className="divide-y divide-linha">
          {pessoas.map((p) => (
            <li key={p.user_id} className="py-2">
              <Formulario acao={membroAcao} className="flex flex-wrap items-center justify-between gap-2">
                <input type="hidden" name="membro" value={p.user_id} />
                <span><span className={`font-semibold ${p.ativo ? 'text-tinta' : 'text-suave line-through'}`}>{p.nome}</span><span className="block text-sm text-suave">{p.email} · {p.papel === 'admin' ? 'administrador' : 'vendedor'}{p.ativo ? '' : ' · desativado'}</span></span>
                <span className="flex gap-2">
                  {p.ativo && <button name="acao" value={p.papel === 'admin' ? 'tornar_vendedor' : 'tornar_admin'} className="botao-2 min-h-9 px-2 py-1 text-sm">{p.papel === 'admin' ? 'Tornar vendedor' : 'Tornar administrador'}</button>}
                  <button name="acao" value={p.ativo ? 'desativar' : 'reativar'} className="botao-2 min-h-9 px-2 py-1 text-sm">{p.ativo ? 'Desativar' : 'Reativar'}</button>
                </span>
              </Formulario>
            </li>
          ))}
        </ul>
        <Formulario acao={convidarAcao} limpar className="mt-4 grid gap-3 border-t border-linha pt-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="email">Convidar por e-mail</label><input className="campo" id="email" name="email" type="email" required /></div>
          <div><label className="rotulo" htmlFor="papel">Perfil</label><select className="campo" id="papel" name="papel"><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select></div>
          <div className="sm:col-span-3"><Enviar secundario>Criar convite</Enviar> <span className="ml-2 text-sm text-suave">O envio de e-mail ainda não está ligado: copie o link que aparece e mande para a pessoa.</span></div>
        </Formulario>
        <Formulario acao={responsavelPadraoAcao} className="mt-4 flex flex-wrap items-end gap-3 border-t border-linha pt-4">
          <div className="min-w-56 flex-1"><label className="rotulo" htmlFor="rp">Quem recebe os pedidos novos</label>
            <select className="campo" id="rp" name="responsavel" defaultValue={empresa!.responsavel_padrao ?? ''}><option value="">Ninguém: ficam na fila (visível aos administradores)</option>{pessoas.filter((p) => p.ativo).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}</select>
          </div>
          <Enviar secundario>Salvar</Enviar>
        </Formulario>
      </Secao>

      <Secao id="regras" titulo="Regras de acompanhamento" nota="Cada regra cria tarefas e alertas internos. Mensagem automática ao cliente só sai com autorização dele, dentro do horário, e nunca depois que uma pessoa assume a conversa.">
        <Formulario acao={salvarConfigAcao} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="secao" value="regras" />
          <Num id="sla_minutos" rotulo="Alerta se o pedido ficar sem atendimento por (minutos)" valor={c.regras.sla_minutos} min={5} max={10080} />
          <Num id="retorno_proposta_dias" rotulo="Tarefa de retorno depois da proposta (dias)" valor={c.regras.retorno_proposta_dias} min={1} max={60} />
          <div className="sm:col-span-2"><Marcar id="retorno_auto_cliente" rotulo="Enviar mensagem de retorno ao cliente depois da proposta" ajuda="Só para quem autorizou o WhatsApp. É cancelada se o cliente responder, pedir para parar, se alguém assumir a conversa ou se a oportunidade sair de “Proposta enviada”." marcado={c.regras.retorno_auto_cliente} /></div>
          <Num id="retorno_auto_horas" rotulo="Primeira mensagem depois de (horas)" valor={c.regras.retorno_auto_horas} min={1} max={720} />
          <Num id="retorno_auto_horas_2" rotulo="Segunda mensagem depois de (horas; 0 = não enviar)" valor={c.regras.retorno_auto_horas_2} min={0} max={1440} />
          <div className="sm:col-span-2"><Marcar id="avaliacao_auto" rotulo="Convidar para avaliar quando o serviço for marcado como concluído" ajuda="O mesmo convite para todos os clientes, sem recompensa." marcado={c.regras.avaliacao_auto} /></div>
          <div className="sm:col-span-2"><Marcar id="manutencao_auto" rotulo="Lembrar o cliente da manutenção depois do serviço" ajuda="Uma mensagem por serviço concluído, só para quem aceitou o texto de autorização que inclui a manutenção. Ligar a regra não manda nada para quem fez o serviço há muito tempo." marcado={c.regras.manutencao_auto} /></div>
          <Num id="manutencao_meses" rotulo="Lembrar depois de (meses)" valor={c.regras.manutencao_meses} min={1} max={36} />
          <div />
          <Num id="escalar_horas" rotulo="Avisar os administradores quando uma tarefa vencer há mais de (horas; 0 = não avisar)" valor={c.regras.escalar_horas} min={0} max={168} />
          <div />
          <div className="sm:col-span-2"><Marcar id="resumo_diario" rotulo="Resumo do dia no painel" ajuda="Cada pessoa recebe um aviso com os pedidos novos, as tarefas de hoje e as vencidas dela; os administradores, os da empresa toda. Se não houver nada, não manda." marcado={c.regras.resumo_diario} /></div>
          <Num id="resumo_hora" rotulo="Hora do resumo" valor={c.regras.resumo_hora} min={0} max={23} />
          <div />
          <div className="sm:col-span-2"><Marcar id="ligacao_auto" rotulo="Responder pelo WhatsApp quem ligou e não foi atendido" ajuda="Sai na hora, também à noite (com o texto de fora do horário), só para celular de quem apertou 1 no menu da ligação ou autorizou no formulário. No máximo uma mensagem por número a cada 24 horas. Sempre cria a tarefa de retornar a ligação." marcado={c.regras.ligacao_auto} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="ligacao_texto">Mensagem dentro do horário</label><textarea className="campo" id="ligacao_texto" name="ligacao_texto" rows={3} maxLength={500} defaultValue={c.regras.ligacao_texto} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="ligacao_texto_fora">Mensagem fora do horário</label><textarea className="campo" id="ligacao_texto_fora" name="ligacao_texto_fora" rows={3} maxLength={500} defaultValue={c.regras.ligacao_texto_fora} /><p className="mt-1 text-sm text-suave">Use {'{{atendente}}'} (nome da assistente), {'{{empresa}}'} e {'{{abertura}}'} (hora em que a empresa abre). O “Para não receber mensagens, responda SAIR.” vai no fim automaticamente. Não escreva que é mensagem automática, não ofereça produto nem promoção, e não prometa horário que a equipe não cumpre. Se já existir modelo aprovado na Meta para esta mensagem, mudar o texto aqui exige mandar o modelo novo para aprovação.</p></div>
          <Num id="hora_inicio" rotulo="Mensagens automáticas a partir das (hora)" valor={c.regras.hora_inicio} min={0} max={23} />
          <Num id="hora_fim" rotulo="Até as (hora)" valor={c.regras.hora_fim} min={1} max={24} />
          <div className="sm:col-span-2"><Enviar>Salvar regras</Enviar></div>
        </Formulario>
      </Secao>

      <Secao id="agenda" titulo="Agenda de visitas" nota="Os horários livres saem destes dias e horários, menos as visitas já marcadas. A assistente oferece só horários livres e cria a tarefa de confirmar o endereço; uma pessoa confirma a visita.">
        <Formulario acao={salvarConfigAcao} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="secao" value="agenda" />
          <div className="sm:col-span-2"><Marcar id="ativa" rotulo="Agenda ligada" marcado={c.agenda.ativa} /></div>
          <fieldset className="sm:col-span-2"><legend className="rotulo">Dias e horários de visita (de que hora a que hora)</legend>
            <div className="divide-y divide-linha rounded-lg border border-linha">
              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((d, i) => {
                const h = c.agenda.por_dia[String(i)] ?? { inicio: c.agenda.hora_inicio, fim: c.agenda.hora_fim };
                return (
                  <div key={d} className="flex items-center gap-2 px-3 py-1.5">
                    <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-[15px]"><input type="checkbox" name="dias" value={i} defaultChecked={c.agenda.dias.includes(i)} className="h-5 w-5 shrink-0 accent-[#175cd3]" />{d}</label>
                    <input className="campo w-16 px-2 text-center" name={`inicio_${i}`} type="number" min={0} max={23} defaultValue={h.inicio} aria-label={`${d}: primeira visita às (hora)`} />
                    <span className="text-sm text-suave">às</span>
                    <input className="campo w-16 px-2 text-center" name={`fim_${i}`} type="number" min={1} max={24} defaultValue={h.fim} aria-label={`${d}: última visita termina até (hora)`} />
                    <span className="text-sm text-suave">h</span>
                  </div>
                );
              })}
            </div>
          </fieldset>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="bloqueios">Dias sem visita (feriados, férias, folgas)</label><textarea className="campo" id="bloqueios" name="bloqueios" rows={3} placeholder={'25/12/2026 Natal\n02/01/2027 a 10/01/2027 Férias'} defaultValue={c.agenda.bloqueios.map((b) => `${b.de.split('-').reverse().join('/')}${b.ate !== b.de ? ` a ${b.ate.split('-').reverse().join('/')}` : ''}${b.motivo ? ` ${b.motivo}` : ''}`).join('\n')} /><p className="mt-1 text-sm text-suave">Um por linha: uma data, ou “data a data”, e se quiser o motivo. A assistente não oferece esses dias.</p></div>
          <Num id="duracao_min" rotulo="Duração de cada visita (minutos)" valor={c.agenda.duracao_min} min={15} max={480} />
          <Num id="capacidade" rotulo="Visitas ao mesmo tempo (pessoas que vão)" valor={c.agenda.capacidade} min={1} max={20} />
          <Num id="antecedencia_horas" rotulo="Antecedência mínima para a assistente marcar (horas)" valor={c.agenda.antecedencia_horas} min={0} max={168} />
          <Num id="janela_dias" rotulo="Oferecer horários até quantos dias à frente" valor={c.agenda.janela_dias} min={1} max={60} />
          <div className="sm:col-span-2"><Marcar id="ia_marca" rotulo="A assistente oferece horários e marca a visita" ajuda="Desligado, ela só anota a preferência do cliente e a equipe combina." marcado={c.agenda.ia_marca} /></div>
          <div className="sm:col-span-2"><Marcar id="lembrete" rotulo="Lembrete pelo WhatsApp um dia antes" ajuda="Depois de marcar pelo WhatsApp, a assistente pergunta se o cliente quer o lembrete; só vai para quem respondeu SIM, pediu à equipe ou autorizou no formulário. É cancelado se a visita for cancelada ou remarcada." marcado={c.agenda.lembrete} /></div>
          <div className="sm:col-span-2"><Enviar>Salvar agenda</Enviar></div>
        </Formulario>
      </Secao>

      <Secao id="ia" titulo="Assistente virtual" nota={ia ? (ia.simulada ? 'Simulação — a assistente está rodando com respostas por regras, sem modelo de IA. Para ligar o modelo real, a equipe Growlift configura a chave da API.' : 'Modelo de IA ligado.') : 'Assistente indisponível neste ambiente: as conversas vão direto para a equipe.'}>
        <Formulario acao={salvarConfigAcao} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="secao" value="ia" />
          <div className="sm:col-span-2"><Marcar id="ativa" rotulo="Assistente ligada" ajuda="Desligada, toda mensagem nova vira tarefa para uma pessoa." marcado={c.ia.ativa} /></div>
          <div><label className="rotulo" htmlFor="nome">Nome da assistente</label><input className="campo" id="nome" name="nome" defaultValue={c.ia.nome} maxLength={40} /></div>
          <div><label className="rotulo" htmlFor="modelo">Modelo (em branco = padrão: {modeloPadrao()})</label><input className="campo" id="modelo" name="modelo" defaultValue={c.ia.modelo} placeholder={modeloPadrao()} /></div>
          <Num id="limite_respostas_mes" rotulo="Limite de respostas por mês" valor={c.ia.limite_respostas_mes} min={0} max={100000} />
          <Num id="max_mensagens_contexto" rotulo="Mensagens da conversa que o modelo lê" valor={c.ia.max_mensagens_contexto} min={4} max={60} />
          <p className="text-sm text-suave sm:col-span-2">Ela se apresenta por esse nome e fala como alguém da equipe, sem dizer que é robô. Se o cliente perguntar a sério, ela não mente: diz que é a assistente da empresa e oferece chamar uma pessoa. Ao atingir o limite, a assistente para e as conversas vão para a equipe, sem perder mensagens. O conteúdo que ela usa fica em “Conhecimento”.</p>
          <div className="sm:col-span-2"><Enviar>Salvar assistente</Enviar></div>
        </Formulario>
      </Secao>

      <Secao id="whatsapp" titulo="WhatsApp" nota="A plataforma usa só a API oficial do WhatsApp Business (Meta), com o número da própria empresa. Sem WhatsApp Web e sem conexões não oficiais.">
        <p className={`aviso mb-4 ${zap.pronta ? 'bg-ok-clara text-ok' : 'bg-alerta-clara text-alerta'}`}>
          {zap.pronta ? 'WhatsApp oficial configurado. A entrega real só é confirmada pelos avisos do WhatsApp em cada mensagem.' : zap.config.modo === 'oficial' ? 'Modo oficial escolhido, mas falta configuração (número, token ou o segredo do aplicativo no servidor). Nada é enviado até completar.' : ambiente() === 'producao' ? 'WhatsApp não configurado: nenhuma mensagem é enviada.' : 'Simulação — nenhuma mensagem externa enviada.'}
        </p>
        <Formulario acao={salvarWhatsAppAcao} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="modo">Modo</label><select className="campo" id="modo" name="modo" defaultValue={zap.config.modo}><option value="simulador">Simulador (nada sai da plataforma)</option><option value="oficial">Oficial (API da Meta)</option></select></div>
          <div><label className="rotulo" htmlFor="phone_number_id">ID do número (Phone number ID)</label><input className="campo" id="phone_number_id" name="phone_number_id" readOnly={!ctx.acessoAdmin} inputMode="numeric" defaultValue={zap.config.phone_number_id} /></div>
          <div><label className="rotulo" htmlFor="waba_id">ID da conta do WhatsApp Business</label><input className="campo" id="waba_id" name="waba_id" readOnly={!ctx.acessoAdmin} inputMode="numeric" defaultValue={zap.config.waba_id} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="token">Token de acesso {zap.token ? `(guardado: ${zap.token})` : '(nenhum guardado)'}</label><input className="campo" id="token" name="token" readOnly={!ctx.acessoAdmin} type="password" autoComplete="off" placeholder={zap.token ? 'Deixe em branco para manter o atual' : ''} /><p className="mt-1 text-sm text-suave">Fica cifrado no servidor e nunca é mostrado de novo. Número e token são configurados pela equipe Growlift.</p></div>
          <div><label className="rotulo" htmlFor="modelo_confirmacao">Modelo aprovado: confirmação do pedido</label><input className="campo" id="modelo_confirmacao" name="modelo_confirmacao" defaultValue={zap.config.modelo_confirmacao} /></div>
          <div><label className="rotulo" htmlFor="modelo_retorno">Modelo aprovado: retorno da proposta</label><input className="campo" id="modelo_retorno" name="modelo_retorno" defaultValue={zap.config.modelo_retorno} /></div>
          <div><label className="rotulo" htmlFor="modelo_avaliacao">Modelo aprovado: convite de avaliação</label><input className="campo" id="modelo_avaliacao" name="modelo_avaliacao" defaultValue={zap.config.modelo_avaliacao} /></div>
          <div><label className="rotulo" htmlFor="modelo_manutencao">Modelo aprovado: lembrete de manutenção</label><input className="campo" id="modelo_manutencao" name="modelo_manutencao" defaultValue={zap.config.modelo_manutencao} /></div>
          <div><label className="rotulo" htmlFor="modelo_ligacao">Modelo aprovado: resposta a ligação não atendida</label><input className="campo" id="modelo_ligacao" name="modelo_ligacao" defaultValue={zap.config.modelo_ligacao} /></div>
          <div><label className="rotulo" htmlFor="modelo_lembrete_visita">Modelo aprovado: lembrete de visita</label><input className="campo" id="modelo_lembrete_visita" name="modelo_lembrete_visita" defaultValue={zap.config.modelo_lembrete_visita} /></div>
          <div><label className="rotulo" htmlFor="idioma_modelos">Idioma dos modelos</label><input className="campo" id="idioma_modelos" name="idioma_modelos" defaultValue={zap.config.idioma_modelos} /></div>
          <p className="text-sm text-suave sm:col-span-2">Fora das 24 horas depois da última mensagem do cliente, o WhatsApp só aceita modelos aprovados pela Meta. Sem modelo, o envio automático vira tarefa para uma pessoa. Endereço para os avisos da Meta (webhook): <code className="break-all">{base}/api/webhooks/whatsapp</code></p>
          <div className="sm:col-span-2"><Enviar>Salvar WhatsApp</Enviar></div>
        </Formulario>
      </Secao>

      <Secao id="ligacoes" titulo="Ligações não atendidas" nota="A empresa usa um número de um serviço de telefonia na internet, que toca nos celulares da equipe. Quando ninguém atende, o serviço avisa a plataforma: ela responde pelo WhatsApp quem autorizou, abre a oportunidade e cria a tarefa de retornar a ligação.">
        <div className="space-y-3 text-[15px]">
          <p className={`aviso ${telefonia ? 'bg-ok-clara text-ok' : 'bg-alerta-clara text-alerta'}`}>
            {telefonia ? `Serviço de telefonia ligado (chave terminando em ${telefonia.final}). ${telefonia.ultimo_aviso_em ? `Último aviso: ${dataHora(new Date(telefonia.ultimo_aviso_em))}.` : 'Nenhum aviso recebido ainda.'}` : 'Nenhum serviço de telefonia ligado ainda.'}
          </p>
          <p><strong>Pedir autorização na ligação:</strong> configure no menu do número, palavra por palavra, a frase “{FRASE_MENU_LIGACAO(empresa!.nome)}”, e mande aceite_whatsapp só quando a pessoa apertar 1 nesse menu. Cada aceite fica guardado com essa frase, o horário e o número da chamada, e vale só para a resposta daquela ligação. Sem o aceite, a mensagem só vai para quem autorizou no formulário (texto que inclui retornar ligações); para os outros, fica só a tarefa de retornar a ligação.</p>
          <p className="text-suave">Endereço para os avisos do serviço: <code className="break-all">{base}/api/webhooks/telefonia</code>, com a chave em “Authorization: Bearer” (ou como senha do acesso básico). Campos: de, id, status (nao_atendida, no-answer, busy…) e aceite_whatsapp.</p>
          {ctx.acessoAdmin ? (
            <Formulario acao={gerarChaveTelefoniaAcao}><Enviar secundario>{telefonia ? 'Trocar a chave do serviço' : 'Criar a chave do serviço'}</Enviar></Formulario>
          ) : (
            <p className="text-sm text-suave">A chave do serviço de telefonia é criada pela equipe Growlift.</p>
          )}
          {ambiente() !== 'producao' && (
            <Formulario acao={simularLigacaoAcao} className="grid gap-3 border-t border-linha pt-4 sm:grid-cols-2">
              <p className="font-semibold text-tinta sm:col-span-2">Simular uma ligação não atendida</p>
              <div><label className="rotulo" htmlFor="sim_tel">Telefone de quem ligou</label><input className="campo" id="sim_tel" name="telefone" inputMode="tel" placeholder="(11) 91234-5678" required /></div>
              <label className="flex min-h-11 items-center gap-3 self-end text-[15px]"><input type="checkbox" name="aceite" defaultChecked className="h-5 w-5 accent-[#175cd3]" /> Apertou 1 no menu (aceitou o WhatsApp)</label>
              <div className="sm:col-span-2"><Enviar secundario>Simular ligação</Enviar> <span className="ml-2 text-sm text-suave">Simulação — nenhuma mensagem externa enviada.</span></div>
            </Formulario>
          )}
          {ligacoes.length > 0 && (
            <div className="border-t border-linha pt-4">
              <p className="font-semibold text-tinta">Últimas ligações não atendidas</p>
              <ul className="mt-2 divide-y divide-linha">
                {ligacoes.map((l, i) => (
                  <li key={i} className="py-2">
                    <a className="underline" href={`/painel/oportunidades/${l.oportunidade_id}`}>{l.nome || formatarTelefone(l.telefone)}</a>
                    <span className="block text-sm text-suave">{dataHora(l.recebida_em)} · {({ mensagem_agendada: 'respondida pelo WhatsApp', sem_autorizacao: 'sem autorização de WhatsApp', telefone_fixo: 'telefone fixo', pediu_sair: 'tinha pedido para não receber mensagens', ja_respondida_hoje: 'já respondida nas últimas 24 h', limite: 'limite de respostas da hora', repetida: 'ligou de novo (sem nova mensagem)', desligado: 'resposta desligada', nao_enviada: 'mensagem não enviada', ja_recebida: '' } as Record<string, string>)[l.resultado] ?? l.resultado}{l.simulada ? ' · simulação' : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Secao>

      <Secao id="avaliacao" titulo="Avaliações" nota="Depois de um serviço concluído, o cliente recebe um convite neutro. A página do convite sempre mostra o link público, mesmo para quem deixar nota baixa no retorno privado.">
        <Formulario acao={salvarConfigAcao} className="space-y-3">
          <input type="hidden" name="secao" value="avaliacao" />
          <div><label className="rotulo" htmlFor="link">Link público de avaliação (por exemplo, do Google)</label><input className="campo" id="link" name="link" type="url" defaultValue={c.avaliacao.link} placeholder="https://" /></div>
          <Enviar>Salvar link</Enviar>
        </Formulario>
        {notas.length > 0 && (
          <div className="mt-4 border-t border-linha pt-4">
            <h3 className="font-bold">Convites e retornos privados</h3>
            <ul className="mt-2 divide-y divide-linha text-[15px]">
              {notas.map((n, i) => <li key={i} className="py-2"><span className="font-semibold text-tinta">{n.contato}</span> · convite em {dataHora(n.criado_em)} · {n.aberto_em ? 'abriu' : 'não abriu'}{n.clicou_publico_em ? ' · foi para a avaliação pública' : ''}{n.nota_privada ? ` · nota privada ${n.nota_privada}/5` : ''}{n.comentario_privado ? <span className="block text-sm">“{n.comentario_privado}”</span> : null}</li>)}
            </ul>
          </div>
        )}
      </Secao>

      <Secao id="site" titulo="Site da empresa" nota={`Página pública: ${base}/s/${empresa!.slug}. As perguntas frequentes vêm de “Conhecimento”.`}>
        <Formulario acao={salvarConfigAcao} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="secao" value="site" />
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="chamada">Chamada principal</label><input className="campo" id="chamada" name="chamada" defaultValue={c.site.chamada} maxLength={120} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="descricao">Apresentação</label><textarea className="campo" id="descricao" name="descricao" rows={3} defaultValue={c.site.descricao} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="servicos">Serviços (um por linha: Título | texto)</label><textarea className="campo" id="servicos" name="servicos" rows={4} defaultValue={linhas(c.site.servicos)} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="projetos">Projetos (um por linha: Título | texto). Só projetos reais da empresa.</label><textarea className="campo" id="projetos" name="projetos" rows={3} defaultValue={linhas(c.site.projetos)} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="areas">Áreas atendidas (separadas por vírgula)</label><input className="campo" id="areas" name="areas" defaultValue={c.site.areas.join(', ')} /></div>
          <div><label className="rotulo" htmlFor="whatsapp">WhatsApp de contato (com DDD)</label><input className="campo" id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={c.site.whatsapp} /></div>
          <div><label className="rotulo" htmlFor="semail">E-mail de contato</label><input className="campo" id="semail" name="email" type="email" defaultValue={c.site.email} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="endereco">Endereço ou cidade-sede</label><input className="campo" id="endereco" name="endereco" defaultValue={c.site.endereco} /></div>
          <div><label className="rotulo" htmlFor="razao_social">Razão social</label><input className="campo" id="razao_social" name="razao_social" defaultValue={c.site.razao_social} /></div>
          <div><label className="rotulo" htmlFor="cnpj">CNPJ</label><input className="campo" id="cnpj" name="cnpj" inputMode="numeric" defaultValue={c.site.cnpj} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="responsavel_dados">Quem responde por pedidos sobre dados pessoais (nome e contato)</label><input className="campo" id="responsavel_dados" name="responsavel_dados" defaultValue={c.site.responsavel_dados} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="privacidade">Política de privacidade (texto da empresa)</label><textarea className="campo" id="privacidade" name="privacidade" rows={6} defaultValue={c.site.privacidade} /><p className="mt-1 text-sm text-suave">A plataforma mostra o texto que a empresa escrever. Ela não garante adequação à lei: peça a revisão de um advogado.</p></div>
          <div className="sm:col-span-2"><Enviar>Salvar site</Enviar></div>
        </Formulario>
      </Secao>

      <Secao id="integrar" titulo="Formulário no seu site" nota="Quem já tem site não precisa trocar: dá para colocar o formulário dentro dele ou enviar os pedidos por integração.">
        <h3 className="font-bold">1. Formulário incorporado</h3>
        <p className="mt-1 text-[15px]">Cole este trecho na página do seu site onde o formulário deve aparecer:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-tinta p-3 text-[13px] text-white"><code>{`<iframe src="${base}/incorporar/${empresa!.chave_publica}" title="Pedir orçamento" style="width:100%;max-width:560px;height:920px;border:0" loading="lazy"></iframe>`}</code></pre>
        <h3 className="mt-4 font-bold">2. Chat com {c.ia.nome || 'a assistente'} no seu site</h3>
        <p className="mt-1 text-[15px]">Cole esta linha antes de <code>&lt;/body&gt;</code> em todas as páginas do site. Aparece um botão no canto; ao tocar, abre o chat.</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-tinta p-3 text-[13px] text-white"><code>{`<script src="${base}/chat.js" data-chave="${empresa!.chave_publica}" async></script>`}</code></pre>
        <p className="mt-1 text-sm text-suave">Opcional: <code>{'data-texto="Fale com a gente"'}</code> muda o texto do botão e <code>{'data-cor="#175cd3"'}</code> a cor. {c.ia.ativa ? '' : 'A assistente está desligada: o botão não abre o chat até ela ser ligada.'}</p>
        <h3 className="mt-4 font-bold">3. Envio por integração</h3>
        <p className="mt-1 text-[15px]">Endereço: <code className="break-all">POST {base}/api/publico/pedidos</code> · chave pública desta empresa: <code className="break-all">{empresa!.chave_publica}</code></p>
        <p className="mt-1 text-sm text-suave">A chave só identifica a empresa; não dá acesso a nenhum dado. O formato dos campos está no README.</p>
      </Secao>

      <Secao id="dados" titulo="Dados" nota="Exportação, exclusão e limpeza automática ficam registradas no histórico da empresa.">
        <Formulario acao={salvarConfigAcao} className="mb-4 grid gap-3 border-b border-linha pb-4 sm:grid-cols-2">
          <input type="hidden" name="secao" value="dados" />
          <div className="sm:col-span-2"><Num id="guarda_meses" rotulo="Apagar sozinho quem não virou cliente depois de quantos meses sem nenhum contato (0 = nunca apagar)" valor={c.dados.guarda_meses} min={0} max={120} /></div>
          <p className="text-sm text-suave sm:col-span-2">Uma vez por dia, o sistema apaga contatos que nunca fecharam negócio e não tiveram pedido, conversa, ligação nem visita nesse período, com tudo o que é deles. Clientes (venda ganha) não são apagados. {vencidos ? `Hoje seriam apagados ${vencidos} contato(s).` : 'Hoje nenhum contato seria apagado.'} Informe esse prazo na política de privacidade.</p>
          <div className="sm:col-span-2"><Enviar secundario>Salvar prazo</Enviar></div>
        </Formulario>
        <a className="botao-2" href="/api/exportar/contatos">Exportar contatos (CSV)</a>
        <p className="mt-3 text-sm text-suave">Para excluir os dados de uma pessoa, abra a oportunidade dela e use “Excluir este contato”. Prazos de guarda e o procedimento completo estão no README.</p>
      </Secao>
    </div>
  );
}

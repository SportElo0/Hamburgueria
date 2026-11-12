import { ativarEmpresaAcao, criarEmpresaAcao, entrarEmpresaAcao, sair, testarAssistenteAcao } from '@/app/acoes';
import { TestarAssistente } from '@/componentes/testar-assistente';
import { modeloPadrao } from '@/server/ia';
import { Marca } from '@/componentes/acesso';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { SEGMENTOS, ambiente } from '@/server/config';
import { q } from '@/server/db';
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
          <h2 id="t-nova" className="font-bold">Cadastrar empresa</h2>
          <p className="mt-1 text-sm text-suave">A empresa nasce com o formulário do segmento e conteúdo em branco. Nada é copiado de outras empresas.</p>
          <Formulario acao={criarEmpresaAcao} limpar className="mt-3 grid gap-3 sm:grid-cols-3">
            <div><label className="rotulo" htmlFor="nome">Nome</label><input className="campo" id="nome" name="nome" required minLength={2} /></div>
            <div><label className="rotulo" htmlFor="slug">Endereço (letras minúsculas e hífen)</label><input className="campo" id="slug" name="slug" required pattern="[a-z0-9-]{3,40}" /></div>
            <div><label className="rotulo" htmlFor="segmento">Segmento</label><select className="campo" id="segmento" name="segmento">{Object.entries(SEGMENTOS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</select></div>
            <label className="flex min-h-11 items-center gap-2 text-[15px] sm:col-span-2"><input type="checkbox" name="demonstracao" className="h-5 w-5" /> Empresa de demonstração (dados fictícios)</label>
            <div><Enviar>Cadastrar</Enviar></div>
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
            <p className="mt-1 text-sm text-suave">Simulação — nenhum e-mail externo enviado. Convites e links de senha aparecem aqui até um serviço de e-mail ser configurado. Esta lista não existe em produção.</p>
            {emails.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nenhum.</p> : <ul className="mt-2 divide-y divide-linha text-[15px]">{emails.map((m, i) => <li key={i} className="py-2"><span className="font-semibold text-tinta">{m.assunto}</span> · para {m.para} · {dataHora(m.criado_em)}<span className="block break-all text-sm">{m.corpo}</span></li>)}</ul>}
          </section>
        )}
      </main>
    </div>
  );
}

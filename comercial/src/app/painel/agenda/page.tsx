import Link from 'next/link';
import { linkAgendaAcao } from '@/app/acoes';
import { Enviar, Formulario } from '@/componentes/formulario';
import { Vazio } from '@/componentes/pedacos';
import { CartaoVisita } from '@/componentes/visita';
import { horariosLivres, temLinkAgenda, textoHorario, visitas } from '@/server/agenda';
import { empresaPorId } from '@/server/empresas';
import { exigirCtx } from '@/server/sessao';
import { dataLocal, dataValida, usaProfissionais } from '@/server/profissionais';
import { Horarios } from './horarios';

export const metadata = { title: 'Agenda' };

const DIA_MS = 86_400_000;

export default async function Agenda({ searchParams }: { searchParams: Promise<{ ver?: string; dia?: string }> }) {
  const ctx = await exigirCtx();
  const sp = await searchParams;
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const comProfissionais = await usaProfissionais(empresa.id);
  const ver = sp.ver === 'passadas' ? 'passadas' : sp.ver === 'visitas' || !comProfissionais ? 'visitas' : 'horarios';
  const passadas = ver === 'passadas';
  const fuso = empresa.config.regras.fuso;
  const agora = new Date();
  // Today's visits that already started stay on the main list until the day ends.
  const inicioHoje = new Date(agora.getTime() - 12 * 3_600_000);
  const [lista, livres, temLink] = await Promise.all([
    passadas ? visitas(ctx, new Date(agora.getTime() - 30 * DIA_MS), agora) : visitas(ctx, inicioHoje, new Date(agora.getTime() + 60 * DIA_MS)),
    horariosLivres(empresa, 6, agora),
    temLinkAgenda(ctx),
  ]);
  const ordenada = passadas ? [...lista].reverse() : lista;
  const porDia = new Map<string, typeof lista>();
  for (const v of ordenada) {
    const dia = textoHorario(v.inicio, fuso).split(' às ')[0];
    porDia.set(dia, [...(porDia.get(dia) ?? []), v]);
  }
  const aba = (rotulo: string, href: string, ativo: boolean) => (
    <Link href={href} aria-current={ativo ? 'true' : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${ativo ? 'bg-marca text-white' : 'border border-linha bg-white'}`}>{rotulo}</Link>
  );
  const dia = sp.dia && dataValida(sp.dia) ? sp.dia : dataLocal(new Date(), fuso);
  const linkPublico = `${process.env.APP_URL ?? ''}/agendar/${empresa.slug}`;
  return (
    <div className={`${ver === 'horarios' ? 'max-w-6xl' : 'max-w-3xl'} space-y-4`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Agenda de visitas</h1>
        {comProfissionais && empresa.config.agenda.ativa && (
          <a className="text-sm font-semibold text-marca underline-offset-2 hover:underline" href={`/agendar/${empresa.slug}`} target="_blank" rel="noreferrer">Ver a página em que o cliente marca ↗</a>
        )}
      </div>
      {!empresa.config.agenda.ativa && (
        <p className="aviso bg-alerta-clara text-alerta">A agenda está desligada: dá para marcar visitas pela oportunidade, mas a assistente não oferece horários. {ctx.papel === 'admin' ? <Link className="underline" href="/painel/configuracoes#agenda">Ligar em Configurações</Link> : 'Peça ao administrador para ligar.'}</p>
      )}
      <nav aria-label="O que ver" className="flex flex-wrap gap-1">
        {comProfissionais && aba('Horários', '/painel/agenda', ver === 'horarios')}
        {aba('Próximas visitas', comProfissionais ? '/painel/agenda?ver=visitas' : '/painel/agenda', ver === 'visitas')}
        {aba('Últimos 30 dias', '/painel/agenda?ver=passadas', passadas)}
        {!comProfissionais && ctx.papel === 'admin' && <Link href="/painel/agenda/profissionais" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-marca">+ Cadastrar profissionais</Link>}
      </nav>

      {ver === 'horarios' ? (
        <>
          <Horarios ctx={ctx} empresa={empresa} dia={dia} />
          {empresa.config.agenda.ativa && <p className="text-sm text-suave">Link para o cliente marcar sozinho: <code className="break-all">{linkPublico}</code></p>}
        </>
      ) : (
      <>

      {ordenada.length === 0 ? (
        <Vazio titulo={passadas ? 'Nenhuma visita nos últimos 30 dias.' : 'Nenhuma visita marcada.'}>Visitas são marcadas pela assistente (quando o cliente escolhe um horário) ou na página da oportunidade.</Vazio>
      ) : (
        [...porDia.entries()].map(([dia, vs]) => (
          <section key={dia} className="cartao p-4" aria-label={dia}>
            <h2 className="font-bold capitalize">{dia}</h2>
            <ul className="divide-y divide-linha">{vs.map((v) => <CartaoVisita key={v.id} v={v} fuso={fuso} empresa={empresa.nome} soHora />)}</ul>
          </section>
        ))
      )}

      {!passadas && empresa.config.agenda.ativa && (
        <section className="cartao p-4">
          <h2 className="font-bold">Próximos horários livres</h2>
          <p className="mt-1 text-sm text-suave">Os que a assistente oferece, conforme os dias, horários e quantas visitas ao mesmo tempo em Configurações.</p>
          {livres.length ? <ul className="mt-2 flex flex-wrap gap-2">{livres.map((h) => <li key={h.id} className="rounded-full border border-linha bg-white px-3 py-1 text-sm">{h.texto}</li>)}</ul> : <p className="mt-2 text-sm text-suave">Nenhum horário livre na janela configurada.</p>}
        </section>
      )}

      </>
      )}

      <section className="cartao p-4">
        <h2 className="font-bold">Ver no Google Agenda</h2>
        <p className="mt-1 text-[15px] text-suave">Um endereço só seu, para o Google Agenda (ou a agenda do celular) mostrar as visitas{ctx.papel === 'admin' ? ' da empresa' : ' em que você é o responsável'}. Ele mostra o primeiro nome do cliente e o endereço; o resto fica no painel. O Google atualiza esse tipo de agenda de tempos em tempos (pode levar algumas horas). Não compartilhe o link: quem tiver o endereço vê as visitas. Se ele vazar, crie um novo.</p>
        {ctx.acessoAdmin ? <p className="mt-2 text-sm text-suave">O acesso da equipe Growlift não cria link de agenda.</p> : (
          <Formulario acao={linkAgendaAcao} className="mt-3"><Enviar secundario>{temLink ? 'Criar um link novo (o anterior para de valer)' : 'Criar meu link da agenda'}</Enviar></Formulario>
        )}
      </section>
    </div>
  );
}
